"""
AeroVolt ERS - 2026 F1 Overtake-Opportunity Extraction Script
=============================================================
Uses fastf1 to pull lap data for the 2026 season (rounds 1-11).
For every instance where a car is within 1.0 s of the car ahead
at a sector boundary, it extracts:

  - gap at detection point (s)
  - speed-trap delta (km/h)
  - tyre age and compound for both cars
  - Override Mode availability (2026 regulation)
  - track energy classification

Each row is labelled with whether the trailing car completed a
pass by the next timing sector.  Output is saved to CSV.

Requirements:  pip install fastf1 pandas numpy
"""

from __future__ import annotations

import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

try:
    import fastf1
except ImportError:
    sys.exit(
        "fastf1 is not installed.  Run:\n"
        "  pip install fastf1\n"
        "then re-run this script."
    )

warnings.filterwarnings("ignore")

# ----------------------------------------------------------------
#  Configuration
# ----------------------------------------------------------------
YEAR           = 2026
ROUNDS         = range(1, 12)
GAP_THRESHOLD  = 1.0        # seconds
CACHE_DIR      = Path(__file__).resolve().parent / "fastf1_cache"
OUTPUT_CSV     = Path(__file__).resolve().parent / "overtake_opportunities_2026.csv"

# ----------------------------------------------------------------
#  Track energy classification (2026 FIA Art 5.4 context)
# ----------------------------------------------------------------
_HARVEST_RICH  = {"shanghai", "bahrain", "suzuka", "barcelona", "melbourne",
                  "imola", "lusail", "hungaroring", "zandvoort", "albert park"}
_HARVEST_POOR  = {"monaco", "monza", "jeddah", "spielberg", "las vegas",
                  "interlagos"}
_ASYMMETRIC    = {"baku", "miami", "montreal", "singapore", "marina bay"}


def classify_track_energy(circuit_key: str) -> str:
    ck = circuit_key.lower()
    for name in _HARVEST_RICH:
        if name in ck:
            return "harvest_rich"
    for name in _HARVEST_POOR:
        if name in ck:
            return "harvest_poor"
    for name in _ASYMMETRIC:
        if name in ck:
            return "asymmetric"
    return "standard"


def override_available(gap_s: float, own_soc_pct: float = 50.0) -> bool:
    """2026 Override Mode: within 1.0 s + SOC > 30 %."""
    return gap_s <= 1.0 and own_soc_pct > 30.0


# ----------------------------------------------------------------
#  Sector-gap computation using SectorNSessionTime columns
# ----------------------------------------------------------------

def build_sector_records(laps: pd.DataFrame) -> pd.DataFrame:
    """
    For every lap, use Sector1SessionTime / Sector2SessionTime /
    Sector3SessionTime (the session-elapsed time when each car
    crosses each sector boundary).

    For consecutive cars sorted by crossing time at each sector,
    compute the gap.  Keep only gaps <= GAP_THRESHOLD.
    """
    # The session-time columns are Timedelta objects
    sector_cols = {
        "S1": "Sector1SessionTime",
        "S2": "Sector2SessionTime",
        "S3": "Sector3SessionTime",
    }

    records: list[dict] = []

    for lap_num in laps["LapNumber"].dropna().unique():
        lap_grp = laps[laps["LapNumber"] == lap_num]
        if len(lap_grp) < 2:
            continue

        for sec_label, col in sector_cols.items():
            ordered = lap_grp.dropna(subset=[col]).sort_values(col)
            if len(ordered) < 2:
                continue

            # numpy arrays for speed
            times     = ordered[col].values                  # timedelta64
            drivers   = ordered["Driver"].values
            teams     = ordered["Team"].values
            compounds = ordered["Compound"].values
            tyre_life = ordered["TyreLife"].values
            positions = ordered["Position"].values

            # Speed columns
            speed_st = ordered["SpeedST"].values if "SpeedST" in ordered.columns else np.full(len(ordered), np.nan)

            for i in range(1, len(ordered)):
                gap_ns = times[i] - times[i - 1]
                gap_s  = gap_ns / np.timedelta64(1, "s")

                if gap_s > GAP_THRESHOLD or gap_s < 0:
                    continue

                def _safe_float(v):
                    try:
                        f = float(v)
                        return f if not np.isnan(f) else None
                    except (TypeError, ValueError):
                        return None

                def _safe_int(v):
                    try:
                        f = float(v)
                        return int(f) if not np.isnan(f) else None
                    except (TypeError, ValueError):
                        return None

                records.append({
                    "lap_number":         int(lap_num),
                    "sector":             sec_label,
                    "driver_behind":      str(drivers[i]),
                    "team_behind":        str(teams[i]),
                    "driver_ahead":       str(drivers[i - 1]),
                    "team_ahead":         str(teams[i - 1]),
                    "gap_at_detection_s": round(float(gap_s), 4),
                    "speed_trap_behind":  _safe_float(speed_st[i]),
                    "speed_trap_ahead":   _safe_float(speed_st[i - 1]),
                    "tyre_age_behind":    _safe_int(tyre_life[i]),
                    "compound_behind":    str(compounds[i]) if pd.notna(compounds[i]) else None,
                    "tyre_age_ahead":     _safe_int(tyre_life[i - 1]),
                    "compound_ahead":     str(compounds[i - 1]) if pd.notna(compounds[i - 1]) else None,
                    "pos_behind":         _safe_int(positions[i]),
                    "pos_ahead":          _safe_int(positions[i - 1]),
                })

    return pd.DataFrame(records)


# ----------------------------------------------------------------
#  Pass-detection labelling
# ----------------------------------------------------------------

def label_passes(df: pd.DataFrame, laps: pd.DataFrame) -> pd.DataFrame:
    """
    Check if the trailing car is *ahead* of the leading car at the
    next sector boundary (or next lap's S1 if current sector is S3).
    """
    if df.empty:
        df["pass_completed"] = pd.Series(dtype=bool)
        return df

    sector_cols = {
        "S1": "Sector1SessionTime",
        "S2": "Sector2SessionTime",
        "S3": "Sector3SessionTime",
    }

    # Build ordering lookup: (lap, sector) -> [driver_in_crossing_order]
    order_map: dict[tuple[int, str], list[str]] = {}
    for lap_num in laps["LapNumber"].dropna().unique():
        grp = laps[laps["LapNumber"] == lap_num]
        for sec, col in sector_cols.items():
            ordered = grp.dropna(subset=[col]).sort_values(col)
            order_map[(int(lap_num), sec)] = list(ordered["Driver"].values)

    results = []
    for _, row in df.iterrows():
        cur_sec = row["sector"]
        cur_lap = row["lap_number"]
        d_behind = row["driver_behind"]
        d_ahead  = row["driver_ahead"]

        # Next sector
        if cur_sec == "S3":
            next_lap, next_sec = cur_lap + 1, "S1"
        else:
            next_sec = {"S1": "S2", "S2": "S3"}[cur_sec]
            next_lap = cur_lap

        next_order = order_map.get((next_lap, next_sec), [])

        if d_behind in next_order and d_ahead in next_order:
            passed = next_order.index(d_behind) < next_order.index(d_ahead)
        else:
            passed = False

        results.append(passed)

    df["pass_completed"] = results
    return df


# ----------------------------------------------------------------
#  Main processing
# ----------------------------------------------------------------

def process_round(year: int, rnd: int) -> pd.DataFrame:
    print(f"\n{'='*60}")
    print(f"  Round {rnd} / {year}")
    print(f"{'='*60}")

    try:
        session = fastf1.get_session(year, rnd, "R")
        session.load(telemetry=False, weather=False, messages=False)
    except Exception as exc:
        print(f"  [WARN] Could not load round {rnd}: {exc}")
        return pd.DataFrame()

    event_name  = getattr(session.event, "EventName",  f"Round {rnd}")
    circuit_key = getattr(session.event, "Location",   event_name)
    print(f"  Event  : {event_name}")
    print(f"  Circuit: {circuit_key}")

    laps = session.laps
    if laps.empty:
        print("  [WARN] No lap data available.")
        return pd.DataFrame()

    # 1. Compute sector gaps
    df = build_sector_records(laps)
    if df.empty:
        print("  [WARN] No close-gap events found.")
        return pd.DataFrame()

    # 2. Speed-trap delta
    df["speed_trap_delta"] = None
    mask = df["speed_trap_behind"].notna() & df["speed_trap_ahead"].notna()
    df.loc[mask, "speed_trap_delta"] = (
        df.loc[mask, "speed_trap_behind"].astype(float) -
        df.loc[mask, "speed_trap_ahead"].astype(float)
    )

    # 3. Override Mode availability
    df["override_available"] = df["gap_at_detection_s"].apply(override_available)

    # 4. Track energy classification
    df["track_energy_class"] = classify_track_energy(circuit_key)

    # 5. Label passes
    df = label_passes(df, laps)

    # 6. Metadata columns
    df.insert(0, "round", rnd)
    df.insert(1, "circuit", circuit_key)
    df.insert(2, "event", event_name)

    n_total = len(df)
    n_pass  = int(df["pass_completed"].sum())
    print(f"  Close-gap events : {n_total}")
    print(f"  Passes completed : {n_pass}  ({100*n_pass/max(n_total,1):.1f} %)")

    return df


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))
    print(f"fastf1 cache: {CACHE_DIR}")

    frames: list[pd.DataFrame] = []
    for rnd in ROUNDS:
        try:
            df = process_round(YEAR, rnd)
            if not df.empty:
                frames.append(df)
        except Exception as exc:
            print(f"  [ERROR] Round {rnd} failed: {exc}")

    if not frames:
        print("\n[WARN] No data extracted for any round. Exiting.")
        sys.exit(1)

    result = pd.concat(frames, ignore_index=True)

    # Final column order
    col_order = [
        "round", "circuit", "event", "lap_number", "sector",
        "driver_behind", "team_behind", "driver_ahead", "team_ahead",
        "gap_at_detection_s", "speed_trap_behind", "speed_trap_ahead",
        "speed_trap_delta",
        "tyre_age_behind", "compound_behind",
        "tyre_age_ahead", "compound_ahead",
        "override_available", "track_energy_class",
        "pass_completed",
    ]
    for c in col_order:
        if c not in result.columns:
            result[c] = None
    result = result[col_order]

    result.to_csv(str(OUTPUT_CSV), index=False)
    print(f"\n{'='*60}")
    print(f"  Saved {len(result)} rows -> {OUTPUT_CSV.name}")
    print(f"{'='*60}")

    # Quick summary
    print("\n--- Summary by round ---")
    summary = (
        result.groupby(["round", "circuit"])
        .agg(
            events=("pass_completed", "count"),
            passes=("pass_completed", "sum"),
            avg_gap=("gap_at_detection_s", "mean"),
        )
        .reset_index()
    )
    summary["pass_rate_%"] = (100 * summary["passes"] / summary["events"]).round(1)
    print(summary.to_string(index=False))

    print("\n--- Summary by track energy class ---")
    energy_summary = (
        result.groupby("track_energy_class")
        .agg(
            events=("pass_completed", "count"),
            passes=("pass_completed", "sum"),
            avg_gap=("gap_at_detection_s", "mean"),
            override_pct=("override_available", "mean"),
        )
        .reset_index()
    )
    energy_summary["pass_rate_%"] = (100 * energy_summary["passes"] / energy_summary["events"]).round(1)
    energy_summary["override_pct"] = (100 * energy_summary["override_pct"]).round(1)
    print(energy_summary.to_string(index=False))


if __name__ == "__main__":
    main()
