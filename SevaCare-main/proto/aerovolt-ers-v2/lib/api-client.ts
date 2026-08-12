/**
 * Frontend API Client Service
 * Interacts deterministically with /api/telemetry, /api/hmm, /api/rules, and /api/strategy.
 * Includes explicit error boundaries and network exception handling.
 */
import { realtimeManager, TelemetryCallback, BeliefCallback } from './realtime';

export interface TelemetryFeature {
  lap: number;
  speed: number;
  power: number;
  soc: number;
  temp: number;
  isTrapEvent: boolean;
}

export interface HMMResponse {
  success: boolean;
  probabilities?: {
    beliefs: Record<string, number>;
    deceptionRisk: boolean;
    confidence: number;
    dominantState: string;
  };
  error?: string;
  logId?: string;
}

export interface RulesResponse {
  success: boolean;
  result?: {
    passed: boolean;
    checks: Array<{ rule: string; passed: boolean }>;
    violations: string[];
  };
  error?: string;
  logId?: string;
}

export interface StrategyResponse {
  success: boolean;
  strategy?: Array<{
    action: string;
    expectedOutcome: string;
    confidence: number;
    evidence: string[];
    ruleChecks: Array<{ rule: string; passed: boolean }>;
    power_kW: number;
    isOverride: boolean;
  }>;
  error?: string;
  logId?: string;
}

export function subscribeToLiveTelemetry(sessionId: string, onData: TelemetryCallback) {
  try {
    realtimeManager.subscribeToTelemetry(sessionId, onData);
    return { success: true };
  } catch (err) {
    console.error('[API_CLIENT] Failed to subscribe to telemetry:', err);
    return { success: false, error: 'WebSocket subscription failed' };
  }
}

export function subscribeToLiveBeliefs(sessionId: string, onData: BeliefCallback) {
  try {
    realtimeManager.subscribeToBeliefs(sessionId, onData);
    return { success: true };
  } catch (err) {
    console.error('[API_CLIENT] Failed to subscribe to beliefs:', err);
    return { success: false, error: 'WebSocket subscription failed' };
  }
}

export async function disconnectLiveStreams() {
  await realtimeManager.unsubscribeAll();
}

export async function runHMMInference(features: number[]): Promise<HMMResponse> {
  try {
    const res = await fetch('/api/hmm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    return await res.json();
  } catch (err) {
    console.error('[API_CLIENT] Failed to call HMM API:', err);
    return { success: false, error: 'Network failure calling HMM API' };
  }
}

export async function validateRules(carState: any, recommendation: any): Promise<RulesResponse> {
  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carState, recommendation })
    });
    return await res.json();
  } catch (err) {
    console.error('[API_CLIENT] Failed to call Rules API:', err);
    return { success: false, error: 'Network failure calling Rules API' };
  }
}

export async function getStrategyRecommendation(carState: any, opponentBelief: any): Promise<StrategyResponse> {
  try {
    const res = await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carState, opponentBelief })
    });
    return await res.json();
  } catch (err) {
    console.error('[API_CLIENT] Failed to call Strategy API:', err);
    return { success: false, error: 'Network failure calling Strategy API' };
  }
}
