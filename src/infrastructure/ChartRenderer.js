const PALETTE = {
  axis: '#d2d2d7',
  text: '#86868b',
  boundary: '#8e57e0',
  ok: '#1d9a5f',
  warn: '#d9432e',
  accent: '#0071e3',
  pointStroke: '#ffffff',
};

export class ChartRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.padding = 40;
  }

  #clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  #toPixel(x, y, min = -0.6, max = 1.6) {
    const { width, height } = this.canvas;
    const p = this.padding;
    const px = p + ((x - min) / (max - min)) * (width - 2 * p);
    const py = height - p - ((y - min) / (max - min)) * (height - 2 * p);
    return [px, py];
  }

  #drawAxes(min = -0.6, max = 1.6) {
    const { ctx, canvas } = this;
    ctx.strokeStyle = PALETTE.axis;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.lineWidth = 1;

    const [x0, y0] = this.#toPixel(min, 0, min, max);
    const [x1, y1] = this.#toPixel(max, 0, min, max);
    const [ox, oy0] = this.#toPixel(0, min, min, max);
    const [, oy1] = this.#toPixel(0, max, min, max);

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(ox, oy0);
    ctx.lineTo(ox, oy1);
    ctx.stroke();

    for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
      const [px] = this.#toPixel(v, 0, min, max);
      const [, py] = this.#toPixel(0, v, min, max);
      ctx.fillText(v.toString(), px + 2, canvas.height - this.padding + 14);
      ctx.fillText(v.toString(), this.padding - 16, py + 3);
    }

    ctx.fillText('x1', canvas.width - this.padding + 8, oy0 + 4);
    ctx.fillText('x2', ox - 4, this.padding - 10);
  }

  renderDecisionBoundary(points, perceptron) {
    this.#clear();
    const min = -0.6;
    const max = 1.6;
    this.#drawAxes(min, max);

    const [w1, w2] = perceptron.weights;
    const b = perceptron.bias;

    if (Math.abs(w2) > 1e-6) {
      const y1 = -(w1 * min + b) / w2;
      const y2 = -(w1 * max + b) / w2;
      const [px1, py1] = this.#toPixel(min, y1, min, max);
      const [px2, py2] = this.#toPixel(max, y2, min, max);
      this.ctx.strokeStyle = PALETTE.boundary;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(px1, py1);
      this.ctx.lineTo(px2, py2);
      this.ctx.stroke();
    }

    points.forEach((p) => {
      const expected = p.expected;
      const [px, py] = this.#toPixel(p.x1, p.x2, min, max);
      this.ctx.beginPath();
      this.ctx.arc(px, py, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = expected === 1 ? PALETTE.ok : PALETTE.warn;
      this.ctx.fill();
      this.ctx.strokeStyle = PALETTE.pointStroke;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });
  }

  renderConvergence(history) {
    this.#clear();
    const { ctx, canvas } = this;
    const p = this.padding;
    const maxEpoch = history.length;
    const maxError = Math.max(1, ...history.map((h) => h.totalErrors));

    const toPixel = (epoch, errors) => {
      const px = p + ((epoch - 1) / Math.max(1, maxEpoch - 1)) * (canvas.width - 2 * p);
      const py = canvas.height - p - (errors / maxError) * (canvas.height - 2 * p);
      return [px, py];
    };

    ctx.strokeStyle = PALETTE.axis;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(p, canvas.height - p);
    ctx.lineTo(canvas.width - p, canvas.height - p);
    ctx.stroke();
    ctx.fillText('Errores', 4, p - 6);
    ctx.fillText('Época', canvas.width - p - 20, canvas.height - p + 20);

    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => {
      const [px, py] = toPixel(h.epochNumber, h.totalErrors);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    history.forEach((h) => {
      const [px, py] = toPixel(h.epochNumber, h.totalErrors);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = h.totalErrors === 0 ? PALETTE.ok : PALETTE.accent;
      ctx.fill();
    });
  }
}
