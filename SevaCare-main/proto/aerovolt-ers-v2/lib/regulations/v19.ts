/**
 * FIA 2026 Technical Regulations versioned config.
 */
export const REGULATIONS = {
  version: "2026 Technical Regulations Section C, Issue 19",
  published: "June 2026",
  source: "https://www.fia.com/regulation/category/110",
  mguk: {
    maxPower_kW: 350,
    derate: {
      standard: { startSpeed_kmh: 290, endSpeed_kmh: 345, rate_kWperKmh: 5 },
      override: { startSpeed_kmh: 337.5, endSpeed_kmh: 355, rate_kWperKmh: 20 }
    }
  },
  energyBudget: {
    maxRecoveryPerLap_MJ: 8.5,
    minSoC_pct: 0,
    maxSoC_pct: 100,
    mgukMaxEnergy_MJ: 3.0
  },
  override: {
    activationCondition: "leading car within 1s",
    durationLimit_s: null
  }
};

/**
 * Validates deployment power limits against current speed and regulations.
 */
export function validateDeployment(speed: number, soc: number, isOverride: boolean) {
  let maxPower_kW = REGULATIONS.mguk.maxPower_kW;
  const violations: string[] = [];

  const derateProfile = isOverride ? REGULATIONS.mguk.derate.override : REGULATIONS.mguk.derate.standard;

  if (speed > derateProfile.startSpeed_kmh) {
    if (speed >= derateProfile.endSpeed_kmh) {
      maxPower_kW = 0;
    } else {
      const speedDiff = speed - derateProfile.startSpeed_kmh;
      maxPower_kW = Math.max(0, REGULATIONS.mguk.maxPower_kW - (speedDiff * derateProfile.rate_kWperKmh));
    }
  }

  if (soc <= REGULATIONS.energyBudget.minSoC_pct) {
    violations.push("SoC below minimum limit.");
    maxPower_kW = 0;
  }
  
  return {
    allowed: violations.length === 0,
    maxPower_kW,
    violations
  };
}
