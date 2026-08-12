// services/telemetryValidator.js – validate and clean incoming telemetry
// THROWS on invalid input (the route catch block returns 400).

const NUMERIC_FIELDS = [
  "lap", "speed", "throttle", "brake", "gear",
  "lap_time", "sector_time", "gap_ahead", "track_temp", "own_soc",
];

export function validateTelemetry(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  // circuit_name is required and must be a string
  if (typeof body.circuit_name !== "string" || body.circuit_name.trim() === "") {
    throw new Error("Missing or invalid field: circuit_name (must be a non-empty string).");
  }

  const packet = { circuit_name: body.circuit_name.trim() };

  for (const key of NUMERIC_FIELDS) {
    const val = Number(body[key]);
    if (body[key] == null || Number.isNaN(val)) {
      throw new Error(`Missing or non-numeric field: ${key}`);
    }
    packet[key] = val;
  }

  // Optional fields (pass through if present)
  if (body.opponent_speed_delta != null) packet.opponent_speed_delta = Number(body.opponent_speed_delta) || 0;
  if (body.aero_state != null) packet.aero_state = String(body.aero_state);

  return packet;
}
