import json
import os
import numpy as np

np.random.seed(42)

def run_scenario():
    scenario_data = []
    laps_trap = [15, 28, 42]
    
    for lap in range(1, 52):
        trap_active = lap in laps_trap
        scenario_data.append({
            "lap": lap,
            "trap_active": trap_active,
            "soc_depletion": float(np.random.rand() * 10)
        })
        
    print(json.dumps({"scenario": "Baku Counter-Harvest Trap", "data": scenario_data}))

if __name__ == '__main__':
    run_scenario()
