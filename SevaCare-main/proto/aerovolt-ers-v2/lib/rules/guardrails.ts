import { REGULATIONS, validateDeployment } from '../regulations/v19';

export interface CarState {
  speed: number;
  soc: number;
  energyRecovered_MJ: number;
  mgukEnergy_MJ: number;
  thermalState_C: number;
  leadingCarGap_s: number;
}

export interface Recommendation {
  action: string;
  isOverride: boolean;
  power_kW: number;
}

/**
 * Validates a recommendation against deterministic regulation guardrails.
 */
export function validateRecommendation(recommendation: Recommendation, carState: CarState, regulationVersion: typeof REGULATIONS = REGULATIONS) {
  const checks = [];
  const violations = [];

  // MGU-K Power limits
  const deploymentCheck = validateDeployment(carState.speed, carState.soc, recommendation.isOverride);
  
  const powerPassed = recommendation.power_kW <= deploymentCheck.maxPower_kW;
  checks.push({ rule: "MGU-K Power limits", passed: powerPassed });
  if (!powerPassed) {
    violations.push(`Requested power ${recommendation.power_kW}kW exceeds allowed ${deploymentCheck.maxPower_kW}kW at speed ${carState.speed}km/h.`);
  }

  // SoC window
  const socPassed = carState.soc >= regulationVersion.energyBudget.minSoC_pct && carState.soc <= regulationVersion.energyBudget.maxSoC_pct;
  checks.push({ rule: "SoC Window", passed: socPassed });
  if (!socPassed) {
    violations.push(`SoC ${carState.soc}% out of bounds.`);
  }

  // Energy budget
  const budgetPassed = carState.energyRecovered_MJ <= regulationVersion.energyBudget.maxRecoveryPerLap_MJ &&
                       carState.mgukEnergy_MJ <= regulationVersion.energyBudget.mgukMaxEnergy_MJ;
  checks.push({ rule: "Energy Budget", passed: budgetPassed });
  if (!budgetPassed) {
    violations.push("Energy budget limits exceeded.");
  }

  // Override eligibility
  if (recommendation.isOverride) {
    const overridePassed = carState.leadingCarGap_s <= 1.0;
    checks.push({ rule: "Override Eligibility", passed: overridePassed });
    if (!overridePassed) {
      violations.push("Override requested but gap > 1s.");
    }
  }

  // Combine checks
  const passed = checks.every(c => c.passed);
  return {
    passed,
    checks,
    violations: [...violations, ...deploymentCheck.violations]
  };
}
