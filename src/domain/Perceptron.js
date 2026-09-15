import { EpochResult } from './EpochResult.js';

export class Perceptron {
  constructor(numInputs = 2, learningRate = null) {
    this.numInputs = numInputs;
    this.weights = Perceptron.randomVector(numInputs, -1, 1);
    this.bias = Perceptron.randomInRange(-1, 1);
    this.learningRate = learningRate ?? Perceptron.randomInRange(0.1, 0.5);
  }

  static randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  static randomVector(size, min, max) {
    return Array.from({ length: size }, () => Perceptron.randomInRange(min, max));
  }

  activate(z) {
    return z >= 0 ? 1 : 0;
  }

  netInput(inputs) {
    return inputs.reduce((sum, x, i) => sum + x * this.weights[i], this.bias);
  }

  predict(inputs) {
    return this.activate(this.netInput(inputs));
  }

  learn(sample) {
    const inputs = sample.toInputs();
    const predicted = this.predict(inputs);
    const error = sample.expected - predicted;

    if (error !== 0) {
      inputs.forEach((x, i) => {
        this.weights[i] += this.learningRate * error * x;
      });
      this.bias += this.learningRate * error;
    }

    return {
      x1: sample.x1,
      x2: sample.x2,
      expected: sample.expected,
      predicted,
      error,
    };
  }

  train(samples, maxEpochs = 100) {
    const history = [];

    for (let epoch = 1; epoch <= maxEpochs; epoch++) {
      const details = samples.map((sample) => this.learn(sample));
      const totalErrors = details.reduce((sum, d) => sum + Math.abs(d.error), 0);

      history.push(new EpochResult(epoch, this.weights, this.bias, totalErrors, details));

      if (totalErrors === 0) {
        break;
      }
    }

    return history;
  }

  clone() {
    const copy = new Perceptron(this.numInputs, this.learningRate);
    copy.weights = [...this.weights];
    copy.bias = this.bias;
    return copy;
  }
}
