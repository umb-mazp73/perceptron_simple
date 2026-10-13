export class Sample {
  constructor(inputs, expected) {
    this.inputs = [...inputs];
    this.expected = expected;
  }

  toInputs() {
    return [...this.inputs];
  }
}
