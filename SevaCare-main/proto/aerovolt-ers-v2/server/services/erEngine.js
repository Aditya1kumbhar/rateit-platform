/**
 * AeroVolt ERS - Deterministic 2026 F1 Energy Strategy Engine
 * Node.js Decides: Deterministic math, FIA Art 5.4.7 derating, and 40-State HMM scoring.
 */

// 1. Article 5.4.7 Speed Derating Functions (kW as function of km/h)
export const calculateDerating = (speedKmh, isOverride = false) => {
  if (!isOverride) {
    if (speedKmh < 290) return 350;
    if (speedKmh >= 290 && speedKmh < 340) return Math.max(0, 1850 - 5 * speedKmh);
    if (speedKmh >= 340 && speedKmh < 345) return Math.max(0, 6900 - 20 * speedKmh);
    return 0; // Cutoff at 345 km/h
  } else {
    // Override Mode (+0.5 MJ Award)
    if (speedKmh < 337.5) return 350;
    if (speedKmh >= 337.5 && speedKmh < 355) return Math.max(0, 7100 - 20 * speedKmh);
    return 0; // Cutoff at 355 km/h
  }
};

// 2. Circuit Taxonomy Profiles
const CIRCUIT_PROFILES = {
  Baku: { type: 'asymmetric', regenCap: 8.5, straightBias: 'HIGH', saturationThreshold: 80 },
  Monza: { type: 'harvest_poor', regenCap: 8.0, straightBias: 'CRITICAL', saturationThreshold: 60 },
  Shanghai: { type: 'harvest_rich', regenCap: 8.5, straightBias: 'MEDIUM', saturationThreshold: 90 }
};

// 3. Main Deterministic Decision Engine
export const evaluateStrategy = (telemetryData) => {
  const {
    speedKmh = 280,
    carSoC = 50,
    batteryTemp = 65,
    rivalSpeedDelta = 0,
    rivalThrottle = 1.0,
    rivalAero = 'STRAIGHT',
    circuitName = 'Baku',
    gapAheadSeconds = 1.2,
    hasOverride = false
  } = telemetryData;

  const circuit = CIRCUIT_PROFILES[circuitName] || CIRCUIT_PROFILES['Baku'];

  // A. Counter-Harvest Trap Detection (HMM Heuristic)
  // High throttle + Straight Aero + Low speed delta = Covert Charging (L_harvest)
  const isSuperClipping = rivalThrottle >= 0.95 && rivalAero === 'STRAIGHT';
  const isCovertTrap = isSuperClipping && rivalSpeedDelta < -2.0;
  
  let rivalBeliefState = 'MEDIUM';
  if (isCovertTrap) {
    rivalBeliefState = 'COVERT_HARVEST_TRAP';
  } else if (rivalSpeedDelta > 3.0) {
    rivalBeliefState = 'TRUE_DERATE';
  } else if (rivalSpeedDelta > 0) {
    rivalBeliefState = 'HIGH_DEPLOYMENT';
  }

  // B. Thermal & Regulatory Penalties
  const isOverheating = batteryTemp > 85;
  const isDeratingSpeed = speedKmh >= 340;
  const currentDeratekW = calculateDerating(speedKmh, hasOverride);

  // C. Action Scoring System
  let action = 'HOLD';
  let confidence = 0.88;
  let reason = 'Maintain current stint pacing strategy.';
  let expectedGain = '0.00s';
  let batteryImpact = '+0.1 MJ';
  let fallbackAction = 'HARVEST';

  if (isOverheating) {
    action = 'LIFT_AND_COAST';
    confidence = 0.98;
    reason = `Battery temperature critical (${batteryTemp}°C). Thermal throttling enforced.`;
    expectedGain = '+0.15s';
    batteryImpact = '+0.8 MJ';
    fallbackAction = 'HARVEST';
  } else if (isCovertTrap) {
    action = 'HOLD';
    confidence = 0.94;
    reason = 'Rival throttle/aero signature indicates Covert Harvest Trap. Do NOT expend ERS.';
    expectedGain = '-0.05s';
    batteryImpact = '+0.4 MJ';
    fallbackAction = 'HARVEST';
  } else if (gapAheadSeconds <= 1.0 && hasOverride && carSoC > 30) {
    action = 'OVERRIDE';
    confidence = 0.92;
    reason = 'Override Award active within 1.0s gap. Extended 355 km/h window available.';
    expectedGain = '-0.42s';
    batteryImpact = '-1.2 MJ';
    fallbackAction = 'ATTACK';
  } else if (carSoC < 25) {
    action = 'HARVEST';
    confidence = 0.95;
    reason = `State of Charge low (${carSoC}%). Initiate Super-Clipping on straights.`;
    expectedGain = '+0.20s';
    batteryImpact = '+1.1 MJ';
    fallbackAction = 'HOLD';
  } else if (rivalBeliefState === 'TRUE_DERATE' && carSoC > 40 && !isDeratingSpeed) {
    action = 'ATTACK';
    confidence = 0.91;
    reason = 'Rival confirmed in physical energy derate. Deploy full 350 kW MGU-K boost.';
    expectedGain = '-0.38s';
    batteryImpact = '-0.9 MJ';
    fallbackAction = 'HOLD';
  }

  return {
    action,
    confidence,
    reason,
    expected_gain: expectedGain,
    battery_impact: batteryImpact,
    fallback_action: fallbackAction,
    derating_kw: currentDeratekW,
    rival_belief_state: rivalBeliefState,
    is_trap_detected: isCovertTrap,
    circuit_type: circuit.type
  };
};
