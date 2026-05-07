import type { MarbleData, MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';
import type { PhysicsWorld } from './PhysicsWorld';
import type { MarbleRenderData } from './Renderer';

interface ManagedMarble {
  data: MarbleData;
  physicsId: number;
  radius: number;
  finished: boolean;
}

export class MarbleManager {
  private marbles: ManagedMarble[] = [];
  private physics: PhysicsWorld;

  constructor(physics: PhysicsWorld) {
    this.physics = physics;
  }

  setMarbles(names: MarbleData[], map: MapData): void {
    this.clear();
    const { spawnArea } = map;
    const cols = Math.ceil(Math.sqrt(names.length));
    const spacing = Math.min(spawnArea.width / cols, 1.8);

    names.forEach((data, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spawnArea.x + col * spacing + (Math.random() - 0.5) * 0.2;
      const y = spawnArea.y + row * spacing + (Math.random() - 0.5) * 0.2;
      const radius = 0.5;
      const physicsId = this.physics.createMarble(x, y, radius);

      this.marbles.push({
        data: {
          ...data,
          color: data.color || tokens.marble[i % tokens.marble.length],
        },
        physicsId,
        radius,
        finished: false,
      });
    });
  }

  activateAll(): void {
    for (const m of this.marbles) {
      this.physics.activateMarble(m.physicsId);
    }
  }

  shuffle(): void {
    const indices = this.marbles.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let i = 0; i < indices.length; i++) {
      if (indices[i] !== i) {
        const target = indices.indexOf(i, i + 1);
        if (target !== -1) {
          this.physics.swapMarbles(this.marbles[i].physicsId, this.marbles[target].physicsId);
          [indices[i], indices[target]] = [indices[target], indices[i]];
        }
      }
    }
  }

  swapRandom(): { idA: number; idB: number; nameA: string; nameB: string } | null {
    const active = this.marbles.filter((m) => !m.finished);
    if (active.length < 2) return null;

    const idxA = Math.floor(Math.random() * active.length);
    let idxB = Math.floor(Math.random() * (active.length - 1));
    if (idxB >= idxA) idxB++;

    const a = active[idxA];
    const b = active[idxB];

    // Swap names and colors (not physics bodies — the visual identity switches)
    const tmpData = a.data;
    a.data = b.data;
    b.data = tmpData;

    return { idA: a.data.id, idB: b.data.id, nameA: a.data.name, nameB: b.data.name };
  }

  getLeadMarble(_goalY?: number): ManagedMarble | null {
    let leader: ManagedMarble | null = null;
    let maxY = -Infinity;

    for (const m of this.marbles) {
      if (m.finished) continue;
      const pos = this.physics.getMarblePosition(m.physicsId);
      if (pos && pos.y > maxY) {
        maxY = pos.y;
        leader = m;
      }
    }
    return leader;
  }

  checkGoals(goalY: number): ManagedMarble[] {
    const reached: ManagedMarble[] = [];
    for (const m of this.marbles) {
      if (m.finished) continue;
      const pos = this.physics.getMarblePosition(m.physicsId);
      if (pos && pos.y + m.radius >= goalY) {
        m.finished = true;
        reached.push(m);
      }
    }
    return reached;
  }

  scheduleRemoval(physicsId: number): void {
    setTimeout(() => this.physics.removeMarble(physicsId), 500);
  }

  allFinished(): boolean {
    return this.marbles.every((m) => m.finished);
  }

  getActiveCount(): number {
    return this.marbles.filter((m) => !m.finished).length;
  }

  getRenderData(): MarbleRenderData[] {
    return this.marbles
      .filter((m) => !m.finished)
      .map((m) => {
        const pos = this.physics.getMarblePosition(m.physicsId) || { x: 0, y: 0, angle: 0 };
        return {
          id: m.data.id,
          x: pos.x,
          y: pos.y,
          angle: pos.angle,
          radius: m.radius,
          color: m.data.color,
          name: m.data.name,
        };
      });
  }

  clear(): void {
    for (const m of this.marbles) {
      this.physics.removeMarble(m.physicsId);
    }
    this.marbles = [];
  }
}
