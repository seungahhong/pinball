import type {
  GameState,
  MapData,
  MapEntity,
  MarbleData,
  WinMode,
  GoalEvent,
  SpecialMode,
} from '@/types/game';
import { PhysicsWorld, initBox2D } from './PhysicsWorld';
import { Renderer, type MarbleRenderData } from './Renderer';
import { MarbleManager } from './MarbleManager';
import { ObstacleManager } from './ObstacleManager';
import { ParticleSystem } from './ParticleSystem';
import { gameEvents } from './EventBus';

const FIXED_STEP = 1 / 100;
const SWITCH_RANDOM_INTERVAL = 8000;
const OBSTACLE_RANDOM_INTERVAL = 6000;
const GOAL_PROXIMITY_THRESHOLD = 0.7;
const SPECIAL_TRIGGER_THRESHOLD = 2 / 3;
const MAX_PARTICLES = 500;
const STUCK_NUDGE_THRESHOLD_MS = 1500;
const STUCK_NUDGE_INTERVAL_MS = 500;

export class GameLoop {
  private renderer: Renderer;
  private physics!: PhysicsWorld;
  private marbleManager!: MarbleManager;
  private obstacleManager!: ObstacleManager;
  private particles!: ParticleSystem;

  private state: GameState = 'idle';
  private map: MapData | null = null;
  private originalMap: MapData | null = null;
  private winMode: WinMode = 'first';
  private customRank = 1;
  private winners: GoalEvent[] = [];
  private winnersDisplay: { name: string; color: string }[] = [];

  private animFrameId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private speedMultiplier = 1;

  private lastSwitchTime = 0;
  private lastObstacleTime = 0;
  private lastNudgeTime = 0;
  private switchEnabled = true;
  private obstacleEnabled = true;

  private destroyed = false;
  private ready = false;
  private manualCamera = false;

  // Special effect state
  private specialMode: SpecialMode = 'none';
  private specialTriggered = false;
  private isPaused = false;
  private isGravityReversed = false;
  private vortexActive = false;
  private flipGeneration = 0;
  private flipTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
  }

  async init(): Promise<void> {
    const box2d = await initBox2D();
    if (this.destroyed) return;

    this.physics = new PhysicsWorld(box2d);
    this.marbleManager = new MarbleManager(this.physics);
    this.obstacleManager = new ObstacleManager(this.physics);
    this.particles = new ParticleSystem();
    this.renderer.resize();
    this.ready = true;
    this.loop(performance.now());
  }

  private resetSpecialState(): void {
    this.specialTriggered = false;
    this.isGravityReversed = false;
    this.vortexActive = false;
    this.isPaused = false;
    this.renderer.directionReversed = false;
    this.particles?.setGravityReversed(false);
    this.clearFlipTimers();
    this.flipGeneration++;
    if (this.physics) this.physics.setGravity(0, 10);
  }

  private clearFlipTimers(): void {
    for (const id of this.flipTimers) clearTimeout(id);
    this.flipTimers = [];
  }

  setMap(map: MapData): void {
    this.map = { ...map, entities: [...map.entities] };
    this.originalMap = map;
    this.resetSpecialState();
    if (this.physics) {
      this.physics.loadMap(map);
      this.obstacleManager?.setMapEntities(map.entities);
      const midX = map.spawnArea.x + map.spawnArea.width / 2;
      const midY = map.spawnArea.y;
      this.renderer.camera.setTarget(midX, midY, 25);
    }
  }

  setMarbles(data: MarbleData[]): void {
    if (!this.map || !this.marbleManager) return;
    this.marbleManager.setMarbles(data, this.map);
    this.winners = [];
    this.winnersDisplay = [];
    this.resetSpecialState();
    this.setState('ready');
  }

  start(): void {
    if (this.state !== 'ready' || !this.marbleManager) return;
    this.manualCamera = false;
    this.marbleManager.activateAll();
    this.lastSwitchTime = Date.now();
    this.lastObstacleTime = Date.now();
    this.lastNudgeTime = Date.now();
    this.setState('running');
  }

  shuffle(): void {
    if (!this.marbleManager) return;
    this.marbleManager.shuffle();
  }

  setWinMode(mode: WinMode, rank?: number): void {
    this.winMode = mode;
    if (rank !== undefined) this.customRank = rank;
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  setTheme(dark: boolean): void {
    this.renderer.setTheme(dark);
  }

  setSwitchEnabled(enabled: boolean): void {
    this.switchEnabled = enabled;
  }

  setObstacleEnabled(enabled: boolean): void {
    this.obstacleEnabled = enabled;
  }

  setSpecialMode(mode: SpecialMode): void {
    this.specialMode = mode;
  }

  getState(): GameState {
    return this.state;
  }

  resize(): void {
    this.renderer.resize();
  }

  getDiagnostics(): {
    state: GameState;
    isGravityReversed: boolean;
    isPaused: boolean;
    map: { goalY: number; spawnArea: MapData['spawnArea'] } | null;
    originalGoalY: number | null;
    marbles: { id: number; name: string; x: number; y: number; finished: boolean }[];
    walls: { side: 'left' | 'right' | 'floor'; x?: number; y?: number; vertices: number[][] }[];
  } {
    const marbles = this.marbleManager
      ? this.marbleManager['marbles'].map((m) => {
          const pos = this.physics.getMarblePosition(m.physicsId);
          return {
            id: m.data.id,
            name: m.data.name,
            x: pos?.x ?? NaN,
            y: pos?.y ?? NaN,
            finished: m.finished,
          };
        })
      : [];
    const walls: { side: 'left' | 'right' | 'floor'; vertices: number[][] }[] = [];
    if (this.map) {
      for (const e of this.map.entities) {
        if (e.shape === 'polyline' && e.vertices && e.vertices.length === 2) {
          const dy = Math.abs(e.vertices[0][1] - e.vertices[1][1]);
          const maxVertY = Math.max(e.vertices[0][1], e.vertices[1][1]);
          if (dy > 20) {
            walls.push({
              side: e.vertices[0][0] < 0 ? 'left' : 'right',
              vertices: e.vertices,
            });
          } else if (dy < 1 && this.originalMap && maxVertY > this.originalMap.goalY * 0.8) {
            walls.push({ side: 'floor', vertices: e.vertices });
          }
        }
      }
    }
    return {
      state: this.state,
      isGravityReversed: this.isGravityReversed,
      isPaused: this.isPaused,
      map: this.map ? { goalY: this.map.goalY, spawnArea: this.map.spawnArea } : null,
      originalGoalY: this.originalMap?.goalY ?? null,
      marbles,
      walls,
    };
  }

  scrollCamera(deltaY: number): void {
    if (this.state === 'running' && !this.isGravityReversed) return;
    this.manualCamera = true;
    this.renderer.camera.offsetTarget(0, deltaY / this.renderer.camera.zoom);
  }

  zoomCamera(delta: number): void {
    if (this.state === 'running' && !this.isGravityReversed) return;
    this.manualCamera = true;
    this.renderer.camera.adjustZoom(delta);
  }

  private setState(state: GameState): void {
    this.state = state;
    gameEvents.emit('game:stateChange', { state });
  }

  private loop = (timestamp: number): void => {
    if (this.destroyed) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (!this.ready) return;

    const marbleRenderData = this.marbleManager?.getRenderData() || [];

    // Step physics (skip if paused for map flip)
    if (!this.isPaused) {
      this.elapsed += dt * (this.state === 'running' ? this.speedMultiplier : 1);
      while (this.elapsed >= FIXED_STEP) {
        this.obstacleManager?.processPending();
        this.physics.step(FIXED_STEP);
        this.elapsed -= FIXED_STEP;
      }
    }

    if (this.state === 'running' && !this.isPaused) {
      this.updateGameLogic();
      this.updateCamera(marbleRenderData);
      this.obstacleManager.update();
    }

    // Emit vortex particles continuously while gravity is reversed (with cap)
    if (this.vortexActive && this.map && this.particles.getCount() < MAX_PARTICLES) {
      const centerX = this.map.spawnArea.x + this.map.spawnArea.width / 2;
      this.particles.emitVortex(centerX, this.map.goalY, 2);
      for (const m of marbleRenderData) {
        if (Math.random() < 0.3) {
          this.particles.emitUpwardDust(m.x, m.y, 1);
        }
      }
    }

    this.particles.update(dt);
    this.renderer.camera.update(dt);

    const entityTransforms = this.physics?.getEntityTransforms() || [];

    this.renderer.render(
      this.map,
      marbleRenderData,
      this.particles.getRenderData(),
      this.winnersDisplay,
      this.obstacleManager?.getRenderData() || [],
      entityTransforms,
    );
  };

  private updateGameLogic(): void {
    if (!this.map || !this.marbleManager) return;
    const now = Date.now();

    const reached = this.marbleManager.checkGoals(this.map.goalY, this.isGravityReversed);
    for (const m of reached) {
      const rank = this.winners.length + 1;
      const event: GoalEvent = {
        marbleId: m.data.id,
        playerName: m.data.name,
        rank,
      };
      this.winners.push(event);
      this.winnersDisplay.push({ name: m.data.name, color: m.data.color });
      gameEvents.emit('goal:reached', event);

      const pos = this.physics.getMarblePosition(m.physicsId);
      if (pos) {
        this.particles.emit(pos.x, pos.y, 30);
      }

      this.marbleManager.scheduleRemoval(m.physicsId);
    }

    if (this.checkWinCondition()) {
      this.setState('finished');
      gameEvents.emit('game:finished', { winners: this.winners });
      return;
    }

    // Check for special effect trigger at 2/3 point
    if (this.specialMode !== 'none' && !this.specialTriggered) {
      this.checkSpecialTrigger();
    }

    if (now - this.lastNudgeTime > STUCK_NUDGE_INTERVAL_MS) {
      this.lastNudgeTime = now;
      this.marbleManager.nudgeStuck(STUCK_NUDGE_THRESHOLD_MS, this.isGravityReversed ? -1 : 1, now);
    }

    if (this.switchEnabled && now - this.lastSwitchTime > SWITCH_RANDOM_INTERVAL) {
      this.lastSwitchTime = now + Math.random() * 4000;
      this.triggerSwitch();
    }

    if (this.obstacleEnabled && now - this.lastObstacleTime > OBSTACLE_RANDOM_INTERVAL) {
      this.lastObstacleTime = now + Math.random() * 3000;
      this.triggerObstacle();
    }

    // Goal proximity effects
    if (this.switchEnabled || this.obstacleEnabled) {
      const leader = this.marbleManager.getLeadMarble(this.map.goalY, this.isGravityReversed);
      if (leader) {
        const pos = this.physics.getMarblePosition(leader.physicsId);
        if (pos) {
          const progress = this.isGravityReversed
            ? 1 - pos.y / (this.originalMap?.goalY ?? this.map.goalY)
            : pos.y / this.map.goalY;
          if (progress > GOAL_PROXIMITY_THRESHOLD) {
            if (this.switchEnabled && Math.random() < 0.005) {
              this.triggerSwitch();
            }
            if (this.obstacleEnabled && Math.random() < 0.003) {
              this.obstacleManager.spawnNearLeader(pos.x, pos.y);
            }
          }
        }
      }
    }
  }

  private checkSpecialTrigger(): void {
    if (!this.map || !this.marbleManager || !this.originalMap) return;

    const leader = this.marbleManager.getLeadMarble(this.originalMap.goalY);
    if (!leader) return;

    const pos = this.physics.getMarblePosition(leader.physicsId);
    if (!pos) return;

    const progress = pos.y / this.originalMap.goalY;
    if (progress < SPECIAL_TRIGGER_THRESHOLD) return;

    this.specialTriggered = true;

    if (this.specialMode === 'mapFlip') {
      this.triggerMapFlip();
    } else if (this.specialMode === 'gravityReverse') {
      this.triggerGravityReverse();
    }
  }

  private triggerMapFlip(): void {
    if (!this.map || !this.originalMap) return;

    const gen = this.flipGeneration;

    // 1. Pause physics — balls freeze in place
    this.isPaused = true;
    this.physics.pauseMarbles();

    // 2. Shake (0.6s) then 180° flip rotation (1.4s)
    gameEvents.emit('effect:shake', undefined as never);
    this.renderer.showEffectAlert('맵 뒤집기!', '#FF6B35');

    // 3. After shake, start 180° flip animation
    const flipStartTimer = setTimeout(() => {
      if (this.destroyed || gen !== this.flipGeneration) return;
      gameEvents.emit('effect:mapFlip', undefined as never);

      // 4. At flip midpoint (0.7s into 1.4s animation), swap map data
      const swapTimer = setTimeout(() => {
        if (this.destroyed || gen !== this.flipGeneration) return;
        if (!this.map || !this.originalMap) return;

        // Flip obstacle Y positions while preserving slopes for downward gravity.
        // flip Y position → then swap vertex Ys → net: position changes, slope preserved
        const flippedEntities = this.flipObstaclesKeepWalls(this.originalMap);
        this.map = { ...this.map, entities: flippedEntities };
        this.physics.loadMap(this.map);
        this.obstacleManager?.setMapEntities(this.map.entities);
      }, 700);
      this.flipTimers.push(swapTimer);

      // 5. After flip animation completes, resume with downward kick
      const resumeTimer = setTimeout(() => {
        if (this.destroyed || gen !== this.flipGeneration) return;
        this.isPaused = false;
        this.physics.resumeMarbles();
        // Kick balls downward to push through any edge cases
        this.physics.applyImpulseToAllMarbles((Math.random() - 0.5) * 3, 10);
      }, 1600);
      this.flipTimers.push(resumeTimer);
    }, 700);
    this.flipTimers.push(flipStartTimer);
  }

  /**
   * Flip obstacle positions (Y-axis) while keeping walls intact and
   * preserving slope directions so balls can still fall downward through them.
   *
   * For each non-wall entity:
   *   - Position Y is flipped around the map center axis
   *   - Polyline vertex Ys are flipped then swapped (net: position moves, slope preserved)
   *   - Angles and angular velocities stay the same (flip+reverse = identity)
   */
  private flipObstaclesKeepWalls(originalMap: MapData): MapEntity[] {
    const flipAxis = (originalMap.spawnArea.y + originalMap.goalY) / 2;
    const flipY = (y: number) => 2 * flipAxis - y;

    return originalMap.entities.map((entity) => {
      // Preserve boundary walls
      if (entity.shape === 'polyline' && entity.vertices && entity.vertices.length === 2) {
        const [v1, v2] = entity.vertices;
        const dy = Math.abs(v1[1] - v2[1]);
        const maxVertY = Math.max(v1[1], v2[1]);
        if (dy > 20 || (dy < 1 && maxVertY > originalMap.goalY * 0.8)) {
          return entity;
        }
      }

      const result: MapEntity = {
        ...entity,
        position: [entity.position[0], flipY(entity.position[1])] as [number, number],
        // Angles stay the same: flipEntities negates, reverseObstacleDirections negates back
      };

      if (entity.vertices && entity.vertices.length >= 2) {
        // Flip Ys then swap order → slope direction preserved at new position
        const flippedYs = entity.vertices.map((v) => flipY(v[1]));
        const swappedYs = [...flippedYs].reverse();
        result.vertices = entity.vertices.map((v, i) => [v[0], swappedYs[i]]);
      }

      return result;
    });
  }

  /**
   * Reverse obstacle slopes/angles without changing positions.
   * Polyline Y-values are swapped between vertices — this reverses the slope
   * while keeping X anchored (wall connections preserved).
   * Box angles are negated. Kinematic angular velocities are negated.
   */
  private reverseObstacleDirections(map: MapData): MapEntity[] {
    return map.entities.map((entity) => {
      const reversed: MapEntity = { ...entity };

      // Swap Y values between polyline vertices to reverse slope
      if (entity.shape === 'polyline' && entity.vertices && entity.vertices.length >= 2) {
        const ys = entity.vertices.map((v) => v[1]);
        const swappedYs = [...ys].reverse();
        reversed.vertices = entity.vertices.map((v, i) => [v[0], swappedYs[i]]);
      }

      // Negate box angles
      if (entity.angle) {
        reversed.angle = -entity.angle;
      }

      // Reverse kinematic body rotation
      if (entity.props?.angularVelocity) {
        reversed.props = { ...entity.props, angularVelocity: -entity.props.angularVelocity };
      }

      return reversed;
    });
  }

  // Keep flipEntities for mapFlip feature (uses Y-axis position flip)
  private flipEntities(originalMap: MapData): MapEntity[] {
    const flipAxis = (originalMap.spawnArea.y + originalMap.goalY) / 2;
    const flipY = (y: number) => 2 * flipAxis - y;

    return originalMap.entities.map((entity) => {
      const flipped: MapEntity = {
        ...entity,
        position: [entity.position[0], flipY(entity.position[1])] as [number, number],
      };

      if (entity.vertices) {
        flipped.vertices = entity.vertices.map((v) => [v[0], flipY(v[1])]);
      }

      if (entity.angle) {
        flipped.angle = -entity.angle;
      }

      if (entity.props?.angularVelocity) {
        flipped.props = { ...entity.props, angularVelocity: -entity.props.angularVelocity };
      }

      return flipped;
    });
  }

  private triggerGravityReverse(): void {
    if (!this.map || !this.originalMap) return;

    // 1. Reverse gravity
    this.isGravityReversed = true;
    this.physics.setGravity(0, -15);

    // 2. Reverse obstacle slopes/angles (walls preserved, only directions change)
    const reversedEntities = this.reverseObstacleDirections(this.map);
    const goalOffset = 3;
    this.map = {
      ...this.map,
      entities: reversedEntities,
      goalY: Math.max(this.originalMap.spawnArea.y - goalOffset, 0),
    };

    // 3. Reload physics with reversed obstacle directions
    this.physics.loadMap(this.map);
    this.obstacleManager?.setMapEntities(this.map.entities);

    // 4. Strong initial upward impulse
    this.physics.applyImpulseToAllMarbles(0, -25);

    // 5. Update renderer direction
    this.renderer.directionReversed = true;

    // 6. Update particle system
    this.particles.setGravityReversed(true);
    this.vortexActive = true;

    // 7. Reset camera to auto-track with wider zoom
    this.manualCamera = false;

    // 8. Emit events
    gameEvents.emit('effect:gravityReverse', undefined as never);
    this.renderer.showEffectAlert('중력 거스리기!', '#A78BFA');
  }

  private triggerSwitch(): void {
    const result = this.marbleManager.swapRandom();
    if (result) {
      gameEvents.emit('marble:switch', result);
      this.renderer.showSwitchAlert(result.nameA, result.nameB);
    }
  }

  private triggerObstacle(): void {
    if (!this.map) return;
    for (let attempt = 0; attempt < 5; attempt++) {
      const x = this.map.spawnArea.x + Math.random() * this.map.spawnArea.width;
      const y = this.map.goalY * (0.3 + Math.random() * 0.5);
      const angle = (Math.random() - 0.5) * Math.PI * 0.3;
      if (this.obstacleManager.spawn(x, y, angle)) return;
    }
  }

  private checkWinCondition(): boolean {
    if (!this.marbleManager) return false;
    switch (this.winMode) {
      case 'first':
        return this.winners.length >= 1;
      case 'last':
        return this.marbleManager.allFinished();
      case 'custom':
        return this.winners.length >= this.customRank;
    }
  }

  private updateCamera(marbles: MarbleRenderData[]): void {
    if (this.manualCamera) return;
    if (!this.map || marbles.length === 0) return;

    if (this.isGravityReversed) {
      // Follow the topmost (smallest y) marble in real-time — mirrors the
      // normal-gravity case which targets the bottommost marble.
      let leadX = marbles[0].x;
      let leadY = marbles[0].y;
      for (const m of marbles) {
        if (m.y < leadY) {
          leadY = m.y;
          leadX = m.x;
        }
      }
      const ogGoalY = this.originalMap?.goalY ?? this.map.goalY;
      const zoomProgress = Math.min(Math.max((ogGoalY - leadY) / ogGoalY, 0), 1);
      const zoom = 25 + zoomProgress * 15;
      this.renderer.camera.setTarget(leadX, leadY, zoom);
    } else {
      let maxY = -Infinity;
      let leadX = 0;
      let leadY = 0;
      for (const m of marbles) {
        if (m.y > maxY) {
          maxY = m.y;
          leadX = m.x;
          leadY = m.y;
        }
      }
      const zoomProgress = Math.min(maxY / this.map.goalY, 1);
      const zoom = 25 + zoomProgress * 15;
      this.renderer.camera.setTarget(leadX, leadY, zoom);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.vortexActive = false;
    this.clearFlipTimers();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.marbleManager?.clear();
    this.obstacleManager?.clear();
    this.particles?.clear();
    this.physics?.destroy();
    gameEvents.clear();
  }
}
