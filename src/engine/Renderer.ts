import { tokens } from '@/styles/tokens';
import { BRAND } from '@/constants/brand';
import type { MapData, MapEntity } from '@/types/game';
import { Camera } from './Camera';

export interface MarbleRenderData {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  color: string;
  name: string;
}

export interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  camera: Camera;
  private isDark = true;
  private dpr = 1;
  private logicalWidth = 0;
  private logicalHeight = 0;
  private frameCount = 0;
  private switchAlert: { text: string; startTime: number } | null = null;
  private effectAlert: { text: string; color: string; startTime: number } | null = null;
  private static readonly SWITCH_ALERT_DURATION = 3000;
  private static readonly EFFECT_ALERT_DURATION = 2500;

  /** Compute fade-in / hold / fade-out alpha for a timed alert. */
  private static alertAlpha(progress: number, fadeIn: number, fadeOut: number): number {
    if (progress < fadeIn) return progress / fadeIn;
    if (progress > 1 - fadeOut) return (1 - progress) / fadeOut;
    return 1;
  }
  directionReversed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera();
  }

  setTheme(dark: boolean): void {
    this.isDark = dark;
  }

  showSwitchAlert(nameA: string, nameB: string): void {
    this.switchAlert = {
      text: `이름 랜덤 변경!\n${nameA} ↔ ${nameB}`,
      startTime: Date.now(),
    };
  }

  showEffectAlert(text: string, color: string): void {
    this.effectAlert = { text, color, startTime: Date.now() };
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
    this.camera.setCanvas(rect.width, rect.height);
  }

  render(
    map: MapData | null,
    marbles: MarbleRenderData[],
    particles: ParticleData[],
    winners: { name: string; color: string }[],
    obstacles: { x: number; y: number; w: number; h: number; angle: number; alpha: number }[],
    entityTransforms?: { x: number; y: number; angle: number }[],
  ): void {
    const { ctx } = this;
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    this.frameCount++;

    ctx.fillStyle = this.isDark ? tokens.color.dark : tokens.color.light;
    ctx.fillRect(0, 0, w, h);

    // Watermark
    this.drawWatermark(w, h);

    // Camera scene
    ctx.save();
    this.camera.applyTransform(ctx);

    // Map entities
    if (map) {
      this.drawEntities(map.entities, entityTransforms || []);
      this.drawGoalLine(map.goalY);
    }

    // Dynamic obstacles
    for (const obs of obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.angle);
      ctx.globalAlpha = obs.alpha;
      ctx.fillStyle = tokens.color.danger;
      ctx.fillRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Marbles
    for (const m of marbles) {
      this.drawMarble(m);
    }

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Switch alert
    this.drawSwitchAlert(w, h);

    // Effect alert
    this.drawEffectAlert(w, h);

    // Minimap
    if (map) {
      this.drawMinimap(w, h, map, marbles, entityTransforms || []);
    }

    // Winners overlay
    if (winners.length > 0) {
      this.drawWinners(w, h, winners);
    }
  }

  private drawSwitchAlert(w: number, h: number): void {
    if (!this.switchAlert) return;
    const elapsed = Date.now() - this.switchAlert.startTime;
    if (elapsed > Renderer.SWITCH_ALERT_DURATION) {
      this.switchAlert = null;
      return;
    }

    const { ctx } = this;
    const progress = elapsed / Renderer.SWITCH_ALERT_DURATION;
    const alpha = Renderer.alertAlpha(progress, 0.2, 0.3);

    // Scale: pop in then settle
    const scale = progress < 0.15 ? 0.5 + (progress / 0.15) * 0.5 : 1;

    const lines = this.switchAlert.text.split('\n');

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background banner
    const bannerH = 90;
    const bannerY = h * 0.35 - bannerH / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(w * 0.2, bannerY, w * 0.6, bannerH, 16);
    ctx.fill();

    // Border glow
    ctx.strokeStyle = tokens.color.accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = tokens.color.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(w * 0.2, bannerY, w * 0.6, bannerH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Title text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.translate(w / 2, h * 0.35);
    ctx.scale(scale, scale);

    ctx.font = `bold 28px ${BRAND.logo.fontFamily}`;
    ctx.fillStyle = tokens.color.accent;
    ctx.fillText(lines[0], 0, -14);

    // Names text
    if (lines[1]) {
      ctx.font = `bold 20px ${BRAND.logo.fontFamily}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(lines[1], 0, 18);
    }

    ctx.restore();
  }

  private drawWatermark(w: number, h: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = BRAND.watermark.opacity;
    ctx.fillStyle = this.isDark ? tokens.color.text : tokens.color.lightText;
    ctx.font = `${BRAND.watermark.fontSize}px ${BRAND.logo.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BRAND.logo.text, w / 2, h / 2 - 30);
    ctx.font = `${BRAND.watermark.fontSize * 0.35}px ${BRAND.logo.fontFamily}`;
    ctx.fillText(BRAND.teamName, w / 2, h / 2 + 60);
    ctx.restore();
  }

  private drawEntities(
    entities: MapEntity[],
    transforms: { x: number; y: number; angle: number }[],
  ): void {
    const { ctx } = this;
    for (let idx = 0; idx < entities.length; idx++) {
      const entity = entities[idx];
      const transform = transforms[idx];
      ctx.save();

      if (transform) {
        ctx.translate(transform.x, transform.y);
        ctx.rotate(transform.angle);
      } else {
        ctx.translate(entity.position[0], entity.position[1]);
        if (entity.angle) ctx.rotate(entity.angle);
      }

      const color = entity.color || (this.isDark ? '#334155' : '#CBD5E1');
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.1;

      if (entity.shape === 'polyline' && entity.vertices) {
        ctx.beginPath();
        ctx.moveTo(entity.vertices[0][0], entity.vertices[0][1]);
        for (let i = 1; i < entity.vertices.length; i++) {
          ctx.lineTo(entity.vertices[i][0], entity.vertices[i][1]);
        }
        ctx.stroke();
      } else if (entity.shape === 'box' && entity.width && entity.height) {
        ctx.fillRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height);
      } else if (entity.shape === 'circle' && entity.radius) {
        ctx.beginPath();
        ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawMinimap(
    screenW: number,
    screenH: number,
    map: MapData,
    marbles: MarbleRenderData[],
    transforms: { x: number; y: number; angle: number }[],
  ): void {
    const { ctx } = this;

    // Minimap dimensions
    const mmWidth = 80;
    const mmPadding = 12;
    const mmX = screenW - mmWidth - mmPadding;
    const mmY = mmPadding;

    // Map world bounds
    const worldMinX = -10;
    const worldMaxX = 10;
    const worldMinY = map.spawnArea.y - 2;
    const worldMaxY = map.goalY + 2;
    const worldW = worldMaxX - worldMinX;
    const worldH = worldMaxY - worldMinY;
    const mmHeight = (mmWidth / worldW) * worldH;
    const scale = mmWidth / worldW;

    const toMmX = (wx: number) => mmX + (wx - worldMinX) * scale;
    const toMmY = (wy: number) => mmY + (wy - worldMinY) * scale;

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(mmX - 4, mmY - 4, mmWidth + 8, mmHeight + 8, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mmX - 4, mmY - 4, mmWidth + 8, mmHeight + 8, 6);
    ctx.stroke();

    // Clip to minimap area
    ctx.beginPath();
    ctx.rect(mmX, mmY, mmWidth, mmHeight);
    ctx.clip();

    // Draw entities (simplified)
    for (let i = 0; i < map.entities.length; i++) {
      const entity = map.entities[i];
      const transform = transforms[i];
      const ex = transform ? transform.x : entity.position[0];
      const ey = transform ? transform.y : entity.position[1];

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 0.5;

      if (entity.shape === 'polyline' && entity.vertices) {
        ctx.beginPath();
        const v0x = ex + entity.vertices[0][0];
        const v0y = ey + entity.vertices[0][1];
        ctx.moveTo(toMmX(v0x), toMmY(v0y));
        for (let j = 1; j < entity.vertices.length; j++) {
          ctx.lineTo(toMmX(ex + entity.vertices[j][0]), toMmY(ey + entity.vertices[j][1]));
        }
        ctx.stroke();
      } else if (entity.shape === 'box' && entity.width && entity.height) {
        const bw = entity.width * scale;
        const bh = entity.height * scale;
        ctx.fillRect(toMmX(ex) - bw / 2, toMmY(ey) - bh / 2, bw, bh);
      } else if (entity.shape === 'circle' && entity.radius) {
        ctx.beginPath();
        ctx.arc(toMmX(ex), toMmY(ey), Math.max(1, entity.radius * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Goal line on minimap
    ctx.strokeStyle = tokens.color.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mmX, toMmY(map.goalY));
    ctx.lineTo(mmX + mmWidth, toMmY(map.goalY));
    ctx.stroke();

    // "GOAL" label
    ctx.fillStyle = tokens.color.accent;
    ctx.font = `bold 7px ${BRAND.logo.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.fillText('GOAL', mmX + mmWidth - 2, toMmY(map.goalY) - 3);

    // Marbles on minimap
    for (const m of marbles) {
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(toMmX(m.x), toMmY(m.y), Math.max(2.5, m.radius * scale), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Current viewport indicator
    const cam = this.camera;
    const vpLeft = toMmX(cam.x - screenW / 2 / cam.zoom);
    const vpRight = toMmX(cam.x + screenW / 2 / cam.zoom);
    const vpTop = toMmY(cam.y - screenH / 2 / cam.zoom);
    const vpBottom = toMmY(cam.y + screenH / 2 / cam.zoom);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(vpLeft, vpTop, vpRight - vpLeft, vpBottom - vpTop);
    ctx.setLineDash([]);

    ctx.restore();
  }

  private drawGoalLine(goalY: number): void {
    const { ctx } = this;
    const pulse = 0.5 + 0.5 * Math.sin(this.frameCount * 0.05);
    const leftWall = -10;
    const rightWall = 10;
    const reversed = this.directionReversed;

    ctx.save();

    // Glowing goal line
    const goalColor = reversed ? '#A78BFA' : tokens.color.accent;
    ctx.shadowColor = goalColor;
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.strokeStyle = goalColor;
    ctx.lineWidth = 0.15;
    ctx.globalAlpha = 0.6 + pulse * 0.4;

    ctx.beginPath();
    ctx.moveTo(leftWall, goalY);
    ctx.lineTo(rightWall, goalY);
    ctx.stroke();

    // Dashed secondary line
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3 + pulse * 0.2;
    ctx.setLineDash([0.5, 0.3]);
    ctx.strokeStyle = goalColor;
    ctx.lineWidth = 0.08;
    const dashY = reversed ? goalY + 0.5 : goalY - 0.5;
    ctx.beginPath();
    ctx.moveTo(leftWall, dashY);
    ctx.lineTo(rightWall, dashY);
    ctx.stroke();
    ctx.setLineDash([]);

    // "GOAL" label
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.fillStyle = goalColor;
    ctx.font = `bold 1px ${BRAND.logo.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = reversed ? 'top' : 'bottom';
    ctx.fillText('GOAL', 0, reversed ? goalY + 0.8 : goalY - 0.8);

    // Small arrows
    const arrowSpacing = 3;
    for (let x = leftWall + 2; x < rightWall; x += arrowSpacing) {
      ctx.beginPath();
      if (reversed) {
        // Arrows pointing up
        ctx.moveTo(x - 0.3, goalY + 0.6);
        ctx.lineTo(x, goalY + 0.2);
        ctx.lineTo(x + 0.3, goalY + 0.6);
      } else {
        // Arrows pointing down
        ctx.moveTo(x - 0.3, goalY - 0.6);
        ctx.lineTo(x, goalY - 0.2);
        ctx.lineTo(x + 0.3, goalY - 0.6);
      }
      ctx.strokeStyle = goalColor;
      ctx.lineWidth = 0.08;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawEffectAlert(w: number, h: number): void {
    if (!this.effectAlert) return;
    const elapsed = Date.now() - this.effectAlert.startTime;
    if (elapsed > Renderer.EFFECT_ALERT_DURATION) {
      this.effectAlert = null;
      return;
    }

    const { ctx } = this;
    const progress = elapsed / Renderer.EFFECT_ALERT_DURATION;
    const alpha = Renderer.alertAlpha(progress, 0.15, 0.3);

    const scale = progress < 0.1 ? 0.6 + (progress / 0.1) * 0.4 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    const bannerH = 70;
    const bannerY = h * 0.25 - bannerH / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(w * 0.15, bannerY, w * 0.7, bannerH, 16);
    ctx.fill();

    ctx.strokeStyle = this.effectAlert.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.effectAlert.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(w * 0.15, bannerY, w * 0.7, bannerH, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.translate(w / 2, h * 0.25);
    ctx.scale(scale, scale);
    ctx.font = `bold 26px ${BRAND.logo.fontFamily}`;
    ctx.fillStyle = this.effectAlert.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.effectAlert.text, 0, 0);

    ctx.restore();
  }

  private drawMarble(m: MarbleRenderData): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(m.x, m.y);

    // Glow
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 3;

    // Body
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Name label
    const fontSize = Math.max(0.2, m.radius * 0.8);
    ctx.font = `bold ${fontSize}px ${BRAND.logo.fontFamily}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.name, 0, 0);

    ctx.restore();
  }

  private drawWinners(w: number, h: number, winners: { name: string; color: string }[]): void {
    const { ctx } = this;
    const panelW = 200;
    const panelH = Math.min(winners.length * 30 + 50, h * 0.4);
    const px = w - panelW - 16;
    const py = h - panelH - 16;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 12);
    ctx.fill();

    ctx.fillStyle = tokens.color.accent;
    ctx.font = `bold 16px ${BRAND.logo.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('WINNER', px + panelW / 2, py + 28);

    winners.forEach((winner, i) => {
      const y = py + 55 + i * 28;
      ctx.fillStyle = winner.color;
      ctx.beginPath();
      ctx.arc(px + 24, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `14px ${BRAND.logo.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${winner.name}`, px + 40, y + 5);
    });

    ctx.restore();
  }
}
