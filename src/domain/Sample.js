export class Sample {
  constructor(x1, x2, expected) {
    this.x1 = x1;
    this.x2 = x2;
    this.expected = expected;
  }

  toInputs() {
    return [this.x1, this.x2];
  }
}
