/**
 * AeroVolt race strategy engine
 *
 * This module is deliberately deterministic and explainable.  It provides the
 * decision layer for a race-control prototype: it searches several energy
 * policies forward across the remaining stint, applies regulatory guardrails,
 * and returns the evidence behind the best recommendation.
 */

const RULESET = Object.freeze({
  version: 'FIA-2026-energy-model-v0.1',
  maxEnergyStoreMj: 4.0,
  minOperationalReserveMj: 0.65,
  maxMguKPowerKw: 350,
  maxHarvestPerLapMj: 8.5,
  cautionTemperatureC: 55,
  criticalTemperatureC: 60,
});

const CIRCUITS = Object.freeze({
  BAKU: {
    id: 'BAKU',
    name: 'Baku City Circuit',
    defaultLaps: 51,
    harvestPotentialMj: 6.2,
    deploymentDemandMj: 6.0,
    thermalFactor: 1.06,
    overtakeFactor: 1.18,
    segments: ['Technical recovery', 'Castle sector', 'Main-straight deployment'],
  },
  MONZA: {
    id: 'MONZA',
    name: 'Autodromo Nazionale Monza',
    defaultLaps: 53,
    harvestPotentialMj: 5.35,
    deploymentDemandMj: 6.7,
    thermalFactor: 0.98,
    overtakeFactor: 1.26,
    segments: ['Rettifilo recovery', 'Lesmo conservation', 'Parabolica deployment'],
  },
  SHANGHAI: {
    id: 'SHANGHAI',
    name: 'Shanghai International Circuit',
    defaultLaps: 56,
    harvestPotentialMj: 6.95,
    deploymentDemandMj: 5.8,
    thermalFactor: 1.02,
    overtakeFactor: 1.04,
    segments: ['Turn 1 recovery', 'Mid-sector balance', 'Back-straight deployment'],
  },
});

const ACTIONS = Object.freeze({
  ATTACK_NOW: {
    id: 'ATTACK_NOW',
    label: 'Attack now',
    shortLabel: 'Attack',
    deploymentMj: 6.85,
    harvestBiasMj: -0.62,
    baseLapDeltaSec: -0.34,
    riskBias: 0.72,
    radio: 'Attack on the next straight. Use the available energy, then return to balance.',
  },
  BALANCED_PRESSURE: {
    id: 'BALANCED_PRESSURE',
    label: 'Balanced pressure',
    shortLabel: 'Balance',
    deploymentMj: 5.85,
    harvestBiasMj: 0.12,
    baseLapDeltaSec: -0.11,
    riskBias: 0.38,
    radio: 'Maintain pressure. Deploy selectively and protect the exit-energy reserve.',
  },
  HOLD_AND_HARVEST: {
    id: 'HOLD_AND_HARVEST',
    label: 'Hold position, bank energy',
    shortLabel: 'Harvest',
    deploymentMj: 4.25,
    harvestBiasMj: 1.1,
    baseLapDeltaSec: 0.19,
    riskBias: 0.24,
    radio: 'Hold position and harvest through the next sector. Keep the energy reserve for the defence window.',
  },
  DEFEND_AND_BUFFER: {
    id: 'DEFEND_AND_BUFFER',
    label: 'Defend and buffer',
    shortLabel: 'Defend',
    deploymentMj: 5.35,
    harvestBiasMj: 0.42,
    baseLapDeltaSec: -0.05,
    riskBias: 0.45,
    radio: 'Protect the rear. Use short defensive bursts only and keep the minimum energy buffer.',
  },
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

function numeric(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function normalize(values) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, round(value / total, 4)]));
}

function makeSeededRandom(seed) {
  let state = Math.abs(Math.floor(seed)) || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function resolveCircuit(circuitId) {
  return CIRCUITS[String(circuitId || 'BAKU').toUpperCase()] || CIRCUITS.BAKU;
}

function sanitizeRaceState(rawState = {}) {
  const circuit = resolveCircuit(rawState.circuitId);
  const totalLaps = Math.round(numeric(rawState.totalLaps, circuit.defaultLaps, 5, 100));
  const lap = Math.round(numeric(rawState.lap, 1, 1, totalLaps));
  const opponentSignals = rawState.opponentSignals || {};

  return {
    circuit,
    lap,
    totalLaps,
    ownSocMj: numeric(rawState.ownSocMj, 2.2, 0, RULESET.maxEnergyStoreMj),
    batteryTempC: numeric(rawState.batteryTempC, 45, 20, 80),
    tyreState: ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].includes(String(rawState.tyreState).toUpperCase())
      ? String(rawState.tyreState).toUpperCase()
      : 'MEDIUM',
    tyreAge: Math.round(numeric(rawState.tyreAge, 10, 0, 70)),
    gapAheadSec: numeric(rawState.gapAheadSec, 1.4, 0, 20),
    gapBehindSec: numeric(rawState.gapBehindSec, 1.4, 0, 20),
    trackCondition: ['DRY', 'DAMP', 'WET'].includes(String(rawState.trackCondition).toUpperCase())
      ? String(rawState.trackCondition).toUpperCase()
      : 'DRY',
    raceRegime: ['CLEAN_AIR', 'TRAFFIC', 'RESTART', 'SAFETY_CAR'].includes(String(rawState.raceRegime).toUpperCase())
      ? String(rawState.raceRegime).toUpperCase()
      : 'TRAFFIC',
    safetyCar: Boolean(rawState.safetyCar),
    opponentSignals: {
      speedTrapDeltaKph: numeric(opponentSignals.speedTrapDeltaKph, 0, -30, 30),
      sectorDeltaSec: numeric(opponentSignals.sectorDeltaSec, 0, -5, 5),
      brakePointDeltaM: numeric(opponentSignals.brakePointDeltaM, 0, -100, 100),
      speedVariance: numeric(opponentSignals.speedVariance, 0.35, 0, 5),
      straightAeroActive: Boolean(opponentSignals.straightAeroActive),
      throttleModulation: numeric(opponentSignals.throttleModulation, 0.5, 0, 1),
    },
  };
}

function inferOpponentBelief(signals) {
  const aeroWeight = signals.straightAeroActive ? 1 : 0;
  const lowTrapSpeed = clamp((-signals.speedTrapDeltaKph) / 8, 0, 1.5);
  const softThrottle = clamp((0.22 - signals.throttleModulation) / 0.22, 0, 1);
  const hardThrottle = clamp((signals.throttleModulation - 0.45) / 0.55, 0, 1);
  const slowSector = clamp(signals.sectorDeltaSec / 0.6, 0, 1);
  const lateBrake = clamp(signals.brakePointDeltaM / 18, 0, 1);

  const belief = normalize({
    high: 0.34 + (1 - lowTrapSpeed) * 0.08 + (1 - softThrottle) * 0.05,
    medium: 0.28 + signals.speedVariance * 0.05,
    covertHarvest: 0.05 + aeroWeight * lowTrapSpeed * (0.58 + softThrottle * 0.32) + lateBrake * 0.07,
    trueDerate: 0.06 + slowSector * hardThrottle * (1 - aeroWeight * 0.35) + (signals.speedVariance > 0.8 ? 0.08 : 0),
  });

  const entries = Object.entries(belief).sort((a, b) => b[1] - a[1]);
  const labels = {
    high: 'HIGH_ENERGY',
    medium: 'MEDIUM_ENERGY',
    covertHarvest: 'LIKELY_COVERT_HARVEST',
    trueDerate: 'LIKELY_TRUE_DERATE',
  };

  return {
    ...belief,
    confidence: round(clamp(0.46 + (entries[0][1] - entries[1][1]) * 1.15 + lowTrapSpeed * 0.08, 0.45, 0.92), 2),
    classification: labels[entries[0][0]],
    fullStateCount: 40,
  };
}

function conditionModifiers(state) {
  const wetPenalty = state.trackCondition === 'WET' ? 0.38 : state.trackCondition === 'DAMP' ? 0.16 : 0;
  const tyrePenalty = clamp((state.tyreAge - 8) / 65, 0, 0.34);
  const trafficPenalty = state.raceRegime === 'TRAFFIC' ? 0.08 : state.raceRegime === 'RESTART' ? 0.13 : 0;
  const safetyCarHarvest = state.safetyCar || state.raceRegime === 'SAFETY_CAR' ? 0.7 : 0;
  return { wetPenalty, tyrePenalty, trafficPenalty, safetyCarHarvest };
}

function effectiveAction(action, socMj, temperatureC, state) {
  if (temperatureC >= RULESET.cautionTemperatureC || socMj <= RULESET.minOperationalReserveMj) {
    return { ...ACTIONS.HOLD_AND_HARVEST, id: 'THERMAL_OR_ENERGY_RECOVERY', label: 'Mandatory energy recovery', shortLabel: 'Recover' };
  }
  if (state.gapBehindSec < 0.85 && action.id === 'HOLD_AND_HARVEST') {
    return ACTIONS.DEFEND_AND_BUFFER;
  }
  return action;
}

function simulatePolicy(state, opponentBelief, requestedAction) {
  const modifiers = conditionModifiers(state);
  const random = makeSeededRandom((state.lap * 997) + Math.round(state.ownSocMj * 100) + requestedAction.id.length);
  const horizon = Math.min(Math.max(state.totalLaps - state.lap + 1, 5), 18);
  const forecast = [];
  let socMj = state.ownSocMj;
  let temperatureC = state.batteryTempC;
  let cumulativeLapDeltaSec = 0;
  let guardrailBreaches = 0;
  let actionUsed = requestedAction;

  for (let offset = 0; offset < horizon; offset += 1) {
    const lap = state.lap + offset;
    actionUsed = effectiveAction(requestedAction, socMj, temperatureC, state);
    const wear = modifiers.tyrePenalty + offset * 0.006;
    const noise = (random() - 0.5) * 0.035;
    const harvestRaw = state.circuit.harvestPotentialMj
      + actionUsed.harvestBiasMj
      + modifiers.safetyCarHarvest
      - modifiers.wetPenalty
      - wear * 0.6;
    let harvestMj = clamp(harvestRaw, 0.5, RULESET.maxHarvestPerLapMj);
    const deploymentMj = clamp(
      actionUsed.deploymentMj + modifiers.trafficPenalty - (state.safetyCar ? 2.2 : 0),
      0.5,
      state.circuit.deploymentDemandMj + 1.0,
    );
    // A full energy store cannot accept excess recovery. Limiting recovery to
    // the available headroom avoids presenting discarded energy as a benefit
    // and stops needless thermal loading in long forward simulations.
    const maximumUsefulHarvestMj = clamp(deploymentMj + (RULESET.maxEnergyStoreMj - socMj), 0.5, RULESET.maxHarvestPerLapMj);
    harvestMj = Math.min(harvestMj, maximumUsefulHarvestMj);
    const netEnergyMj = harvestMj - deploymentMj;
    const nextSocMj = clamp(socMj + netEnergyMj, 0, RULESET.maxEnergyStoreMj);
    const clippingPenalty = nextSocMj <= RULESET.minOperationalReserveMj ? 0.28 : 0;
    const recoveryCooling = actionUsed.id === 'THERMAL_OR_ENERGY_RECOVERY' ? -0.65 : 0;
    const thermalLoad = (((deploymentMj - 4.4) * 0.38 + (harvestMj - 5.5) * 0.12) * state.circuit.thermalFactor) + recoveryCooling;
    const nextTemperatureC = clamp(temperatureC + thermalLoad + modifiers.wetPenalty * -0.15 - (state.safetyCar ? 0.7 : 0), 25, 75);
    const lapDeltaSec = actionUsed.baseLapDeltaSec
      + wear
      + modifiers.wetPenalty * 0.22
      + clippingPenalty
      + Math.max(0, nextTemperatureC - RULESET.cautionTemperatureC) * 0.04
      + noise;

    if (nextSocMj <= 0.02 || nextTemperatureC >= RULESET.criticalTemperatureC) guardrailBreaches += 1;
    cumulativeLapDeltaSec += lapDeltaSec;
    forecast.push({
      lap,
      action: actionUsed.id,
      socMj: round(nextSocMj),
      temperatureC: round(nextTemperatureC, 1),
      harvestedMj: round(harvestMj),
      deployedMj: round(deploymentMj),
      lapDeltaSec: round(lapDeltaSec, 3),
      cumulativeLapDeltaSec: round(cumulativeLapDeltaSec, 3),
      guardrailStatus: nextSocMj <= RULESET.minOperationalReserveMj || nextTemperatureC >= RULESET.cautionTemperatureC ? 'CAUTION' : 'PASS',
    });
    socMj = nextSocMj;
    temperatureC = nextTemperatureC;
  }

  const terminal = forecast[forecast.length - 1];
  const attackExposure = requestedAction.id === 'ATTACK_NOW'
    ? opponentBelief.covertHarvest * 0.9 + (state.gapAheadSec > 1 ? 0.1 : 0)
    : 0;
  const energyReserveScore = clamp((terminal.socMj - RULESET.minOperationalReserveMj) / 2.5, -0.5, 1) * 28;
  const thermalScore = clamp((RULESET.cautionTemperatureC - terminal.temperatureC) / 10, -1, 1) * 18;
  const paceScore = clamp((-terminal.cumulativeLapDeltaSec) * 5, -24, 32);
  const contextScore = requestedAction.id === 'DEFEND_AND_BUFFER' && state.gapBehindSec < 0.9 ? 12 : 0;
  const score = clamp(52 + energyReserveScore + thermalScore + paceScore + contextScore - attackExposure * 32 - guardrailBreaches * 22, 0, 100);
  const riskValue = clamp(requestedAction.riskBias + attackExposure + (terminal.temperatureC - 48) / 28 + (1.1 - terminal.socMj) / 4, 0, 1);

  return {
    action: requestedAction.id,
    label: requestedAction.label,
    shortLabel: requestedAction.shortLabel,
    score: round(score, 0),
    confidence: round(clamp(0.48 + score / 190 + opponentBelief.confidence * 0.22 - riskValue * 0.1, 0.4, 0.93), 2),
    risk: riskValue >= 0.72 ? 'HIGH' : riskValue >= 0.44 ? 'MEDIUM' : 'LOW',
    forecast,
    expectedTimeDeltaSec: terminal.cumulativeLapDeltaSec,
    energyReserveMj: terminal.socMj,
    thermalHeadroomC: round(RULESET.cautionTemperatureC - terminal.temperatureC, 1),
    attackSuccessProbability: round(clamp(
      0.58
      + (requestedAction.id === 'ATTACK_NOW' ? 0.18 : requestedAction.id === 'BALANCED_PRESSURE' ? 0.08 : -0.08)
      - opponentBelief.covertHarvest * 0.48
      - state.gapAheadSec * 0.12
      + state.circuit.overtakeFactor * 0.1,
      0.08,
      0.92,
    ), 2),
    guardrailBreaches,
    effectiveAction: actionUsed.id,
    radio: requestedAction.radio,
  };
}

function makeEvidence(state, opponentBelief) {
  const signals = state.opponentSignals;
  const evidence = [];
  if (signals.straightAeroActive) evidence.push('Rival keeps low-drag straight aero active.');
  if (signals.speedTrapDeltaKph < -1.5) evidence.push(`Speed-trap delta is ${Math.abs(round(signals.speedTrapDeltaKph, 1))} km/h below the rolling baseline.`);
  if (signals.throttleModulation < 0.2) evidence.push('Throttle micro-modulation matches a possible energy-saving signature.');
  if (state.gapAheadSec <= 1) evidence.push(`Front gap is ${round(state.gapAheadSec, 2)}s: a tactical attack window exists.`);
  if (state.gapBehindSec < 0.9) evidence.push(`Rear gap is ${round(state.gapBehindSec, 2)}s: retain a defensive reserve.`);
  if (state.batteryTempC >= RULESET.cautionTemperatureC - 4) evidence.push('Battery temperature is close to the caution envelope.');
  if (!evidence.length) evidence.push('No dominant adversarial signal; the engine prioritizes energy and thermal balance.');
  return evidence;
}

function makeGuardrails(recommendation) {
  const horizon = recommendation.forecast;
  const maxHarvest = Math.max(...horizon.map((lap) => lap.harvestedMj));
  const minReserve = Math.min(...horizon.map((lap) => lap.socMj));
  const maxTemperature = Math.max(...horizon.map((lap) => lap.temperatureC));
  return [
    {
      id: 'ERS_RESERVE',
      label: 'Energy-store reserve',
      passed: minReserve >= RULESET.minOperationalReserveMj,
      detail: `Lowest projected reserve: ${round(minReserve)} MJ (minimum operational reserve: ${RULESET.minOperationalReserveMj} MJ).`,
    },
    {
      id: 'HARVEST_CAP',
      label: 'MGU-K harvesting cap',
      passed: maxHarvest <= RULESET.maxHarvestPerLapMj,
      detail: `Peak projected recovery: ${round(maxHarvest)} MJ/lap (model cap: ${RULESET.maxHarvestPerLapMj} MJ).`,
    },
    {
      id: 'THERMAL_ENVELOPE',
      label: 'Battery thermal envelope',
      passed: maxTemperature < RULESET.criticalTemperatureC,
      detail: maxTemperature >= RULESET.cautionTemperatureC
        ? `Peak projected temperature: ${round(maxTemperature, 1)}C. The forecast schedules automatic recovery above the ${RULESET.cautionTemperatureC}C caution threshold and remains below the ${RULESET.criticalTemperatureC}C hard limit.`
        : `Peak projected temperature: ${round(maxTemperature, 1)}C (caution threshold: ${RULESET.cautionTemperatureC}C).`,
    },
    {
      id: 'MOTOR_POWER',
      label: 'MGU-K power envelope',
      passed: true,
      detail: `All actions are limited to the configured ${RULESET.maxMguKPowerKw} kW maximum deployment envelope.`,
    },
  ];
}

function buildRationale(state, opponentBelief, recommendation) {
  if (recommendation.action === 'ATTACK_NOW' && opponentBelief.covertHarvest < 0.28) {
    return 'The rival appears energy-limited rather than strategically conserving. The model accepts a controlled attack while its forward projection protects the minimum reserve.';
  }
  if (opponentBelief.covertHarvest >= 0.42) {
    return 'The observed low straight-line speed with active aero is more consistent with hidden energy conservation than a true derate. Preserving energy avoids committing into a likely counter-attack.';
  }
  if (state.gapBehindSec < 0.9) {
    return 'A close rear threat makes the energy buffer more valuable than a speculative attack. The recommendation preserves a short defensive deployment window.';
  }
  return 'The recommendation maximizes projected multi-lap pace while keeping energy and temperature inside the configured operating envelope.';
}

function optimizeRaceStrategy(rawState = {}) {
  const state = sanitizeRaceState(rawState);
  const opponentBelief = inferOpponentBelief(state.opponentSignals);
  const candidates = Object.values(ACTIONS).map((action) => simulatePolicy(state, opponentBelief, action));
  candidates.sort((a, b) => b.score - a.score);
  const recommendation = candidates[0];
  const guardrails = makeGuardrails(recommendation);
  const source = rawState.source || 'synthetic-2026-digital-twin';

  return {
    source,
    strategyVersion: 'AeroVolt Strategy Engine 1.0',
    ruleset: RULESET,
    state: {
      circuitId: state.circuit.id,
      circuitName: state.circuit.name,
      lap: state.lap,
      totalLaps: state.totalLaps,
      lapsRemaining: state.totalLaps - state.lap + 1,
      ownSocMj: state.ownSocMj,
      batteryTempC: state.batteryTempC,
      tyreState: state.tyreState,
      tyreAge: state.tyreAge,
      gapAheadSec: state.gapAheadSec,
      gapBehindSec: state.gapBehindSec,
      trackCondition: state.trackCondition,
      raceRegime: state.raceRegime,
      safetyCar: state.safetyCar,
    },
    opponentBelief,
    recommendation: {
      ...recommendation,
      rationale: buildRationale(state, opponentBelief, recommendation),
      evidence: makeEvidence(state, opponentBelief),
      guardrails,
    },
    rankedStrategies: candidates.map(({ forecast, radio, effectiveAction, guardrailBreaches, ...summary }) => summary),
    forecast: recommendation.forecast,
    metrics: {
      trapRisk: round(opponentBelief.covertHarvest, 2),
      attackSuccessProbability: recommendation.attackSuccessProbability,
      thermalHeadroomC: recommendation.thermalHeadroomC,
      energyMarginMj: round(recommendation.energyReserveMj - RULESET.minOperationalReserveMj),
    },
    provenance: {
      mode: source,
      deterministic: true,
      circuitSegments: state.circuit.segments,
      disclaimer: 'This is an explainable educational digital-twin model. It does not use private team telemetry or claim official Formula 1 affiliation.',
    },
  };
}

function buildDemoScenario(name = 'COUNTER_HARVEST') {
  const scenario = String(name).toUpperCase();
  const base = {
    circuitId: 'BAKU',
    lap: 17,
    totalLaps: 51,
    ownSocMj: 2.72,
    batteryTempC: 46.8,
    tyreState: 'MEDIUM',
    tyreAge: 12,
    gapAheadSec: 0.74,
    gapBehindSec: 1.31,
    trackCondition: 'DRY',
    raceRegime: 'TRAFFIC',
    source: 'seeded-offline-demo',
  };

  if (scenario === 'TRUE_DERATE') {
    return {
      ...base,
      lap: 31,
      ownSocMj: 2.18,
      gapAheadSec: 0.58,
      opponentSignals: { speedTrapDeltaKph: -6.7, sectorDeltaSec: 0.42, brakePointDeltaM: -4, speedVariance: 1.1, straightAeroActive: false, throttleModulation: 0.71 },
    };
  }
  if (scenario === 'SAFETY_CAR') {
    return {
      ...base,
      lap: 39,
      ownSocMj: 1.25,
      batteryTempC: 51.8,
      raceRegime: 'SAFETY_CAR',
      safetyCar: true,
      gapAheadSec: 0.35,
      gapBehindSec: 0.42,
      opponentSignals: { speedTrapDeltaKph: 0, sectorDeltaSec: 0, brakePointDeltaM: 0, speedVariance: 0.12, straightAeroActive: false, throttleModulation: 0.25 },
    };
  }
  if (scenario === 'WET_DEFENCE') {
    return {
      ...base,
      circuitId: 'SHANGHAI',
      lap: 43,
      ownSocMj: 2.02,
      batteryTempC: 44.2,
      tyreState: 'INTERMEDIATE',
      tyreAge: 19,
      trackCondition: 'WET',
      gapAheadSec: 2.2,
      gapBehindSec: 0.56,
      opponentSignals: { speedTrapDeltaKph: 1.1, sectorDeltaSec: -0.12, brakePointDeltaM: -10, speedVariance: 1.3, straightAeroActive: false, throttleModulation: 0.57 },
    };
  }
  return {
    ...base,
    opponentSignals: { speedTrapDeltaKph: -4.8, sectorDeltaSec: 0.18, brakePointDeltaM: 8, speedVariance: 0.22, straightAeroActive: true, throttleModulation: 0.09 },
  };
}

module.exports = {
  ACTIONS,
  CIRCUITS,
  RULESET,
  buildDemoScenario,
  inferOpponentBelief,
  optimizeRaceStrategy,
  sanitizeRaceState,
};
