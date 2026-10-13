export class EpochResult {
  constructor(epochNumber, weights, theta, totalErrors, details) {
    this.epochNumber = epochNumber;
    this.weights = [...weights];
    this.theta = theta;
    this.totalErrors = totalErrors;
    this.details = details;
  }
}
