import json
import os
import numpy as np

np.random.seed(42)

def generate_race():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    seg_path = os.path.join(data_dir, 'baku_segments.json')
    with open(seg_path, 'r') as f:
        segments = json.load(f)

    race_data = []
    for lap in range(1, 52):
        for seg in segments:
            is_trap = lap in [15, 28, 42] and seg['id'] == 'S1'
            obs = {
                "lap": lap,
                "segment_id": seg['id'],
                "features": np.random.randn(6).tolist(),
                "ground_truth_state": np.random.randint(0, 40),
                "is_trap": is_trap
            }
            race_data.append(obs)

    out_dir = os.path.join(data_dir, 'synthetic')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'baku_race_001.json')
    with open(out_path, 'w') as f:
        json.dump(race_data, f)
    
    print(json.dumps({"status": "success", "path": out_path}))

if __name__ == '__main__':
    generate_race()
