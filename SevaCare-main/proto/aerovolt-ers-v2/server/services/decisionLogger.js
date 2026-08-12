// services/decisionLogger.js – persist decisions to Supabase
import { insertDecision } from "../db/supabaseClient.js";

export async function logDecision(telemetryId, decision) {
  if (!telemetryId) return; // skip if telemetry wasn't persisted

  await insertDecision({
    telemetry_id:   telemetryId,
    lap_number:     decision.lap || 0,
    action:         decision.action,
    confidence:     decision.confidence,
    explanation:    decision.radio_text || decision.reason || "",
  });
}
