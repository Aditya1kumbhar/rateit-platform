const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RULESET,
  buildDemoScenario,
  inferOpponentBelief,
  optimizeRaceStrategy,
  sanitizeRaceState,
} = require('./raceStrategyEngine');

test('counter-harvest scenario produces a normalized opponent belief and ranked strategies', () => {
  const result = optimizeRaceStrategy(buildDemoScenario('COUNTER_HARVEST'));
  const totalBelief = Object.values({
    high: result.opponentBelief.high,
    medium: result.opponentBelief.medium,
    covertHarvest: result.opponentBelief.covertHarvest,
    trueDerate: result.opponentBelief.trueDerate,
  }).reduce((sum, value) => sum + value, 0);

  assert.equal(result.opponentBelief.classification, 'LIKELY_COVERT_HARVEST');
  assert.ok(Math.abs(totalBelief - 1) < 0.002);
  assert.equal(result.rankedStrategies.length, 4);
  assert.ok(result.rankedStrategies[0].score >= result.rankedStrategies[1].score);
  assert.ok(result.forecast.length >= 5);
  assert.ok(result.recommendation.guardrails.every((guardrail) => guardrail.passed));
});

test('the strategy forecast always stays inside the model energy-store bounds', () => {
  const result = optimizeRaceStrategy({
    ...buildDemoScenario('WET_DEFENCE'),
    ownSocMj: 0.05,
    batteryTempC: 58,
  });

  for (const lap of result.forecast) {
    assert.ok(lap.socMj >= 0);
    assert.ok(lap.socMj <= RULESET.maxEnergyStoreMj);
    assert.ok(lap.harvestedMj <= RULESET.maxHarvestPerLapMj);
  }
});

test('true derate signals are separated from the counter-harvest signature', () => {
  const trap = inferOpponentBelief(buildDemoScenario('COUNTER_HARVEST').opponentSignals);
  const derate = inferOpponentBelief(buildDemoScenario('TRUE_DERATE').opponentSignals);

  assert.ok(trap.covertHarvest > trap.trueDerate);
  assert.ok(derate.trueDerate > derate.covertHarvest);
});

test('race-state sanitizer preserves zero values instead of overwriting them with defaults', () => {
  const state = sanitizeRaceState({
    lap: 1,
    totalLaps: 51,
    ownSocMj: 0,
    batteryTempC: 0,
    gapAheadSec: 0,
    gapBehindSec: 0,
    opponentSignals: { throttleModulation: 0, speedTrapDeltaKph: 0 },
  });

  assert.equal(state.ownSocMj, 0);
  assert.equal(state.gapAheadSec, 0);
  assert.equal(state.gapBehindSec, 0);
  assert.equal(state.opponentSignals.throttleModulation, 0);
});
