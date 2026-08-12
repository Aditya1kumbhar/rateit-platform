// server/services/baseline.js
/**
 * Rolling baseline of the last 5 laps for a given circuit.
 * Stored in memory for simplicity. In a production system this could be persisted.
 */

const baselineStore = new Map(); // key: circuit_name, value: array of recent packets

export function addToBaseline(packet) {
  const { circuit_name, lap, speed, throttle, brake, gear, lap_time, sector_time, own_soc } = packet;
  if (!circuit_name) return;
  const store = baselineStore.get(circuit_name) || [];
  store.push({ lap, speed, throttle, brake, gear, lap_time, sector_time, own_soc });
  // keep only latest 5 laps (by lap number)
  const unique = [];
  const seen = new Set();
  // sort descending lap then keep unique laps
  store
    .sort((a, b) => b.lap - a.lap)
    .forEach((p) => {
      if (!seen.has(p.lap)) {
        seen.add(p.lap);
        unique.push(p);
      }
    });
  baselineStore.set(circuit_name, unique.slice(0, 5));
}

export function getBaseline(circuit_name) {
  const store = baselineStore.get(circuit_name) || [];
  if (store.length === 0) return null;
  // calculate averages for each numeric field
  const avg = store.reduce(
    (acc, p) => {
      acc.speed += p.speed;
      acc.throttle += p.throttle;
      acc.brake += p.brake;
      acc.gear += p.gear;
      acc.lap_time += p.lap_time;
      acc.sector_time += p.sector_time;
      acc.own_soc += p.own_soc;
      return acc;
    },
    { speed: 0, throttle: 0, brake: 0, gear: 0, lap_time: 0, sector_time: 0, own_soc: 0 }
  );
  const n = store.length;
  return {
    speed: avg.speed / n,
    throttle: avg.throttle / n,
    brake: avg.brake / n,
    gear: avg.gear / n,
    lap_time: avg.lap_time / n,
    sector_time: avg.sector_time / n,
    own_soc: avg.own_soc / n,
  };
}
