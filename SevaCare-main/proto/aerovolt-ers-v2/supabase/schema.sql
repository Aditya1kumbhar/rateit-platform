-- AeroVolt ERS v2.0 — Full Production Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- REFERENCE DATA
-- ============================================================

-- Circuits
CREATE TABLE IF NOT EXISTS circuits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    total_laps INT NOT NULL,
    track_length_m DECIMAL(8,1) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circuit Segments
CREATE TABLE IF NOT EXISTS circuit_segments (
    id SERIAL PRIMARY KEY,
    circuit_id INT REFERENCES circuits(id) ON DELETE CASCADE,
    segment_index INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('straight', 'corner', 'chicane', 'pit_entry', 'pit_exit')),
    distance_m DECIMAL(8,1) NOT NULL,
    elevation_change_m DECIMAL(5,1) DEFAULT 0,
    harvest_potential DECIMAL(3,2) DEFAULT 0 CHECK (harvest_potential >= 0 AND harvest_potential <= 1),
    overtake_value DECIMAL(3,2) DEFAULT 0 CHECK (overtake_value >= 0 AND overtake_value <= 1),
    thermal_stress DECIMAL(3,2) DEFAULT 0 CHECK (thermal_stress >= 0 AND thermal_stress <= 1),
    aero_eligible BOOLEAN DEFAULT FALSE,
    expected_braking_recovery_mj DECIMAL(4,2) DEFAULT 0,
    energy_cap_mj DECIMAL(4,2) DEFAULT 0,
    UNIQUE(circuit_id, segment_index)
);

-- ============================================================
-- SESSION & TELEMETRY
-- ============================================================

-- Sessions (race replays, digital twin runs, demo scenarios)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circuit_id INT REFERENCES circuits(id),
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('replay', 'twin', 'demo')),
    source VARCHAR(50), -- 'openf1', 'synthetic', 'seeded_scenario'
    year INT,
    label VARCHAR(200),
    total_laps INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry Features (derived 1-second or segment-level, not raw bulk)
CREATE TABLE IF NOT EXISTS telemetry_features (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    lap_number INT NOT NULL,
    segment_index INT,
    timestamp_s DECIMAL(10,3),
    speed_kmh DECIMAL(6,1),
    throttle_fraction DECIMAL(4,3),
    brake_pressure DECIMAL(4,3),
    soc_pct DECIMAL(5,2),
    battery_temp_c DECIMAL(5,1),
    power_kw DECIMAL(6,1),
    aero_mode VARCHAR(10) CHECK (aero_mode IN ('STRAIGHT', 'CORNER')),
    speed_trap_delta DECIMAL(6,2),
    sector_time_delta DECIMAL(6,3),
    braking_point_offset DECIMAL(6,1),
    speed_variance DECIMAL(8,2),
    throttle_clipping_s DECIMAL(5,2),
    ground_truth_state VARCHAR(30), -- Only set in synthetic/demo data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lap Summaries
CREATE TABLE IF NOT EXISTS lap_summaries (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    lap_number INT NOT NULL,
    lap_time_s DECIMAL(8,3),
    avg_speed_kmh DECIMAL(6,1),
    end_soc_pct DECIMAL(5,2),
    end_battery_temp_c DECIMAL(5,1),
    total_harvest_mj DECIMAL(5,2),
    total_deploy_mj DECIMAL(5,2),
    is_trap_lap BOOLEAN DEFAULT FALSE,
    UNIQUE(session_id, lap_number)
);

-- ============================================================
-- MODEL & INFERENCE
-- ============================================================

-- Model Versions
CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    version_tag VARCHAR(50) NOT NULL UNIQUE,
    model_type VARCHAR(30) NOT NULL DEFAULT 'hmm_40state',
    params_hash VARCHAR(64), -- SHA-256 of params.json
    training_data_source VARCHAR(100),
    training_samples INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opponent Beliefs (per-lap HMM inference results)
CREATE TABLE IF NOT EXISTS opponent_beliefs (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    model_version_id INT REFERENCES model_versions(id),
    lap_number INT NOT NULL,
    belief_high DECIMAL(5,4),
    belief_medium DECIMAL(5,4),
    belief_covert_harvest DECIMAL(5,4),
    belief_true_derate DECIMAL(5,4),
    deception_risk BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(5,4),
    dominant_state VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital Twin Runs
CREATE TABLE IF NOT EXISTS twin_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    model_version_id INT REFERENCES model_versions(id),
    scenario_seed INT,
    regulation_version VARCHAR(100),
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STRATEGY & DECISIONS
-- ============================================================

-- Strategy Recommendations
CREATE TABLE IF NOT EXISTS strategy_recommendations (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    lap_number INT NOT NULL,
    segment_index INT,
    primary_action VARCHAR(30) NOT NULL,
    primary_confidence DECIMAL(5,4),
    primary_expected_outcome TEXT,
    primary_evidence JSONB,
    alt_1_action VARCHAR(30),
    alt_1_confidence DECIMAL(5,4),
    alt_2_action VARCHAR(30),
    alt_2_confidence DECIMAL(5,4),
    rule_checks_passed INT,
    rule_checks_total INT,
    violations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario Runs (What-If simulations)
CREATE TABLE IF NOT EXISTS scenario_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    scenario_type VARCHAR(30) CHECK (scenario_type IN ('attack', 'defend', 'harvest', 'safety_car', 'rain', 'custom')),
    parameters JSONB,
    result JSONB,
    impact_delta_s DECIMAL(6,3),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVALUATION & AUDIT
-- ============================================================

-- Evaluation Runs
CREATE TABLE IF NOT EXISTS evaluation_runs (
    id SERIAL PRIMARY KEY,
    model_version_id INT REFERENCES model_versions(id),
    test_data_source VARCHAR(100),
    test_samples INT,
    precision_trap DECIMAL(5,4),
    recall_trap DECIMAL(5,4),
    f1_trap DECIMAL(5,4),
    brier_score DECIMAL(5,4),
    confusion_matrix JSONB, -- [[TP, FP], [FN, TN]]
    baseline_comparison JSONB,
    noise_robustness JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_telemetry_session_lap ON telemetry_features(session_id, lap_number);
CREATE INDEX IF NOT EXISTS idx_beliefs_session_lap ON opponent_beliefs(session_id, lap_number);
CREATE INDEX IF NOT EXISTS idx_recommendations_session_lap ON strategy_recommendations(session_id, lap_number);
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_events(session_id);

-- ============================================================
-- SEED DATA: Baku City Circuit
-- ============================================================

INSERT INTO circuits (name, country, total_laps, track_length_m)
VALUES ('Baku City Circuit', 'Azerbaijan', 51, 6003.0)
ON CONFLICT (name) DO NOTHING;

-- Insert Baku segments (matching python/data/baku_segments.json)
INSERT INTO circuit_segments (circuit_id, segment_index, name, type, distance_m, elevation_change_m, harvest_potential, overtake_value, thermal_stress, aero_eligible, expected_braking_recovery_mj, energy_cap_mj)
SELECT c.id, s.segment_index, s.name, s.type, s.distance_m, s.elevation_change_m, s.harvest_potential, s.overtake_value, s.thermal_stress, s.aero_eligible, s.expected_braking_recovery_mj, s.energy_cap_mj
FROM circuits c,
(VALUES
    (1, 'Turn 1 (90° Right)', 'corner', 180.0, -2.0, 0.35, 0.75, 0.45, false, 0.42, 0.50),
    (2, 'Turn 2 (90° Left)', 'corner', 150.0, 0.0, 0.30, 0.20, 0.50, false, 0.35, 0.40),
    (3, 'Short Straight to T3', 'straight', 280.0, 1.5, 0.15, 0.10, 0.20, true, 0.10, 0.30),
    (4, 'Castle Section Entry', 'chicane', 200.0, 8.0, 0.40, 0.05, 0.70, false, 0.50, 0.45),
    (5, 'Castle Climb', 'corner', 350.0, 12.0, 0.25, 0.05, 0.80, false, 0.30, 0.35),
    (6, 'Castle Exit', 'corner', 180.0, -3.0, 0.30, 0.10, 0.65, false, 0.35, 0.40),
    (7, 'Descent to Inner City', 'straight', 450.0, -8.0, 0.20, 0.15, 0.25, true, 0.15, 0.35),
    (8, 'Turns 8-11 Complex', 'chicane', 380.0, -2.0, 0.45, 0.10, 0.60, false, 0.55, 0.50),
    (9, 'Turn 12 (Tight Left)', 'corner', 120.0, 0.0, 0.35, 0.15, 0.55, false, 0.40, 0.45),
    (10, 'Boulevard Run', 'straight', 550.0, 0.0, 0.20, 0.25, 0.20, true, 0.12, 0.30),
    (11, 'Turn 15 (Hairpin Approach)', 'corner', 200.0, 0.0, 0.50, 0.60, 0.50, false, 0.60, 0.55),
    (12, 'Turn 16 (90° Right)', 'corner', 160.0, 0.0, 0.40, 0.35, 0.45, false, 0.45, 0.50),
    (13, 'Acceleration Zone', 'straight', 380.0, 0.0, 0.15, 0.20, 0.15, true, 0.08, 0.25),
    (14, 'Turn 18-19 Chicane', 'chicane', 250.0, 0.0, 0.45, 0.15, 0.55, false, 0.50, 0.50),
    (15, 'Main Straight (T20 to T1)', 'straight', 2130.0, 0.0, 0.90, 0.95, 0.10, true, 0.05, 0.90),
    (16, 'DRS Detection Zone', 'straight', 243.0, 0.0, 0.10, 0.80, 0.10, true, 0.03, 0.15)
) AS s(segment_index, name, type, distance_m, elevation_change_m, harvest_potential, overtake_value, thermal_stress, aero_eligible, expected_braking_recovery_mj, energy_cap_mj)
WHERE c.name = 'Baku City Circuit';

-- Initial model version
INSERT INTO model_versions (version_tag, model_type, training_data_source, notes)
VALUES ('v0.1.0-synthetic', 'hmm_40state', 'python/data/synthetic/baku_race_001.json', 'Initial HMM trained on synthetic Baku data with seed=42')
ON CONFLICT (version_tag) DO NOTHING;
