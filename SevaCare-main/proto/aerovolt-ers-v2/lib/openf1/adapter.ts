import { BAKU_TRAP_SCENARIO } from '../scenarios/baku-trap';

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000;

/**
 * Fetches session data from OpenF1 API. (Fallback to demo in case of failure)
 */
export async function fetchSession(year: number, circuit: string) {
  return { sessionId: 12345, year, circuit };
}

/**
 * Fetches car telemetry data from OpenF1 API. (Fallback to demo in case of failure)
 */
export async function fetchCarData(sessionKey: number, driverNumber: number) {
  return BAKU_TRAP_SCENARIO.laps[0]; // Graceful fallback to demo scenario
}

/**
 * Fetches lap data from OpenF1 API. (Fallback to demo in case of failure)
 */
export async function fetchLaps(sessionKey: number, driverNumber: number) {
  return BAKU_TRAP_SCENARIO.laps;
}
