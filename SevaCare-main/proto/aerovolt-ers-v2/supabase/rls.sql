-- AeroVolt ERS v2.0 — Supabase Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor after running schema.sql

-- Enable RLS on all tables
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE lap_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Read-Only Access for Anonymous Users (Public API)
-- Allows frontend to fetch reference data and read public demo sessions

CREATE POLICY "Allow public read access to circuits" ON circuits
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to circuit segments" ON circuit_segments
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to telemetry" ON telemetry_features
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to model versions" ON model_versions
    FOR SELECT USING (true);

-- 2. Insert/Update Access for Anonymous Users (API endpoints)
-- In a real production scenario, these would require an authenticated role,
-- but for the Next.js API route handlers to function correctly with anon keys:

CREATE POLICY "Allow anon insert to sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update to sessions" ON sessions
    FOR UPDATE USING (true);

CREATE POLICY "Allow anon insert to telemetry" ON telemetry_features
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon insert to beliefs" ON opponent_beliefs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to beliefs" ON opponent_beliefs
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert to recommendations" ON strategy_recommendations
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to recommendations" ON strategy_recommendations
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert to scenario_runs" ON scenario_runs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select to scenario_runs" ON scenario_runs
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert to audit_events" ON audit_events
    FOR INSERT WITH CHECK (true);

-- 3. Authenticated Admin Access (Full Control)
-- This assumes a role or user claim that denotes admin status, 
-- but we can use the default authenticated role for full access.

CREATE POLICY "Allow authenticated full access to all tables" ON circuits
    FOR ALL USING (auth.role() = 'authenticated');
-- (Repeat for other tables if using user authentication)
