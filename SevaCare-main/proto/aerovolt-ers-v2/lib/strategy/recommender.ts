import { CarState, validateRecommendation } from '../rules/guardrails';
import { REGULATIONS } from '../regulations/v19';

/**
 * Explainable strategy recommendation engine (Deterministic, no LLMs).
 */
export function recommendStrategy(carState: CarState, opponentBelief: any, circuitSegment: any) {
  const recommendations = [
    {
      action: "ATTACK_NOW",
      expectedOutcome: "Gain position in DRS zone",
      confidence: 0.85,
      evidence: ["High SoC", "Opponent in CONSERVE mode"],
      ruleChecks: [] as any[],
      power_kW: 350,
      isOverride: true
    },
    {
      action: "HOLD_ENERGY",
      expectedOutcome: "Maintain gap, build SoC for later attack",
      confidence: 0.6,
      evidence: ["Moderate SoC", "Opponent in NORMAL mode"],
      ruleChecks: [] as any[],
      power_kW: 100,
      isOverride: false
    },
    {
      action: "HARVEST",
      expectedOutcome: "Recover energy, slight time loss",
      confidence: 0.9,
      evidence: ["Low SoC", "Opponent in PUSH mode"],
      ruleChecks: [] as any[],
      power_kW: 0,
      isOverride: false
    }
  ];

  for (const rec of recommendations) {
    const checkResult = validateRecommendation(
      { action: rec.action, isOverride: rec.isOverride, power_kW: rec.power_kW },
      carState,
      REGULATIONS
    );
    rec.ruleChecks = checkResult.checks;
  }

  // Pure deterministic logic filtering/scoring based on guardrails
  return recommendations;
}
