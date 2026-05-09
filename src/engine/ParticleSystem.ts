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
  private gravityReversed = false;

  setGravityReversed(reversed: boolean): void {
    this.gravityReversed = reversed;
  }

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

  emitVortex(x: number, topY: number, count: number): void {
    const palette = ['#A78BFA', '#818CF8', '#C4B5FD', '#E0E7FF', '#7C3AED'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 6;
      const px = x + Math.cos(angle) * radius;
      const py = topY + Math.random() * 4;
      const speed = Math.random() * 2 + 1;
      const inwardAngle = Math.atan2(topY - py, x - px);
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(inwardAngle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(inwardAngle) * speed - Math.random() * 3,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 2000,
        maxLife: 2000,
        size: 0.08 + Math.random() * 0.12,
      });
    }
  }

  emitUpwardDust(x: number, y: number, count: number): void {
    const palette = ['#C4B5FD', '#DDD6FE', '#EDE9FE', '#A78BFA'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 1.5,
        y: y + (Math.random() - 0.5) * 0.5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 4 + 2),
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 1500,
        maxLife: 1500,
        size: 0.06 + Math.random() * 0.08,
      });
    }
  }

  update(dt: number): void {
    const dtMs = dt * 1000;
    const grav = this.gravityReversed ? -10 : 10;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += grav * dt;
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

  getCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }
}
