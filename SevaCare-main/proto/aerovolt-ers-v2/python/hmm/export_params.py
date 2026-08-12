import json
import os
import shutil

def export_params():
    src = os.path.join(os.path.dirname(__file__), 'params.json')
    dest_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'hmm')
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, 'params.json')
    
    if os.path.exists(src):
        shutil.copy(src, dest)
        print(json.dumps({"status": "success", "destination": dest}))
    else:
        print(json.dumps({"error": "params.json not found in hmm dir"}))

if __name__ == '__main__':
    export_params()
