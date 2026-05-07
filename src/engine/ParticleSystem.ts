import type { ParticleData } from './Renderer';
import { tokens } from '@/styles/tokens';

const DEFAULT_PALETTE = tokens.marble.slice(0, 6);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, count: number, colors?: string[]): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * 270 - 180) * (Math.PI / 180);
      const force = Math.random() * 8 + 2;
      const palette = colors || DEFAULT_PALETTE;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 3000,
        maxLife: 3000,
        size: 0.15 + Math.random() * 0.15,
      });
    }
  }

  update(dt: number): void {
    const dtMs = dt * 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 10 * dt;
      p.life -= dtMs;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getRenderData(): ParticleData[] {
    return this.particles.map((p) => ({
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      color: p.color,
      alpha: Math.max(0, 1 - Math.pow(1 - p.life / p.maxLife, 2)),
      size: p.size,
    }));
  }

  clear(): void {
    this.particles = [];
  }
}
