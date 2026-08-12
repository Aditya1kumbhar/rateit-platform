import json
import os
import sys
from evaluate import evaluate

def generate_report():
    report_data = evaluate()
    out_dir = os.path.dirname(__file__)
    out_path = os.path.join(out_dir, 'validation_report.json')
    
    with open(out_path, 'w') as f:
        json.dump(report_data, f, indent=2)
        
    print(f"Validation report saved to {out_path}")
    return report_data

if __name__ == '__main__':
    generate_report()
