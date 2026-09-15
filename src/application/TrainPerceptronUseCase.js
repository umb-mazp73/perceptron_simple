import { Perceptron } from '../domain/Perceptron.js';

export class TrainPerceptronUseCase {
  constructor(generateDatasetUseCase, maxEpochs = 100) {
    this.generateDatasetUseCase = generateDatasetUseCase;
    this.maxEpochs = maxEpochs;
  }

  execute() {
    const dataset = this.generateDatasetUseCase.execute();
    const perceptron = new Perceptron(2);
    const history = perceptron.train(dataset, this.maxEpochs);

    const converged = history.length > 0 && history[history.length - 1].totalErrors === 0;

    return {
      perceptron,
      dataset,
      history,
      converged,
      epochsToConverge: history.length,
    };
  }
}
