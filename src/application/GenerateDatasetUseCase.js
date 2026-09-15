import { Sample } from '../domain/Sample.js';

export class GenerateDatasetUseCase {
  execute() {
    const truthTable = [
      new Sample(0, 0, 0),
      new Sample(0, 1, 0),
      new Sample(1, 0, 0),
      new Sample(1, 1, 1),
    ];

    return this.#shuffle(truthTable);
  }

  #shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
