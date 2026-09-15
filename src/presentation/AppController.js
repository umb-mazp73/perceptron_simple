import { GenerateDatasetUseCase } from '../application/GenerateDatasetUseCase.js';
import { TrainPerceptronUseCase } from '../application/TrainPerceptronUseCase.js';
import { EvaluatePerceptronUseCase } from '../application/EvaluatePerceptronUseCase.js';
import { TableRenderer } from '../infrastructure/TableRenderer.js';
import { ChartRenderer } from '../infrastructure/ChartRenderer.js';

export class AppController {
  constructor({
    runButton,
    summaryEl,
    trainingTableEl,
    evaluationTableEl,
    boundaryCanvas,
    convergenceCanvas,
  }) {
    this.runButton = runButton;
    this.summaryEl = summaryEl;
    this.trainingTableEl = trainingTableEl;
    this.evaluationTableEl = evaluationTableEl;

    this.tableRenderer = new TableRenderer();
    this.boundaryChart = new ChartRenderer(boundaryCanvas);
    this.convergenceChart = new ChartRenderer(convergenceCanvas);

    this.trainUseCase = new TrainPerceptronUseCase(new GenerateDatasetUseCase(), 200);

    this.runButton.addEventListener('click', () => this.run());
  }

  run() {
    const { perceptron, dataset, history, converged, epochsToConverge } = this.trainUseCase.execute();

    const evaluateUseCase = new EvaluatePerceptronUseCase();
    const evaluationResults = evaluateUseCase.execute(perceptron);

    this.#renderSummary(perceptron, converged, epochsToConverge, evaluationResults);
    this.tableRenderer.renderTrainingHistory(this.trainingTableEl, history);
    this.tableRenderer.renderEvaluation(this.evaluationTableEl, evaluationResults);
    this.boundaryChart.renderDecisionBoundary(
      [...dataset, ...evaluationResults],
      perceptron,
    );
    this.convergenceChart.renderConvergence(history);
  }

  #renderSummary(perceptron, converged, epochsToConverge, evaluationResults) {
    const correctCount = evaluationResults.filter((r) => r.correct).length;
    const accuracy = ((correctCount / evaluationResults.length) * 100).toFixed(1);

    this.summaryEl.innerHTML = `
      <div class="summary-card">
        <span class="summary-label">Estado</span>
        <span class="summary-value ${converged ? 'ok' : 'warn'}">${converged ? 'Convergió' : 'No convergió'}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Iteraciones (épocas) hasta converger</span>
        <span class="summary-value">${epochsToConverge}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Tasa de aprendizaje (aleatoria)</span>
        <span class="summary-value">${perceptron.learningRate.toFixed(4)}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Pesos finales (w1, w2)</span>
        <span class="summary-value">${perceptron.weights.map((w) => w.toFixed(4)).join(', ')}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Bias final</span>
        <span class="summary-value">${perceptron.bias.toFixed(4)}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Precisión en evaluación aleatoria</span>
        <span class="summary-value">${accuracy}% (${correctCount}/${evaluationResults.length})</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Nº de evaluaciones generadas (aleatorio)</span>
        <span class="summary-value">${evaluationResults.length}</span>
      </div>
    `;
  }
}
