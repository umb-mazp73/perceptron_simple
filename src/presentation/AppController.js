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
    manualX1Input,
    manualX2Input,
    evalManualButton,
    evalRandomButton,
    evalClearButton,
  }) {
    this.runButton = runButton;
    this.summaryEl = summaryEl;
    this.trainingTableEl = trainingTableEl;
    this.evaluationTableEl = evaluationTableEl;
    this.manualX1Input = manualX1Input;
    this.manualX2Input = manualX2Input;
    this.evalManualButton = evalManualButton;
    this.evalRandomButton = evalRandomButton;
    this.evalClearButton = evalClearButton;

    this.tableRenderer = new TableRenderer();
    this.boundaryChart = new ChartRenderer(boundaryCanvas);
    this.convergenceChart = new ChartRenderer(convergenceCanvas);

    this.trainUseCase = new TrainPerceptronUseCase(new GenerateDatasetUseCase(), 200);

    this.perceptron = null;
    this.evaluationResults = [];

    this.runButton.addEventListener('click', () => this.run());
    this.evalRandomButton.addEventListener('click', () => this.#evaluateRandom());
    this.evalManualButton.addEventListener('click', () => this.#evaluateManual());
    this.evalClearButton.addEventListener('click', () => this.#clearEvaluation());
  }

  run() {
    const { perceptron, dataset, history, converged, epochsToConverge } = this.trainUseCase.execute();
    this.perceptron = perceptron;
    this.converged = converged;
    this.epochsToConverge = epochsToConverge;
    this.evaluationResults = [];

    this.#renderSummary();
    this.tableRenderer.renderTrainingHistory(this.trainingTableEl, history);
    this.tableRenderer.renderEvaluation(this.evaluationTableEl, this.evaluationResults);
    this.boundaryChart.renderDecisionBoundary(dataset, perceptron);
    this.convergenceChart.renderConvergence(history);
  }

  #evaluateRandom() {
    if (!this.perceptron) return;

    const evaluateUseCase = new EvaluatePerceptronUseCase();
    this.evaluationResults = evaluateUseCase.execute(this.perceptron);
    this.tableRenderer.renderEvaluation(this.evaluationTableEl, this.evaluationResults);
    this.#renderSummary();
  }

  #evaluateManual() {
    if (!this.perceptron) return;

    const x1 = Number(this.manualX1Input.value);
    const x2 = Number(this.manualX2Input.value);
    if (Number.isNaN(x1) || Number.isNaN(x2)) return;

    const bit1 = Math.min(1, Math.max(0, Math.round(x1)));
    const bit2 = Math.min(1, Math.max(0, Math.round(x2)));
    const expected = bit1 && bit2 ? 1 : 0;
    const predicted = this.perceptron.predict([x1, x2]);

    this.evaluationResults = [
      ...this.evaluationResults,
      {
        index: this.evaluationResults.length + 1,
        x1: Number(x1.toFixed(3)),
        x2: Number(x2.toFixed(3)),
        expected,
        predicted,
        correct: predicted === expected,
        manual: true,
      },
    ];

    this.tableRenderer.renderEvaluation(this.evaluationTableEl, this.evaluationResults);
    this.#renderSummary();
  }

  #clearEvaluation() {
    if (!this.perceptron) return;

    this.evaluationResults = [];
    this.tableRenderer.renderEvaluation(this.evaluationTableEl, this.evaluationResults);
    this.#renderSummary();
  }

  #renderSummary() {
    const { perceptron, converged, epochsToConverge, evaluationResults } = this;
    const hasEvaluations = evaluationResults.length > 0;
    const correctCount = evaluationResults.filter((r) => r.correct).length;
    const accuracyText = hasEvaluations
      ? `${((correctCount / evaluationResults.length) * 100).toFixed(1)}% (${correctCount}/${evaluationResults.length})`
      : 'Sin evaluar aún';

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
        <span class="summary-label">Precisión en evaluación</span>
        <span class="summary-value">${accuracyText}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Nº de evaluaciones realizadas</span>
        <span class="summary-value">${evaluationResults.length}</span>
      </div>
    `;
  }
}
