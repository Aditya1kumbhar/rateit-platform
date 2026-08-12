// services/regimeClassifier.js – classify race regime from packet + baseline
// Defensive: handles null baseline and missing fields gracefully.

export function classifyRegime(packet, baseline) {
  const gapAhead  = packet.gap_ahead ?? 5;
  const lapTime   = packet.lap_time ?? 0;
  const throttle  = packet.throttle ?? 50;
  const trackTemp = packet.track_temp ?? 30;

  // If no baseline yet, default to "clean"
  if (!baseline || !baseline.lap_time) return "clean";

  // Qualifying pace: lap time well below baseline
  if (lapTime > 0 && lapTime < baseline.lap_time * 0.9) return "qualifying";

  // Clean air: large gap ahead
  if (gapAhead > 5) return "clean";

  // Offensive: close gap + heavy throttle
  if (gapAhead < 1 && throttle > 80) return "offensive";

  // Defensive: close gap + light throttle
  if (gapAhead < 1 && throttle < 30) return "defensive";

  // Recovery: hot track + slow lap
  if (trackTemp > 45 && lapTime > baseline.lap_time * 1.1) return "recovery";

  return "cooldown";
}
