// services/fallback.js – low-confidence safety fallback
// MVP default: HARVEST if own_soc < 0.4, else HOLD

export function applyFallback(packet) {
  const action = packet.own_soc < 0.4 ? "HARVEST" : "HOLD";
  return {
    action,
    confidence: 0.0,
    reason: "Low confidence fallback triggered.",
    expected_gain: "0.00s",
    battery_impact: "+0.0 MJ",
    fallback_action: action,
  };
}
