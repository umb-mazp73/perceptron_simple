import { AppController } from './src/presentation/AppController.js';

window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController({
    runButton: document.getElementById('run-btn'),
    summaryEl: document.getElementById('summary'),
    trainingTableEl: document.getElementById('training-table'),
    evaluationTableEl: document.getElementById('evaluation-table'),
    boundaryCanvas: document.getElementById('boundary-chart'),
    convergenceCanvas: document.getElementById('convergence-chart'),
  });

  app.run();
});
