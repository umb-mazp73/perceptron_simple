import { GenerateDatasetUseCase } from '../application/GenerateDatasetUseCase.js';
import { TrainPerceptronUseCase } from '../application/TrainPerceptronUseCase.js';
import { EvaluatePerceptronUseCase } from '../application/EvaluatePerceptronUseCase.js';
import { Perceptron } from '../domain/Perceptron.js';
import { TableRenderer } from '../infrastructure/TableRenderer.js';
import { ChartRenderer } from '../infrastructure/ChartRenderer.js';
import { formatNumber as fmt } from '../infrastructure/formatNumber.js';

// Valores iniciales tomados de la hoja de clase (θ = −2,2 · E = 0,6 · w1 = 0,7 · w2 = 0,3).
const CLASS_VALUES = { weights: [0.7, 0.3, 0.5, 0.2], theta: -2.2, learningRate: 0.6 };
const MAX_ITERATIONS = 1000;
const MAX_RESTARTS = 999;
// Más allá de este tamaño los decimales se pierden en la suma (precisión de 15-16 cifras).
const MAX_ABS_VALUE = 1e6;

export class AppController {
  constructor(dom) {
    this.dom = dom;

    this.dataset = new GenerateDatasetUseCase();
    this.trainUseCase = new TrainPerceptronUseCase(this.dataset, MAX_ITERATIONS, MAX_RESTARTS);
    this.evaluateUseCase = new EvaluatePerceptronUseCase(this.dataset);
    this.tableRenderer = new TableRenderer();
    this.activationChart = new ChartRenderer(dom.activationCanvas);
    this.convergenceChart = new ChartRenderer(dom.convergenceCanvas);

    this.perceptron = null;
    this.evaluationResults = [];

    dom.trainButton.addEventListener('click', () => this.run());
    dom.classValuesButton.addEventListener('click', () => this.#fillInitialValues(CLASS_VALUES));
    dom.randomValuesButton.addEventListener('click', () => this.#fillRandomValues());
    dom.evalManualButton.addEventListener('click', () => this.#evaluateManual());
    dom.evalAllButton.addEventListener('click', () => this.#evaluateAll());
    dom.evalClearButton.addEventListener('click', () => this.#clearEvaluation());
  }

  init() {
    this.#fillInitialValues(CLASS_VALUES);
    this.#renderTruthTable();
    this.run();
  }

  run() {
    const initial = this.#readInitialValues();
    if (!initial) return;

    const result = this.trainUseCase.execute(initial);
    this.perceptron = result.perceptron;
    this.lastResult = result;
    this.evaluationResults = [];

    this.#renderEquation();
    this.#renderStatus();
    this.tableRenderer.renderTrainingHistory(this.dom.trainingTableEl, result.history, initial.learningRate);
    this.activationChart.renderActivation(result.dataset, this.perceptron);
    this.convergenceChart.renderConvergence(result.history);
    this.#evaluateAll();
  }

  #readInitialValues() {
    const { weightInputs, thetaInput, rateInput, errorEl } = this.dom;
    const fields = [...weightInputs, thetaInput, rateInput];
    const values = fields.map((input) => Number(input.value));
    const learningRate = values[values.length - 1];

    let error = '';
    if (fields.some((input) => input.value.trim() === '') || values.some((v) => !Number.isFinite(v))) {
      error = 'Revisa los valores iniciales: todos deben ser números (usa punto decimal, p. ej. 0.5).';
    } else if (values.some((v) => Math.abs(v) > MAX_ABS_VALUE)) {
      error = `Los valores deben estar entre −${MAX_ABS_VALUE.toLocaleString('es')} y ${MAX_ABS_VALUE.toLocaleString('es')}.`;
    } else if (learningRate <= 0) {
      error = 'E (tasa) debe ser mayor que 0.';
    }

    errorEl.textContent = error;
    if (error) return null;
    return { weights: values.slice(0, 4), theta: values[4], learningRate };
  }

  #fillInitialValues({ weights, theta, learningRate }) {
    this.dom.weightInputs.forEach((input, i) => (input.value = fmt(weights[i])));
    this.dom.thetaInput.value = fmt(theta);
    this.dom.rateInput.value = fmt(learningRate);
  }

  #fillRandomValues() {
    const random = Perceptron.random(4, Perceptron.round(Perceptron.randomInRange(0.1, 1)));
    this.#fillInitialValues(random);
  }

  #renderEquation() {
    const [w1, w2, w3, w4] = this.perceptron.weights;
    const term = (w, i) => `${i === 1 ? (w < 0 ? '−' : '') : w < 0 ? ' − ' : ' + '}${fmt(Math.abs(w))}x<sub>${i}</sub>`;
    this.dom.equationEl.innerHTML = `
      Y = tanh( ${term(w1, 1)}${term(w2, 2)}${term(w3, 3)}${term(w4, 4)} − ( ${fmt(this.perceptron.theta)} ) )
    `;
  }

  #renderStatus() {
    const { converged, iterations, restarts, startValues } = this.lastResult;
    const sv = startValues;
    const startText = `w = [${sv.weights.map((w) => fmt(w)).join(', ')}], θ = ${fmt(sv.theta)}, E = ${fmt(sv.learningRate)}`;

    this.dom.statusEl.innerHTML = `
      <div class="stat"><span>iteraciones de la neurona</span><b>${iterations}</b></div>
      <div class="stat"><span>iteración del intento</span><b>${iterations} / ${MAX_ITERATIONS}</b></div>
      <div class="stat"><span>reinicios</span><b>${restarts} / ${MAX_RESTARTS}</b></div>
      <p class="status-msg ${converged ? 'ok' : 'warn'}">
        ${converged
          ? `La neurona llegó a la respuesta en ${iterations} iteraciones (${restarts} reinicios).`
          : `No llegó a la respuesta después de ${MAX_RESTARTS} reinicios.`}
      </p>
      ${restarts > 0 ? `<p class="status-note">Valores con los que arrancó el intento final: ${startText}</p>` : ''}
      <div class="final-values">
        ${this.perceptron.weights.map((w, i) => `<div><span>w${i + 1}</span><b>${fmt(w)}</b></div>`).join('')}
        <div><span>θ</span><b>${fmt(this.perceptron.theta)}</b></div>
        <div><span>E</span><b>${fmt(this.perceptron.learningRate)}</b></div>
      </div>
    `;
  }

  #renderTruthTable() {
    const rows = this.dataset
      .execute()
      .map((s) => `<tr>${s.inputs.map((x) => `<td>${x}</td>`).join('')}<td><b>${s.expected}</b></td></tr>`)
      .join('');
    this.dom.truthTableEl.innerHTML = `
      <table class="truth-table">
        <thead><tr><th>X1</th><th>X2</th><th>X3</th><th>X4</th><th>Y</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  #evaluateAll() {
    if (!this.perceptron) return;
    this.evaluationResults = this.evaluateUseCase.evaluateAll(this.perceptron);
    this.#renderEvaluation();
  }

  #evaluateManual() {
    if (!this.perceptron) return;
    const fields = this.dom.manualInputs;
    const inputs = fields.map((input) => Number(input.value));
    if (fields.some((input) => input.value.trim() === '') || inputs.some((x) => !Number.isFinite(x))) {
      this.dom.manualResultEl.innerHTML = '<span class="warn">Escribe un número en x1, x2, x3 y x4.</span>';
      return;
    }

    const result = this.evaluateUseCase.evaluateOne(this.perceptron, inputs, this.evaluationResults.length + 1);
    this.evaluationResults = [...this.evaluationResults, result];
    this.#renderEvaluation();

    const show = (n, d) => {
      const text = Number.isInteger(n) ? String(n) : fmt(n, d);
      return n < 0 ? `(${text})` : text;
    };
    const terms = inputs.map((x, i) => `${show(x)} · ${show(this.perceptron.weights[i], 2)}`).join(' + ');
    this.dom.manualResultEl.innerHTML = `
      Y = tanh( ${terms} − ( ${fmt(this.perceptron.theta)} ) ) = tanh(${fmt(result.net, 4)}) =
      <b>${fmt(result.y, 6)}</b> → salida <b class="${result.output === 1 ? 'ok' : 'warn'}">${result.output}</b>
    `;
  }

  #clearEvaluation() {
    this.evaluationResults = [];
    this.dom.manualResultEl.innerHTML = '';
    this.#renderEvaluation();
  }

  #renderEvaluation() {
    this.tableRenderer.renderEvaluation(this.dom.evaluationTableEl, this.evaluationResults);
    const judged = this.evaluationResults.filter((r) => r.correct !== null);
    const ok = judged.filter((r) => r.correct).length;
    this.dom.accuracyEl.textContent = judged.length
      ? `Aciertos: ${ok} / ${judged.length} (${((ok / judged.length) * 100).toFixed(1)}%)`
      : '';
  }
}
