# AeroVolt ERS — 2026 Formula 1 Energy Strategy Engine

AeroVolt ERS is a real-time, multi-twin 2026 Formula 1 Energy Strategy Engine built for TrackShift 2026 (Problem Statement 1: 'The Power Play').

## 🛠️ Tech Stack & Architecture

- **Frontend**: React + Vite, Tailwind CSS, Lucide Icons, Recharts (Dark-Mode Pit Wall Dashboard).
- **Backend**: Node.js + Express REST API.
- **Database**: Supabase PostgreSQL (`schema.sql`).
- **AI Strategic Advisor**: Gemini API (`@google/genai`) acting as a real-time Pit Wall Strategy Engineer.

## 🏎️ 2026 F1 Rules & Physics Implemented

1. **50/50 Power Split**: 400 kW ICE + 350 kW MGU-K (Art. 5.4.6).
2. **Usable Battery Buffer**: 4.0 MJ State of Charge (SoC) per-lap delta limit (Art. 5.4.8).
3. **Harvest Baseline**: 8.5 MJ per-lap MGU-K cap (Art. 5.4.10).
4. **Speed Derating Functions (Art. 5.4.7)**:
   - **Standard Mode**: Piecewise linear derating starting at 290 km/h down to 0 kW at 345 km/h.
   - **Override Mode**: Piecewise linear derating starting at 337.5 km/h down to 0 kW at 355 km/h.
5. **HMM Counter-Harvest Trap Detection**: Analyzes throttle fraction and speed deltas under Straight Aero state to detect hidden harvest traps ($L_{\text{harvest}}$ vs $L_{\text{derate}}$).

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- Supabase Account & Database
- Gemini API Key

### 1. Environment Setup
Create a `.env` file in the root `aerovolt-ers/` directory:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

GEMINI_API_KEY=your-gemini-api-key
```

### 2. Database Migration
Run the SQL queries in `schema.sql` inside your Supabase SQL Editor to set up `circuit_twins` and `race_telemetry_logs`.

### 3. Running the Server
```bash
cd server
npm install
npm start
```
The backend server will run on `http://localhost:5000`.

### 4. Running the Client UI
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

## 🎤 Hackathon Presentation Highlights

- **Direct Rulebook Compliance**: Implements official FIA 2026 Power Unit Technical Regulations directly into deterministic software modules.
- **AI-Powered Pit Wall Directives**: Leverages Gemini 2.5/3.0 to deliver context-aware driver tactical audio commands with real-time confidence scoring.
