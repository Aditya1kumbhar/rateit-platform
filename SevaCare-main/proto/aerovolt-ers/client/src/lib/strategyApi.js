const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export const DEFAULT_RACE_STATE = {
  circuitId: 'BAKU',
  circuitName: 'Baku City Circuit',
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
  safetyCar: false,
  opponentSignals: {
    speedTrapDeltaKph: -4.8,
    sectorDeltaSec: 0.18,
    brakePointDeltaM: 8,
    speedVariance: 0.22,
    straightAeroActive: true,
    throttleModulation: 0.09,
  },
};

export async function optimizeStrategy(raceState) {
  const response = await fetch(`${API_BASE_URL}/api/strategy/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(raceState),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'The strategy engine could not complete this simulation.');
  }

  return payload;
}

export async function getDemoScenario(scenario = 'COUNTER_HARVEST') {
  const response = await fetch(`${API_BASE_URL}/api/demo/scenario?scenario=${encodeURIComponent(scenario)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'The demo scenario could not be loaded.');
  }
  return payload;
}

export function buildLocalFallback(raceState = DEFAULT_RACE_STATE) {
  const lapsRemaining = Math.max(1, raceState.totalLaps - raceState.lap + 1);
  const projectedStint = Array.from({ length: Math.min(lapsRemaining, 18) }, (_, index) => {
    const lap = raceState.lap + index;
    const degradation = index * 0.07;
    const soc = Math.max(0.62, raceState.ownSocMj - index * 0.055 + (index % 4 === 0 ? 0.12 : 0));
    return {
      lap,
      socMj: Number(soc.toFixed(2)),
      temperatureC: Number((raceState.batteryTempC + index * 0.16).toFixed(1)),
      lapDeltaSec: Number((-0.11 + degradation).toFixed(3)),
      energyMode: index < 3 ? 'BALANCE' : 'HARVEST',
    };
  });

  return {
    source: 'offline-demo-fallback',
    strategyVersion: 'AeroVolt 0.1',
    state: raceState,
    opponentBelief: {
      high: 0.16,
      medium: 0.19,
      covertHarvest: 0.57,
      trueDerate: 0.08,
      confidence: 0.72,
      classification: 'LIKELY_COVERT_HARVEST',
    },
    recommendation: {
      action: 'HOLD_AND_HARVEST',
      label: 'Hold position, bank energy',
      confidence: 0.72,
      expectedPositionDelta: 0,
      expectedTimeDeltaSec: 0.18,
      energyReserveMj: 1.95,
      risk: 'MEDIUM',
      radio: 'Hold position. Rival signature suggests stored energy; bank the next sector and keep Override in reserve.',
      rationale: 'A low speed-trap delta while straight aero remains active is more consistent with deliberate energy conservation than a true battery derate.',
      evidence: [
        'Straight aero remains active',
        'Speed trap is 4.8 km/h below the rival baseline',
        'Throttle modulation is consistent with covert harvesting',
      ],
      guardrails: [
        { label: 'Energy-store reserve', passed: true, detail: 'Projected reserve stays above 1.50 MJ.' },
        { label: 'Thermal envelope', passed: true, detail: 'Battery remains below the 55°C caution threshold.' },
        { label: 'Overtake risk gate', passed: true, detail: 'Attack is deferred while rival harvest probability is high.' },
      ],
    },
    rankedStrategies: [
      { action: 'HOLD_AND_HARVEST', label: 'Hold + harvest', score: 82, confidence: 0.72, risk: 'MEDIUM', expectedTimeDeltaSec: 0.18, energyReserveMj: 1.95 },
      { action: 'BALANCED_PRESSURE', label: 'Balanced pressure', score: 67, confidence: 0.64, risk: 'MEDIUM', expectedTimeDeltaSec: 0.06, energyReserveMj: 1.54 },
      { action: 'ATTACK_NOW', label: 'Attack now', score: 43, confidence: 0.42, risk: 'HIGH', expectedTimeDeltaSec: -0.19, energyReserveMj: 0.74 },
    ],
    forecast: projectedStint,
    metrics: {
      attackSuccessProbability: 0.41,
      trapRisk: 0.76,
      thermalHeadroomC: 8.2,
      energyMarginMj: 1.45,
    },
  };
}
