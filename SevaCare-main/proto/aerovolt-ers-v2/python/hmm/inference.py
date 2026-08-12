import numpy as np
import json
import sys
import os

def load_params():
    param_path = os.path.join(os.path.dirname(__file__), 'params.json')
    if not os.path.exists(param_path):
        return None
    with open(param_path, 'r') as f:
        return json.load(f)

def run_inference(observations):
    params = load_params()
    if not params:
        print(json.dumps({"error": "Model params not found"}))
        return

    num_states = 40
    # Mocking belief distribution for demonstration
    belief = np.random.rand(num_states)
    belief = belief / belief.sum()

    deception_risk = bool(np.random.rand() > 0.8)
    confidence = float(np.max(belief))
    
    # Classify into 4 macro categories
    if belief[0] > 0.1:
        engine_label = "High"
    elif belief[1] > 0.1:
        engine_label = "Covert Harvest"
    elif belief[2] > 0.1:
        engine_label = "True Derate"
    else:
        engine_label = "Medium"
        
    output = {
        "belief": belief.tolist(),
        "deception_risk": deception_risk,
        "confidence": confidence,
        "engine_label": engine_label
    }
    print(json.dumps(output))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            arg = json.loads(sys.argv[1])
            run_inference(arg.get("observations", [0]*6))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        run_inference([0]*6)
