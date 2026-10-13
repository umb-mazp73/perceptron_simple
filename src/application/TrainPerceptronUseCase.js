import { Perceptron } from '../domain/Perceptron.js';

export class TrainPerceptronUseCase {
  constructor(generateDatasetUseCase, maxIterations = 1000, maxRestarts = 999) {
    this.generateDatasetUseCase = generateDatasetUseCase;
    this.maxIterations = maxIterations;
    this.maxRestarts = maxRestarts;
  }

  // Entrena con los valores iniciales dados. Si en maxIterations no llega a la
  // respuesta, reinicia con pesos y umbral aleatorios (misma tasa E).
  // Los intentos se corren sin historial; solo el intento final se repite
  // guardando la tabla completa (el resultado es idéntico porque es determinista).
  execute({ weights, theta, learningRate }) {
    const dataset = this.generateDatasetUseCase.execute();

    let start = new Perceptron({ weights, theta, learningRate });
    let restarts = 0;

    while (start.clone().trainQuietly(dataset, this.maxIterations) === null && restarts < this.maxRestarts) {
      restarts++;
      start = Perceptron.random(weights.length, learningRate);
    }

    const perceptron = start.clone();
    const history = perceptron.train(dataset, this.maxIterations);

    return {
      perceptron,
      dataset,
      history,
      restarts,
      converged: history.length > 0 && history[history.length - 1].totalErrors === 0,
      iterations: history.length,
      startValues: { weights: [...start.weights], theta: start.theta, learningRate },
    };
  }
}
