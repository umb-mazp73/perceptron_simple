import { Sample } from '../domain/Sample.js';

// Compuerta lógica del proyecto (4 entradas bipolares).
// Equivale a: Y = x1 AND (x2 OR x3 OR x4)
const TRUTH_TABLE = [
  [[-1, -1, -1, -1], -1],
  [[-1, -1, -1, 1], -1],
  [[-1, -1, 1, -1], -1],
  [[-1, -1, 1, 1], -1],
  [[-1, 1, -1, -1], -1],
  [[-1, 1, -1, 1], -1],
  [[-1, 1, 1, -1], -1],
  [[-1, 1, 1, 1], -1],
  [[1, -1, -1, -1], -1],
  [[1, -1, -1, 1], 1],
  [[1, -1, 1, -1], 1],
  [[1, -1, 1, 1], 1],
  [[1, 1, -1, -1], 1],
  [[1, 1, -1, 1], 1],
  [[1, 1, 1, -1], 1],
  [[1, 1, 1, 1], 1],
];

export class GenerateDatasetUseCase {
  execute() {
    return TRUTH_TABLE.map(([inputs, expected]) => new Sample(inputs, expected));
  }

  expectedFor(inputs) {
    const row = TRUTH_TABLE.find(([x]) => x.every((v, i) => v === inputs[i]));
    return row ? row[1] : null;
  }
}
