// services/baselineTracker.js – in‑memory baseline window (5 laps) implementation

/**
 * Maintains a rolling window of the last N lap speeds to compute a baseline speed.
 * The window size is configurable but defaults to 5 laps as required.
 */
export class BaselineTracker {
  constructor(windowSize = 5) {
    this.windowSize = windowSize;
    this.speeds = [];
  }

  addSpeed(speed) {
    if (this.speeds.length >= this.windowSize) {
      this.speeds.shift(); // drop oldest
    }
    this.speeds.push(speed);
  }

  getBaseline() {
    if (this.speeds.length === 0) return 0;
    const sum = this.speeds.reduce((a, b) => a + b, 0);
    return sum / this.speeds.length;
  }
}
