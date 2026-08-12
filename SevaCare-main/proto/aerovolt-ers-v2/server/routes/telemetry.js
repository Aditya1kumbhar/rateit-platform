// routes/telemetry.js – POST /process endpoint (full pipeline)
import express from "express";
import { validateTelemetry } from "../services/telemetryValidator.js";
import { addToBaseline, getBaseline } from "../services/baseline.js";
import { updateBelief } from "../services/beliefEstimator.js";
import { detectTrap } from "../services/trapDetector.js";
import { loadCircuitProfile } from "../services/circuitLoader.js";
import { classifyRegime } from "../services/regimeClassifier.js";
import { selectAction } from "../services/strategyEngine.js";
import { applyFallback } from "../services/fallback.js";
import { logDecision } from "../services/decisionLogger.js";
import { generateRadioText } from "../services/explanationFormatter.js";
import { insertTelemetry } from "../db/supabaseClient.js";
import { config } from "../config/env.js";

const router = express.Router();

router.post("/process", async (req, res) => {
  try {
    // 1. Validate & clean (throws on invalid → caught below → 400)
    const packet = validateTelemetry(req.body);

    // 2. Persist raw telemetry
    const telemetryRow = await insertTelemetry({
      lap_number:       packet.lap,
      speed_kmh:        packet.speed,
      throttle_percent: packet.throttle,
      brake_percent:    packet.brake,
      gear:             packet.gear,
      rpm:              0, // not in MVP telemetry
      battery_soc:      packet.own_soc,
      tyre_wear:        0, // not in MVP telemetry
      aero_drag:        0,
      drivetrain_temp:  0,
    });
    const telemetryId = telemetryRow?.id;

    // 3. Rolling baseline (5-lap window)
    addToBaseline(packet);
    const baseline = getBaseline(packet.circuit_name);

    // 4. Circuit profile (static lookup)
    const circuitProfile = loadCircuitProfile(packet.circuit_name);

    // 5. Classify race regime
    const regime = classifyRegime(packet, baseline);

    // 6. Belief estimation
    const belief = updateBelief(packet);

    // 7. Trap detection
    const trapInfo = detectTrap(packet);
    if (trapInfo.isTrap) {
      belief.low_derate = Math.min(belief.low_derate + 0.1, 1);
    }

    // 8. Deterministic action selection (uses erEngine internally)
    const decision = selectAction({ belief, packet, circuitProfile, regime, baseline });

    // 9. Low-confidence fallback
    let finalDecision = decision;
    if (decision.confidence < config.confidenceThreshold) {
      finalDecision = applyFallback(packet);
    }

    // 10. Radio text (Groq LLM or template fallback)
    const radioText = await generateRadioText(finalDecision);
    finalDecision.radio_text = radioText;

    // 11. Log decision
    if (telemetryId) {
      await logDecision(telemetryId, { ...finalDecision, lap: packet.lap });
    }

    // 12. Return strict JSON
    return res.json(finalDecision);
  } catch (err) {
    console.error("[ROUTE] Telemetry processing error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

export default router;
