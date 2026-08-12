# AeroVolt ERS Deterministic Backend

This repository contains a **production‑like** Node.js + Express backend that implements the deterministic motorsport strategy pipeline described in the project brief.

## Folder Structure
```
server/
├─ package.json                # NPM package definition
├─ src/
│   └─ index.js                # Express entry point
├─ config/
│   └─ env.js                  # Environment loader
├─ db/
│   └─ supabaseClient.js       # Supabase helper functions
├─ services/
│   ├─ telemetryValidator.js   # Validation & cleaning of packets
│   ├─ baseline.js              # Rolling 5‑lap baseline (in‑memory)
│   ├─ beliefEstimator.js       # Deterministic hidden‑state estimator
│   ├─ trapDetector.js          # Counter‑harvest detection
│   ├─ circuitLoader.js         # Load circuit profile from Supabase
│   ├─ regimeClassifier.js      # Race regime classifier
│   ├─ strategyEngine.js        # Scoring matrix & action selection
│   ├─ fallback.js              # Low‑confidence safety fallback
│   ├─ decisionLogger.js        # Persist decision logs
│   └─ explanationFormatter.js # Groq GPT‑OSS 120B explanation (fallback template)
├─ routes/
│   └─ telemetry.js            # POST /api/telemetry endpoint
├─ tests/
│   ├─ telemetry.test.js       # Integration test for the endpoint
│   └─ strategyEngine.test.js  # Unit tests for scoring logic
└─ schema.sql                  # Supabase table definitions
```
All paths are relative to `c:\Users\hp\Desktop\NXT\SevaCare-main\proto\aerovolt-ers-v2\server`.

## Database Schema (`schema.sql`)
- `circuit_profiles` – stores a JSONB `profile` describing circuit type (`harvest‑rich`, `harvest‑poor`, `asymmetric`).
- `race_telemetry` – raw telemetry packets (plus a copy of the original JSON in `raw`).
- `strategy_logs` – one row per decision with a foreign key to `race_telemetry`.

> **Tip**: In Supabase you can simply run the `schema.sql` file from the SQL editor.

## Environment (`.env` example)
```dotenv
# Supabase credentials (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key   # optional, gives write rights

# Groq (optional – used only for a human‑readable radio call)
GROQ_API_KEY=your-groq-key

# Server configuration
PORT=5000
CONFIDENCE_THRESHOLD=0.6   # below this the fallback action is used
```
The backend will **exit** if Supabase credentials are missing. If `GROQ_API_KEY` is absent or the request fails, a deterministic template is returned.

## Running the Backend Locally
```bash
# 1️⃣ Install dependencies
cd server
npm install

# 2️⃣ Apply the DB schema in Supabase (or a local Postgres instance)
#    – copy the contents of server/schema.sql into the Supabase SQL editor.

# 3️⃣ Create a .env file at the project root (see above).

# 4️⃣ Start the server
npm run dev   # listens on http://localhost:5000
```
You should see:
```
🚀 Backend listening on http://localhost:5000
```

## Sample Request / Response
### Request (POST `/api/telemetry`)
```json
{
  "timestamp": "2026-08-02T13:20:00Z",
  "lap": 12,
  "sector": 2,
  "speed": 320,
  "throttle": 98,
  "brake": 0,
  "gear": 8,
  "lap_time": 91.2,
  "sector_time": 30.4,
  "gap_ahead": 1.3,
  "track_temp": 38,
  "circuit_name": "Baku",
  "own_soc": 0.68,
  "opponent_speed_delta": -5,
  "aero_state": "open"
}
```
### Response (JSON)
```json
{
  "action": "HOLD",
  "confidence": 0.91,
  "reason": "Selected HOLD based on belief and regime offensive",
  "expected_gain": 0.05,
  "battery_impact": -0.04,
  "fallback_action": "HARVEST",
  "radio_text": "Pit Wall: Stay in position, monitor opponent's harvest mode."
}
```
If the `GROQ_API_KEY` is missing, `radio_text` will contain a deterministic template such as:
```
Pit Wall: Hold current pace, watch rivals.
```

## Tests
```bash
npm test
```
The test suite runs two Jest files:
- **telemetry.test.js** – exercises the full endpoint (requires a reachable Supabase instance).
- **strategyEngine.test.js** – validates that the scoring matrix prefers the expected actions for a few handcrafted belief/packet scenarios.
All tests should pass (`PASS`).

---
Feel free to tweak the weighting constants in `strategyEngine.js` or add more circuit profiles – the architecture is deliberately modular for future ML/HMM extensions.
