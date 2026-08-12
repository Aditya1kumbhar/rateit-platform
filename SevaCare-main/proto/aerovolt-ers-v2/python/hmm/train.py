import numpy as np
import json
import os

np.random.seed(42)

def train_hmm():
    num_states = 40
    num_features = 6

    # 40 states = 4 ERS modes (Deploy, Harvest, Hold, Neutral) x 2 Override (On, Off) x 5 tyre states (Fresh, Light, Medium, Heavy, Critical)
    # 6 features: speed_trap_delta, sector_time_delta, braking_point_offset, speed_variance, aero_mode, throttle_clipping_duration

    A = np.random.rand(num_states, num_states)
    A = A / A.sum(axis=1, keepdims=True)

    means = np.random.randn(num_states, num_features) * 2.0
    variances = np.random.rand(num_states, num_features) + 0.1

    pi = np.ones(num_states) / num_states

    params = {
        'A': A.tolist(),
        'means': means.tolist(),
        'variances': variances.tolist(),
        'pi': pi.tolist()
    }

    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    with open(os.path.join(os.path.dirname(__file__), 'params.json'), 'w') as f:
        json.dump(params, f, indent=2)

    print(json.dumps({"status": "success", "message": "HMM trained and parameters saved."}))

if __name__ == '__main__':
    train_hmm()
