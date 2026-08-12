// db/supabaseClient.js – graceful Supabase client with optional persistence
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

export let supabase = null;
export let dbAvailable = false;

if (config.supabaseUrl && config.supabaseKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseKey);
  dbAvailable = true;
  console.log("[DB] Supabase client initialized.");
} else {
  console.warn("[DB] Supabase credentials missing — database operations will be skipped.");
}

/**
 * Insert a telemetry row. Returns { id } or { id: null } if DB unavailable.
 */
export async function insertTelemetry(row) {
  if (!dbAvailable) return { id: null };
  const { data, error } = await supabase
    .from("telemetry")
    .insert([row])
    .select("id")
    .single();
  if (error) {
    console.error("[DB] insertTelemetry failed:", error.message);
    return { id: null };
  }
  return data;
}

/**
 * Insert a decision row. Silently skips if DB unavailable.
 */
export async function insertDecision(row) {
  if (!dbAvailable) return;
  const { error } = await supabase.from("decisions").insert([row]);
  if (error) {
    console.error("[DB] insertDecision failed:", error.message);
  }
}
