# Folder Structure (created under `server/`)
```
server/
├─ package.json                # npm package definition
├─ src/
│   └─ index.js                # Express app entry point
├─ config/
│   └─ env.js                  # env loader
├─ db/
│   └─ supabaseClient.js       # Supabase helpers
├─ services/
│   ├─ telemetryValidator.js   # Validate & clean telemetry
│   ├─ baseline.js              # Rolling 5‑lap baseline
│   ├─ beliefEstimator.js       # Hidden rival state estimator
│   ├─ trapDetector.js          # Counter‑harvest detection
│   ├─ circuitLoader.js         # Load circuit profile from DB
│   ├─ regimeClassifier.js      # Race regime classifier
│   ├─ strategyEngine.js        # Score actions & pick best
│   ├─ fallback.js              # Safety / low‑confidence fallback
│   ├─ decisionLogger.js        # Persist decision log
│   └─ explanationFormatter.js # Groq explanation (optional)
├─ routes/
│   └─ telemetry.js            # POST /api/telemetry endpoint
└─ tests/
    ├─ telemetry.test.js       # Integration test for endpoint
    └─ strategyEngine.test.js  # Unit tests for scoring
```

*All paths are relative to `c:\Users\hp\Desktop\NXT\SevaCare-main\proto\aerovolt-ers-v2\server`.*
