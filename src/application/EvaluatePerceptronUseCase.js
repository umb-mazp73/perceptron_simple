import { Sample } from '../domain/Sample.js';

export class EvaluatePerceptronUseCase {
  constructor(sampleCount = null, noise = null) {
    this.sampleCount = sampleCount ?? Math.floor(Math.random() * 10) + 6;
    this.noise = noise ?? Math.random() * 0.3 + 0.1;
  }

  execute(perceptron) {
    const results = [];

    for (let i = 0; i < this.sampleCount; i++) {
      const bit1 = Math.round(Math.random());
      const bit2 = Math.round(Math.random());

      const x1 = this.#applyNoise(bit1);
      const x2 = this.#applyNoise(bit2);

      const expected = bit1 && bit2 ? 1 : 0;
      const sample = new Sample(x1, x2, expected);
      const predicted = perceptron.predict(sample.toInputs());

      results.push({
        index: i + 1,
        x1: Number(x1.toFixed(3)),
        x2: Number(x2.toFixed(3)),
        expected,
        predicted,
        correct: predicted === expected,
      });
    }

    return results;
  }

  #applyNoise(bit) {
    const offset = (Math.random() * 2 - 1) * this.noise;
    let value = bit + offset;
    return Math.max(-0.5, Math.min(1.5, value));
  }
}
