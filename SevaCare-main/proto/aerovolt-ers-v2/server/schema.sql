/*
  schema.sql – database schema for the AeroVolt ERS backend.
  Stores raw telemetry, normalized belief distributions, and decision records.
*/

-- Telemetry raw data (one row per received telemetry packet)
CREATE TABLE IF NOT EXISTS telemetry (
  id                BIGSERIAL PRIMARY KEY,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  lap_number        INTEGER NOT NULL,
  speed_kmh         NUMERIC NOT NULL,
  throttle_percent  NUMERIC NOT NULL,
  brake_percent     NUMERIC NOT NULL,
  gear              INTEGER NOT NULL,
  rpm               INTEGER NOT NULL,
  battery_soc       NUMERIC NOT NULL,
  tyre_wear         NUMERIC NOT NULL,
  aero_drag         NUMERIC NOT NULL,
  drivetrain_temp   NUMERIC NOT NULL
);

-- Belief state per lap (separate distributions for battery and tyre)
CREATE TABLE IF NOT EXISTS belief_state (
  id                BIGSERIAL PRIMARY KEY,
  telemetry_id      BIGINT REFERENCES telemetry(id) ON DELETE CASCADE,
  lap_number        INTEGER NOT NULL,
  battery_low       NUMERIC NOT NULL,
  battery_medium    NUMERIC NOT NULL,
  battery_high      NUMERIC NOT NULL,
  tyre_low          NUMERIC NOT NULL,
  tyre_medium       NUMERIC NOT NULL,
  tyre_high         NUMERIC NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Decision records – deterministic strategy outcome per lap
CREATE TABLE IF NOT EXISTS decisions (
  id                BIGSERIAL PRIMARY KEY,
  telemetry_id      BIGINT REFERENCES telemetry(id) ON DELETE CASCADE,
  lap_number        INTEGER NOT NULL,
  action            TEXT NOT NULL,
  confidence        NUMERIC NOT NULL,
  explanation       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookup by lap
CREATE INDEX IF NOT EXISTS idx_telemetry_lap ON telemetry(lap_number);
CREATE INDEX IF NOT EXISTS idx_belief_lap ON belief_state(lap_number);
CREATE INDEX IF NOT EXISTS idx_decision_lap ON decisions(lap_number);
