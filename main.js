import { AppController } from './src/presentation/AppController.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController({
    runButton: document.getElementById('run-btn'),
    summaryEl: document.getElementById('summary'),
    trainingTableEl: document.getElementById('training-table'),
    evaluationTableEl: document.getElementById('evaluation-table'),
    boundaryCanvas: document.getElementById('boundary-chart'),
    convergenceCanvas: document.getElementById('convergence-chart'),
    manualX1Input: document.getElementById('manual-x1'),
    manualX2Input: document.getElementById('manual-x2'),
    evalManualButton: document.getElementById('eval-manual-btn'),
    evalRandomButton: document.getElementById('eval-random-btn'),
    evalClearButton: document.getElementById('eval-clear-btn'),
  });

  app.run();
});
