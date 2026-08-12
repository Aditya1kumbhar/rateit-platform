// services/beliefEstimator.js – battery belief + rival state estimation
// Exports updateBelief(packet) as used by the route.

export function updateBelief(packet) {
  const soc = packet.own_soc; // 0-1 scale
  const delta = packet.opponent_speed_delta || 0;

  // --- Battery belief (three-bucket distribution summing to 1.0) ---
  let low, medium, high;
  if (soc < 0.3) {
    low = 0.7; medium = 0.2; high = 0.1;
  } else if (soc < 0.6) {
    low = 0.2; medium = 0.6; high = 0.2;
  } else {
    low = 0.1; medium = 0.3; high = 0.6;
  }

  // --- Rival state inference from speed delta ---
  let rivalState = "MEDIUM";
  if (delta < -2.0) {
    rivalState = "COVERT_HARVEST_TRAP";
  } else if (delta > 3.0) {
    rivalState = "TRUE_DERATE";
  } else if (delta > 0) {
    rivalState = "HIGH_DEPLOYMENT";
  }

  return {
    batteryBelief: { low, medium, high },
    rivalState,
    low_derate: 0, // can be bumped externally by trap detector
  };
}
