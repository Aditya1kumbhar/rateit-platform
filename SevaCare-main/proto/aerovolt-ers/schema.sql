-- AeroVolt Race Control - Supabase schema
-- Apply in the Supabase SQL editor. This schema stores reproducible strategy
-- runs; it intentionally does not claim access to private team telemetry.

create extension if not exists pgcrypto;

create table if not exists circuits (
    id text primary key,
    circuit_name text not null,
    total_laps integer not null check (total_laps > 0),
    harvest_cap_mj numeric(4, 2) not null check (harvest_cap_mj between 0 and 9),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into circuits (id, circuit_name, total_laps, harvest_cap_mj, metadata)
values
    ('BAKU', 'Baku City Circuit', 51, 8.50, '{"classification":"asymmetric","segments":["Technical recovery","Castle sector","Main-straight deployment"]}'::jsonb),
    ('MONZA', 'Autodromo Nazionale Monza', 53, 8.00, '{"classification":"harvest-poor","segments":["Rettifilo recovery","Lesmo conservation","Parabolica deployment"]}'::jsonb),
    ('SHANGHAI', 'Shanghai International Circuit', 56, 8.50, '{"classification":"harvest-rich","segments":["Turn 1 recovery","Mid-sector balance","Back-straight deployment"]}'::jsonb)
on conflict (id) do update set
    circuit_name = excluded.circuit_name,
    total_laps = excluded.total_laps,
    harvest_cap_mj = excluded.harvest_cap_mj,
    metadata = excluded.metadata,
    updated_at = now();

-- A source session makes every replay or synthetic scenario traceable.
create table if not exists race_sessions (
    id uuid primary key default gen_random_uuid(),
    circuit_id text not null references circuits(id),
    session_name text not null,
    source_mode text not null check (source_mode in ('historical-replay', 'synthetic-2026-digital-twin', 'seeded-offline-demo')),
    source_reference text,
    started_at timestamptz,
    created_at timestamptz not null default now()
);

-- Segment-level features are compact enough for the free tier. Store raw public
-- telemetry outside this table only when a source licence allows it.
create table if not exists telemetry_features (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references race_sessions(id) on delete cascade,
    driver_label text not null,
    lap_number integer not null check (lap_number > 0),
    segment_label text not null,
    recorded_at timestamptz,
    speed_trap_delta_kph numeric(7, 3),
    sector_delta_sec numeric(7, 3),
    brake_point_delta_m numeric(8, 3),
    speed_variance numeric(8, 4),
    straight_aero_active boolean,
    throttle_modulation numeric(6, 4),
    feature_source text not null default 'synthetic',
    created_at timestamptz not null default now()
);

create index if not exists telemetry_features_session_lap_idx
    on telemetry_features (session_id, lap_number);

-- The central decision audit record. JSONB retains the exact input, belief,
-- ranked policies and forecast that generated a recommendation.
create table if not exists strategy_runs (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references race_sessions(id) on delete set null,
    circuit_id text not null references circuits(id),
    lap_number integer not null check (lap_number > 0),
    source_mode text not null,
    model_version text not null,
    input_state jsonb not null,
    opponent_belief jsonb not null,
    recommendation jsonb not null,
    forecast jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists strategy_runs_circuit_lap_idx
    on strategy_runs (circuit_id, lap_number, created_at desc);

create index if not exists strategy_runs_created_at_idx
    on strategy_runs (created_at desc);

create table if not exists model_evaluations (
    id uuid primary key default gen_random_uuid(),
    model_version text not null,
    scenario_name text not null,
    scenario_seed text not null,
    metrics jsonb not null,
    notes text,
    created_at timestamptz not null default now()
);

-- The browser never writes these audit tables. A server endpoint using the
-- Supabase service-role key records runs after strategy calculation.
alter table circuits enable row level security;
alter table race_sessions enable row level security;
alter table telemetry_features enable row level security;
alter table strategy_runs enable row level security;
alter table model_evaluations enable row level security;

drop policy if exists "public can read circuits" on circuits;
create policy "public can read circuits" on circuits
    for select using (true);

-- Legacy prototype tables retained for migration compatibility.
create table if not exists circuit_twins (
    id serial primary key,
    circuit_name varchar(100) not null,
    harvest_cap_mj decimal(4, 2) not null check (harvest_cap_mj between 5.0 and 9.0),
    total_laps integer not null,
    harvest_zones jsonb,
    overtake_zones jsonb
);

create table if not exists race_telemetry_logs (
    id serial primary key,
    lap_number integer not null,
    car_soc decimal(5, 2) not null,
    battery_temp decimal(5, 2) not null,
    opponent_belief_soc decimal(5, 2) not null,
    deception_risk boolean default false,
    recommended_action varchar(255),
    confidence_score decimal(3, 2)
);
