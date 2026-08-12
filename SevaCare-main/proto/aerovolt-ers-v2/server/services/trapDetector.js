// services/trapDetector.js – detect counter-harvest traps from telemetry
// Accepts the raw packet (field names: throttle, speed, opponent_speed_delta, aero_state)

export function detectTrap(packet) {
  const throttle = packet.throttle || 0;
  const delta = packet.opponent_speed_delta || 0;
  const aero = packet.aero_state || "";

  // Covert harvest trap: rival is super-clipping (high throttle + straight aero)
  // yet losing speed (negative delta) → they are secretly charging
  if (throttle >= 95 && aero === "STRAIGHT" && delta < -2.0) {
    return { isTrap: true, trapType: "COVERT_HARVEST" };
  }

  return { isTrap: false, trapType: null };
}
