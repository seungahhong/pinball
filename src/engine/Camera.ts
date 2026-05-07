export class Camera {
  x = 0;
  y = 0;
  zoom = 30;
  private targetX = 0;
  private targetY = 0;
  private targetZoom = 30;
  private canvasWidth = 0;
  private canvasHeight = 0;

  setCanvas(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setTarget(x: number, y: number, zoom?: number): void {
    this.targetX = x;
    this.targetY = y;
    if (zoom !== undefined) this.targetZoom = zoom;
  }

  offsetTarget(dx: number, dy: number): void {
    this.targetX += dx;
    this.targetY += dy;
  }

  adjustZoom(delta: number): void {
    this.targetZoom = Math.max(5, Math.min(60, this.targetZoom + delta));
  }

  update(dt: number): void {
    const lerp = 1 - Math.pow(0.05, dt);
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;
    this.zoom += (this.targetZoom - this.zoom) * lerp;
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.canvasWidth / 2) / this.zoom + this.x,
      y: (sy - this.canvasHeight / 2) / this.zoom + this.y,
    };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + this.canvasWidth / 2,
      y: (wy - this.y) * this.zoom + this.canvasHeight / 2,
    };
  }

  getVisibleBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x - this.canvasWidth / 2 / this.zoom,
      right: this.x + this.canvasWidth / 2 / this.zoom,
      top: this.y - this.canvasHeight / 2 / this.zoom,
      bottom: this.y + this.canvasHeight / 2 / this.zoom,
    };
  }
}
