export class EpochResult {
  constructor(epochNumber, weights, bias, totalErrors, details) {
    this.epochNumber = epochNumber;
    this.weights = [...weights];
    this.bias = bias;
    this.totalErrors = totalErrors;
    this.details = details;
  }
}
