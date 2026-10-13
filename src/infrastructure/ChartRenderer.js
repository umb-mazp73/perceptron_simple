const PALETTE = {
  axis: '#b9b9ad',
  grid: '#e4e4da',
  text: '#6b6b60',
  curve: '#1f1f1b',
  ok: '#2e7d4f',
  warn: '#c0392b',
  accent: '#2e7d4f',
  pointStroke: '#ffffff',
};

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

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

  // Curva Y = tanh(net) con las 16 filas ubicadas según su entrada neta.
  renderActivation(samples, perceptron) {
    this.#clear();
    const { ctx, canvas } = this;
    const p = this.padding;

    const points = samples
      .map((s) => ({ expected: s.expected, ...perceptron.predict(s.toInputs()) }))
      .filter((pt) => Number.isFinite(pt.net));
    const step = ChartRenderer.#niceStep(Math.max(3, ...points.map((pt) => Math.abs(pt.net))) / 4);
    const range = step * Math.ceil((Math.max(3, ...points.map((pt) => Math.abs(pt.net))) + step / 2) / step);

    const toPixel = (net, y) => [
      p + ((net + range) / (2 * range)) * (canvas.width - 2 * p),
      canvas.height - p - ((y + 1.2) / 2.4) * (canvas.height - 2 * p),
    ];

    // Regiones: Y ≥ 0 → 1 (verde), Y < 0 → −1 (rojo)
    const [, yZero] = toPixel(0, 0);
    const [xZero] = toPixel(0, 0);
    ctx.fillStyle = 'rgba(46, 125, 79, 0.07)';
    ctx.fillRect(xZero, p, canvas.width - p - xZero, yZero - p);
    ctx.fillStyle = 'rgba(192, 57, 43, 0.07)';
    ctx.fillRect(p, yZero, xZero - p, canvas.height - p - yZero);

    // Rejilla y ejes
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.lineWidth = 1;
    for (let k = -range / step; k <= range / step; k++) {
      const v = k * step;
      const [px] = toPixel(v, 0);
      ctx.strokeStyle = v === 0 ? PALETTE.axis : PALETTE.grid;
      ctx.beginPath();
      ctx.moveTo(px, p);
      ctx.lineTo(px, canvas.height - p);
      ctx.stroke();
      ctx.fillStyle = PALETTE.text;
      const label = COMPACT.format(Number(v.toPrecision(6)));
      ctx.fillText(label, px - ctx.measureText(label).width / 2, canvas.height - p + 16);
    }
    [-1, -0.5, 0, 0.5, 1].forEach((v) => {
      const [, py] = toPixel(0, v);
      ctx.strokeStyle = v === 0 ? PALETTE.axis : PALETTE.grid;
      ctx.beginPath();
      ctx.moveTo(p, py);
      ctx.lineTo(canvas.width - p, py);
      ctx.stroke();
      ctx.fillStyle = PALETTE.text;
      ctx.fillText(String(v), 6, py + 4);
    });
    ctx.fillText('net = Σwx − θ', canvas.width - p - 90, canvas.height - 6);
    ctx.fillText('Y = tanh(net)', p, p - 12);

    // Curva tanh
    ctx.strokeStyle = PALETTE.curve;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const net = -range + (2 * range * i) / 200;
      const [px, py] = toPixel(net, Math.tanh(net));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Filas de la tabla
    points.forEach((pt) => {
      const [px, py] = toPixel(pt.net, pt.y);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = pt.expected === 1 ? PALETTE.ok : PALETTE.warn;
      ctx.fill();
      ctx.strokeStyle = pt.output === pt.expected ? PALETTE.pointStroke : '#000000';
      ctx.lineWidth = pt.output === pt.expected ? 1.5 : 2.5;
      ctx.stroke();
    });
  }

  // Paso 1, 2 ó 5 × 10^n, de modo que el eje tenga pocas marcas legibles.
  static #niceStep(rough) {
    const power = 10 ** Math.floor(Math.log10(rough));
    const fraction = rough / power;
    return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
  }

  renderConvergence(history) {
    this.#clear();
    const { ctx, canvas } = this;
    const p = this.padding;
    const maxEpoch = history.length;
    const maxError = Math.max(1, ...history.map((h) => h.totalErrors));

    const toPixel = (epoch, errors) => [
      p + ((epoch - 1) / Math.max(1, maxEpoch - 1)) * (canvas.width - 2 * p),
      canvas.height - p - (errors / maxError) * (canvas.height - 2 * p),
    ];

    ctx.strokeStyle = PALETTE.axis;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(p, canvas.height - p);
    ctx.lineTo(canvas.width - p, canvas.height - p);
    ctx.stroke();
    ctx.fillText('errores', 4, p - 12);
    ctx.fillText('iteración', canvas.width - p - 50, canvas.height - p + 24);
    ctx.fillText(String(maxError), p - 22, p + 4);
    ctx.fillText('0', p - 14, canvas.height - p + 4);
    ctx.fillText('1', p - 2, canvas.height - p + 14);
    if (maxEpoch > 1) ctx.fillText(String(maxEpoch), canvas.width - p - 6, canvas.height - p + 14);

    ctx.strokeStyle = PALETTE.curve;
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
      ctx.fillStyle = h.totalErrors === 0 ? PALETTE.ok : PALETTE.warn;
      ctx.fill();
    });
  }
}
