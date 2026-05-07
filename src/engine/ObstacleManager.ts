import type { PhysicsWorld } from './PhysicsWorld';
import type { MapEntity } from '@/types/game';

interface DynamicObstacle {
  id: string;
  physicsId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  createdAt: number;
  duration: number;
  alpha: number;
}

interface XRange {
  min: number;
  max: number;
}

const BALL_RADIUS = 0.5;
/** Gaps narrower than this are treated as passages — no obstacles allowed */
const PASSAGE_THRESHOLD = 5.0;
const SPAWN_RETRY_LIMIT = 3;

export class ObstacleManager {
  private obstacles: Map<string, DynamicObstacle> = new Map();
  private physics: PhysicsWorld;
  private pendingActions: (() => void)[] = [];
  private nextId = 0;
  private mapEntities: MapEntity[] = [];

  constructor(physics: PhysicsWorld) {
    this.physics = physics;
  }

  setMapEntities(entities: MapEntity[]): void {
    this.mapEntities = entities;
  }

  spawn(x: number, y: number, angle: number = 0): string | null {
    const id = `obs_${this.nextId++}`;
    const width = 1.5 + Math.random() * 1.5;
    const height = 0.3;

    if (this.isBlockingPassage(x, y, width)) {
      return null;
    }

    this.pendingActions.push(() => {
      const physicsId = this.physics.addObstacle(x, y, width, height, angle);
      this.obstacles.set(id, {
        id,
        physicsId,
        x,
        y,
        width,
        height,
        angle,
        createdAt: Date.now(),
        duration: 4000 + Math.random() * 3000,
        alpha: 0,
      });
    });

    return id;
  }

  spawnNearLeader(leaderX: number, leaderY: number): string | null {
    for (let attempt = 0; attempt < SPAWN_RETRY_LIMIT; attempt++) {
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetY = leaderY + 1 + Math.random() * 2;
      const angle = (Math.random() - 0.5) * Math.PI * 0.4;
      const result = this.spawn(leaderX + offsetX, offsetY, angle);
      if (result) return result;
    }
    return null;
  }

  // --------------- passage detection ---------------

  private isBlockingPassage(x: number, y: number, width: number): boolean {
    if (this.mapEntities.length === 0) return false;

    const occupied = this.mergeRanges(this.getOccupiedRangesAtY(y));
    const obsLeft = x - width / 2;
    const obsRight = x + width / 2;

    for (let i = 0; i < occupied.length - 1; i++) {
      const gapLeft = occupied[i].max;
      const gapRight = occupied[i + 1].min;
      const gapWidth = gapRight - gapLeft;

      if (gapWidth >= PASSAGE_THRESHOLD) continue;
      // Obstacle overlaps this narrow gap
      if (obsRight > gapLeft && obsLeft < gapRight) {
        return true;
      }
    }

    return false;
  }

  private getOccupiedRangesAtY(y: number): XRange[] {
    const ranges: XRange[] = [];

    for (const entity of this.mapEntities) {
      const [px, py] = entity.position;

      if (entity.shape === 'polyline' && entity.vertices) {
        for (let i = 0; i < entity.vertices.length - 1; i++) {
          const x1 = px + entity.vertices[i][0];
          const y1 = py + entity.vertices[i][1];
          const x2 = px + entity.vertices[i + 1][0];
          const y2 = py + entity.vertices[i + 1][1];

          const segMinY = Math.min(y1, y2);
          const segMaxY = Math.max(y1, y2);

          if (y >= segMinY && y <= segMaxY) {
            if (Math.abs(y2 - y1) < 0.001) {
              // Horizontal segment
              ranges.push({
                min: Math.min(x1, x2) - BALL_RADIUS,
                max: Math.max(x1, x2) + BALL_RADIUS,
              });
            } else {
              const t = (y - y1) / (y2 - y1);
              const xAtY = x1 + t * (x2 - x1);
              ranges.push({ min: xAtY - BALL_RADIUS, max: xAtY + BALL_RADIUS });
            }
          }
        }
      }

      if (entity.shape === 'circle' && entity.radius) {
        const r = entity.radius + BALL_RADIUS;
        const dy = y - py;
        if (Math.abs(dy) < r) {
          const xExtent = Math.sqrt(r * r - dy * dy);
          ranges.push({ min: px - xExtent, max: px + xExtent });
        }
      }

      if (entity.shape === 'box' && entity.width && entity.height) {
        const hw = entity.width / 2;
        const hh = entity.height / 2;

        if (entity.type === 'kinematic' || (entity.angle && Math.abs(entity.angle) > 0.01)) {
          // Rotating or angled box — use bounding circle
          const radius = Math.sqrt(hw * hw + hh * hh) + BALL_RADIUS;
          const dy = y - py;
          if (Math.abs(dy) < radius) {
            const xExtent = Math.sqrt(radius * radius - dy * dy);
            ranges.push({ min: px - xExtent, max: px + xExtent });
          }
        } else {
          // Axis-aligned static box
          if (Math.abs(y - py) <= hh + BALL_RADIUS) {
            ranges.push({ min: px - hw - BALL_RADIUS, max: px + hw + BALL_RADIUS });
          }
        }
      }
    }

    return ranges;
  }

  private mergeRanges(ranges: XRange[]): XRange[] {
    if (ranges.length === 0) return [];
    const sorted = [...ranges].sort((a, b) => a.min - b.min);
    const merged: XRange[] = [{ ...sorted[0] }];
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      if (sorted[i].min <= last.max) {
        last.max = Math.max(last.max, sorted[i].max);
      } else {
        merged.push({ ...sorted[i] });
      }
    }
    return merged;
  }

  processPending(): void {
    for (const action of this.pendingActions) {
      action();
    }
    this.pendingActions = [];
  }

  update(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, obs] of this.obstacles) {
      const elapsed = now - obs.createdAt;
      const progress = elapsed / obs.duration;

      if (progress < 0.1) {
        obs.alpha = progress / 0.1;
      } else if (progress > 0.8) {
        obs.alpha = (1 - progress) / 0.2;
      } else {
        obs.alpha = 1;
      }

      if (elapsed >= obs.duration) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.remove(id);
    }
  }

  private remove(id: string): void {
    const obs = this.obstacles.get(id);
    if (obs) {
      this.pendingActions.push(() => {
        this.physics.removeBody(obs.physicsId);
        this.obstacles.delete(id);
      });
    }
  }

  getRenderData(): { x: number; y: number; w: number; h: number; angle: number; alpha: number }[] {
    return Array.from(this.obstacles.values()).map((obs) => ({
      x: obs.x,
      y: obs.y,
      w: obs.width,
      h: obs.height,
      angle: obs.angle,
      alpha: obs.alpha,
    }));
  }

  clear(): void {
    for (const [, obs] of this.obstacles) {
      this.physics.removeBody(obs.physicsId);
    }
    this.obstacles.clear();
    this.pendingActions = [];
  }
}
