const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const { calculateDerating, detectCounterHarvestTrap, compute40StateHMM, simulateStintSandbox } = require('./services/erEngine');
const { buildDemoScenario, optimizeRaceStrategy, RULESET } = require('./services/raceStrategyEngine');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '256kb' }));

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function persistStrategyRun(result) {
  if (!hasSupabaseConfig) return { persisted: false, reason: 'Supabase is not configured.' };

  try {
    const { error } = await supabase.from('strategy_runs').insert([{
      circuit_id: result.state.circuitId,
      lap_number: result.state.lap,
      source_mode: result.source,
      model_version: result.strategyVersion,
      input_state: result.state,
      opponent_belief: result.opponentBelief,
      recommendation: result.recommendation,
      forecast: result.forecast,
    }]);
    if (error) throw error;
    return { persisted: true };
  } catch (error) {
    console.warn('Strategy run was calculated but could not be persisted:', error.message);
    return { persisted: false, reason: error.message };
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AeroVolt Race Strategy API',
    strategyVersion: 'AeroVolt Strategy Engine 1.0',
    ruleset: RULESET.version,
    persistenceConfigured: hasSupabaseConfig,
  });
});

app.get('/api/demo/scenario', (req, res) => {
  const requestedScenario = req.query.scenario || 'COUNTER_HARVEST';
  const state = buildDemoScenario(requestedScenario);
  const result = optimizeRaceStrategy(state);
  res.json({ scenario: String(requestedScenario).toUpperCase(), ...result });
});

// The central hackathon API: searches competing multi-lap energy policies,
// applies guardrails, and returns an explainable recommendation.
app.post('/api/strategy/optimize', async (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ error: 'Race state must be a JSON object.' });
  }

  try {
    const result = optimizeRaceStrategy(req.body);
    const persistence = await persistStrategyRun(result);
    return res.json({ ...result, persistence });
  } catch (error) {
    console.error('Strategy optimization failed:', error);
    return res.status(500).json({ error: 'Strategy optimization failed.', detail: error.message });
  }
});

// Legacy telemetry endpoint retained for focused physics inspection.
app.post('/api/telemetry/process', (req, res) => {
  try {
    const { speed_kmh: speedKmh, isOverride, throttleFraction, deltaVtrap, activeAeroState } = req.body || {};
    const derating = calculateDerating(Number(speedKmh) || 0, Boolean(isOverride));
    const deceptionRisk = detectCounterHarvestTrap(Number(throttleFraction) || 0, Number(deltaVtrap) || 0, activeAeroState || 'CORNER');
    const hmmResult = compute40StateHMM(Number(throttleFraction) || 0, Number(deltaVtrap) || 0, activeAeroState || 'CORNER');
    return res.json({ derating, deceptionRisk, hmmResult });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Backwards-compatible route. It now returns an engineered recommendation,
// not an LLM-generated instruction disconnected from the race model.
app.post('/api/strategy/calculate', async (req, res) => {
  try {
    const result = optimizeRaceStrategy(req.body || {});
    const persistence = await persistStrategyRun(result);
    return res.json({
      radioMessage: result.recommendation.radio,
      confidenceScore: result.recommendation.confidence,
      reasonCode: result.recommendation.action,
      audioScript: result.recommendation.radio,
      strategy: result,
      persistence,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/sandbox/simulate', (req, res) => {
  try {
    const { targetSocBuffer, liftAndCoastAggression, driverMode } = req.body || {};
    const result = simulateStintSandbox(
      targetSocBuffer ?? 20,
      liftAndCoastAggression ?? 10,
      driverMode || 'ATTACK_PUSH',
    );
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/hmm/matrix', (req, res) => {
  try {
    const { throttleFraction, deltaVtrap, activeAeroState } = req.body || {};
    const result = compute40StateHMM(throttleFraction ?? 0.1, deltaVtrap ?? -2.5, activeAeroState || 'STRAIGHT');
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AeroVolt Race Strategy API listening on port ${PORT}`);
  });
}

module.exports = app;
