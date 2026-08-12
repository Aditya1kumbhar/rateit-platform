/**
 * Seeded offline Baku counter-harvest trap demo scenario.
 * Laps 15, 28, 42 are trap events.
 */
export const BAKU_TRAP_SCENARIO = {
  name: "Baku Counter-Harvest Trap",
  laps: Array.from({ length: 51 }).map((_, i) => ({
    lap: i + 1,
    isTrapEvent: [15, 28, 42].includes(i + 1),
    speed: 310 + Math.random() * 30,
    power: 200 + Math.random() * 150,
    soc: 20 + Math.random() * 80,
    temp: 90 + Math.random() * 30,
    throttle: Math.random(),
    aeroMode: "DEFAULT",
    opponentState: [15, 28, 42].includes(i + 1) ? "TRAP_DEFEND" : "NORMAL",
    groundTruth: "TRAP_DEFEND"
  }))
};
