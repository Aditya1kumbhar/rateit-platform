// services/scoring.js – deterministic scoring for each possible action

/**
 * Compute scores for all candidate actions based on the current telemetry,
 * baseline, belief distributions, and trap detection flag.
 * Returns an object where keys are action names and values are { score }.
 */
export function scoreActions({ packet, baselineSpeed, batteryBelief, tyreBelief, isTrap }) {
  // Helper to safely access belief values
  const { low: bLow, medium: bMed, high: bHigh } = batteryBelief;
  const { low: tLow, medium: tMed, high: tHigh } = tyreBelief;

  // Base numeric helpers
  const speedFactor = packet.speedKmh / (baselineSpeed || 1);
  const throttleFactor = packet.throttlePercent / 100;

  // Scoring formulas – each action has a distinct combination of terms
  const scores = {};

  // ATTACK – favors high battery, high speed, low trap risk
  scores.ATTACK =
    bHigh * 1.0 +
    bMed * 0.5 +
    (1 - isTrap) * 0.8 +
    speedFactor * 0.4 -
    (packet.brakePercent / 100) * 0.2;

  // DEFEND – prefers medium battery, lower speed, safety
  scores.DEFEND =
    bMed * 0.9 +
    bLow * 0.3 +
    (1 - isTrap) * 0.6 +
    (1 - speedFactor) * 0.3;

  // HOLD – balanced choice, uses baseline confidence
  scores.HOLD = bMed * 0.6 + tMed * 0.6 + (1 - isTrap) * 0.5;

  // HARVEST – used when battery is low and tyre wear is acceptable
  scores.HARVEST =
    bLow * 1.0 +
    (1 - tHigh) * 0.4 +
    (packet.throttlePercent / 100) * 0.2;

  // WAIT – conservative, prefers high tyre condition and low speed variance
  scores.WAIT = tHigh * 0.8 + (1 - speedFactor) * 0.4;

  // OVERRIDE – aggressive rescue when trap detected
  scores.OVERRIDE = isTrap ? 1.5 : 0.0;

  // LIFT_AND_COAST – when brake usage is high and speed is near baseline
  scores.LIFT_AND_COAST =
    (packet.brakePercent / 100) * 0.7 +
    Math.abs(baselineSpeed - packet.speedKmh) / (baselineSpeed || 1) * 0.3;

  // Ensure scores are numeric
  for (const key of Object.keys(scores)) {
    scores[key] = { score: Number(scores[key]) };
  }

  return scores;
}
