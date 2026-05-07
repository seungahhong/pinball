import type { GameState, MapData, MarbleData, WinMode, GoalEvent } from '@/types/game';
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

export class GameLoop {
  private renderer: Renderer;
  private physics!: PhysicsWorld;
  private marbleManager!: MarbleManager;
  private obstacleManager!: ObstacleManager;
  private particles!: ParticleSystem;

  private state: GameState = 'idle';
  private map: MapData | null = null;
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
  private switchEnabled = true;
  private obstacleEnabled = true;

  private destroyed = false;
  private ready = false;
  private manualCamera = false;

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

  setMap(map: MapData): void {
    this.map = map;
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
    this.setState('ready');
  }

  start(): void {
    if (this.state !== 'ready' || !this.marbleManager) return;
    this.manualCamera = false;
    this.marbleManager.activateAll();
    this.lastSwitchTime = Date.now();
    this.lastObstacleTime = Date.now();
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

  getState(): GameState {
    return this.state;
  }

  resize(): void {
    this.renderer.resize();
  }

  scrollCamera(deltaY: number): void {
    if (this.state === 'running') return;
    this.manualCamera = true;
    this.renderer.camera.offsetTarget(0, deltaY / this.renderer.camera.zoom);
  }

  zoomCamera(delta: number): void {
    if (this.state === 'running') return;
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

    // Always step physics so kinematic bodies (windmills) rotate
    this.elapsed += dt * (this.state === 'running' ? this.speedMultiplier : 1);
    while (this.elapsed >= FIXED_STEP) {
      this.obstacleManager?.processPending();
      this.physics.step(FIXED_STEP);
      this.elapsed -= FIXED_STEP;
    }

    if (this.state === 'running') {
      this.updateGameLogic();
      this.updateCamera(marbleRenderData);
      this.obstacleManager.update();
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

    const reached = this.marbleManager.checkGoals(this.map.goalY);
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

    if (this.switchEnabled && now - this.lastSwitchTime > SWITCH_RANDOM_INTERVAL) {
      this.lastSwitchTime = now + Math.random() * 4000;
      this.triggerSwitch();
    }

    if (this.obstacleEnabled && now - this.lastObstacleTime > OBSTACLE_RANDOM_INTERVAL) {
      this.lastObstacleTime = now + Math.random() * 3000;
      this.triggerObstacle();
    }

    // Goal proximity effects — single leader lookup for both switch and obstacle
    if (this.switchEnabled || this.obstacleEnabled) {
      const leader = this.marbleManager.getLeadMarble(this.map.goalY);
      if (leader) {
        const pos = this.physics.getMarblePosition(leader.physicsId);
        if (pos) {
          const progress = pos.y / this.map.goalY;
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

  destroy(): void {
    this.destroyed = true;
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
