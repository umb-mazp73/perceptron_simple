import { EpochResult } from './EpochResult.js';

// Perceptrón simple bipolar con activación tangente hiperbólica:
//   Y = tanh(w1·x1 + w2·x2 + w3·x3 + w4·x4 − θ)
//   salida = 1 si Y ≥ 0, −1 si Y < 0
// Regla de ajuste (cuando la salida difiere del valor esperado Y):
//   wi = wi + 2·E·Y·xi
//   θ  = θ  + 2·E·Y·(−1)
export class Perceptron {
  // Una suma que da exactamente 0 a mano (p. ej. 0.1 + 0.2 − 0.3) puede salir como
  // ±1e-17 por el redondeo binario. Si |net| es despreciable frente a sus términos
  // se toma como 0, igual que en Excel, para que la salida sea la del cálculo a mano.
  static ZERO_TOLERANCE = 1e-12;

  constructor({ weights, theta, learningRate }) {
    this.weights = [...weights];
    this.theta = theta;
    this.learningRate = learningRate;
  }

  static randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  static random(numInputs, learningRate) {
    return new Perceptron({
      weights: Array.from({ length: numInputs }, () => Perceptron.round(Perceptron.randomInRange(-1, 1))),
      theta: Perceptron.round(Perceptron.randomInRange(-1, 1)),
      learningRate,
    });
  }

  static round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  get numInputs() {
    return this.weights.length;
  }

  netInput(inputs) {
    let sum = -this.theta;
    let scale = Math.abs(this.theta);
    inputs.forEach((x, i) => {
      const term = x * this.weights[i];
      sum += term;
      scale += Math.abs(term);
    });
    return Math.abs(sum) <= scale * Perceptron.ZERO_TOLERANCE ? 0 : sum;
  }

  activate(net) {
    return Math.tanh(net);
  }

  classify(y) {
    return y >= 0 ? 1 : -1;
  }

  predict(inputs) {
    const net = this.netInput(inputs);
    const y = this.activate(net);
    return { net, y, output: this.classify(y) };
  }

  isFinite() {
    return Number.isFinite(this.theta) && this.weights.every(Number.isFinite);
  }

  learn(sample) {
    const inputs = sample.toInputs();
    const weightsUsed = [...this.weights];
    const thetaUsed = this.theta;
    const { net, y, output } = this.predict(inputs);
    const correct = output === sample.expected;

    let adjustment = null;
    if (!correct) {
      this.#adjust(inputs, sample.expected);
      adjustment = { weights: [...this.weights], theta: this.theta };
    }

    return { inputs, expected: sample.expected, weightsUsed, thetaUsed, net, y, output, correct, adjustment };
  }

  #adjust(inputs, expected) {
    const factor = 2 * this.learningRate * expected;
    this.weights = this.weights.map((w, i) => w + factor * inputs[i]);
    this.theta = this.theta + factor * -1;
  }

  // Una iteración = una pasada completa por todas las filas de la tabla.
  train(samples, maxIterations = 1000) {
    const history = [];

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const details = samples.map((sample) => this.learn(sample));
      const totalErrors = details.filter((d) => !d.correct).length;

      history.push(new EpochResult(iteration, this.weights, this.theta, totalErrors, details));

      if (totalErrors === 0 || !this.isFinite()) break;
    }

    return history;
  }

  // Igual que train() pero sin guardar el historial (para los reinicios, que pueden
  // ser cientos de miles de filas). Devuelve las iteraciones si converge, o null.
  trainQuietly(samples, maxIterations = 1000) {
    const w = [...this.weights];
    let theta = this.theta;
    let result = null;

    for (let iteration = 1; iteration <= maxIterations && result === null; iteration++) {
      let errors = 0;
      for (const { inputs, expected } of samples) {
        let net = -theta;
        let scale = Math.abs(theta);
        for (let i = 0; i < w.length; i++) {
          const term = inputs[i] * w[i];
          net += term;
          scale += Math.abs(term);
        }
        if (Math.abs(net) <= scale * Perceptron.ZERO_TOLERANCE) net = 0;

        if (this.classify(this.activate(net)) !== expected) {
          errors++;
          const factor = 2 * this.learningRate * expected;
          for (let i = 0; i < w.length; i++) w[i] += factor * inputs[i];
          theta -= factor;
        }
      }
      if (errors === 0) result = iteration;
      else if (!Number.isFinite(theta) || !w.every(Number.isFinite)) break;
    }

    this.weights = w;
    this.theta = theta;
    return result;
  }

  clone() {
    return new Perceptron({ weights: this.weights, theta: this.theta, learningRate: this.learningRate });
  }
}
