import { AppController } from './src/presentation/AppController.js';

window.addEventListener('DOMContentLoaded', () => {
  const byId = (id) => document.getElementById(id);

  const app = new AppController({
    weightInputs: ['w1', 'w2', 'w3', 'w4'].map(byId),
    thetaInput: byId('theta'),
    rateInput: byId('rate'),
    errorEl: byId('input-error'),
    trainButton: byId('train-btn'),
    classValuesButton: byId('class-values-btn'),
    randomValuesButton: byId('random-values-btn'),
    equationEl: byId('equation'),
    statusEl: byId('status'),
    truthTableEl: byId('truth-table'),
    trainingTableEl: byId('training-table'),
    evaluationTableEl: byId('evaluation-table'),
    activationCanvas: byId('activation-chart'),
    convergenceCanvas: byId('convergence-chart'),
    manualInputs: ['m1', 'm2', 'm3', 'm4'].map(byId),
    manualResultEl: byId('manual-result'),
    accuracyEl: byId('accuracy'),
    evalManualButton: byId('eval-manual-btn'),
    evalAllButton: byId('eval-all-btn'),
    evalClearButton: byId('eval-clear-btn'),
  });

  app.init();
});
