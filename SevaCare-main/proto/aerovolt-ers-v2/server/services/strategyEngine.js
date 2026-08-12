// services/strategyEngine.js – maps packet to erEngine and returns full decision
// Exports selectAction({ belief, packet, circuitProfile, regime, baseline })

import { evaluateStrategy } from "./erEngine.js";

export function selectAction({ belief, packet, circuitProfile, regime, baseline }) {
  // Map incoming telemetry fields → erEngine's expected shape
  const telemetryData = {
    speedKmh:         packet.speed,
    carSoC:           packet.own_soc * 100,       // erEngine expects 0-100
    batteryTemp:      65,                          // not in MVP telemetry
    rivalSpeedDelta:  packet.opponent_speed_delta || 0,
    rivalThrottle:    (packet.throttle || 80) / 100,
    rivalAero:        packet.aero_state === "STRAIGHT" ? "STRAIGHT" : "CORNERING",
    circuitName:      packet.circuit_name || "Baku",
    gapAheadSeconds:  packet.gap_ahead ?? 5,
    hasOverride:      false,                       // MVP default
  };

  // erEngine.evaluateStrategy returns the full decision object:
  // { action, confidence, reason, expected_gain, battery_impact, fallback_action,
  //   derating_kw, rival_belief_state, is_trap_detected, circuit_type }
  return evaluateStrategy(telemetryData);
}
