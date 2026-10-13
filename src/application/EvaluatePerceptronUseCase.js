export class EvaluatePerceptronUseCase {
  constructor(generateDatasetUseCase) {
    this.generateDatasetUseCase = generateDatasetUseCase;
  }

  evaluateAll(perceptron) {
    return this.generateDatasetUseCase
      .execute()
      .map((sample, i) => this.#evaluate(perceptron, sample.toInputs(), sample.expected, i + 1));
  }

  evaluateOne(perceptron, inputs, index) {
    return this.#evaluate(perceptron, inputs, this.generateDatasetUseCase.expectedFor(inputs), index);
  }

  #evaluate(perceptron, inputs, expected, index) {
    const { net, y, output } = perceptron.predict(inputs);
    return {
      index,
      inputs: [...inputs],
      expected,
      net,
      y,
      output,
      correct: expected === null ? null : output === expected,
    };
  }
}
