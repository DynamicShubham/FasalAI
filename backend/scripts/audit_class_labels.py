import json
from pathlib import Path
import joblib

def audit_labels():
    root = Path(__file__).resolve().parent.parent.parent
    mapping_path = root / "backend" / "app" / "vision" / "models" / "class_mapping.json"
    encoder_path = root / "backend" / "app" / "vision" / "models" / "label_encoder.joblib"
    
    with open(mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
        
    encoder = joblib.load(encoder_path)
    class_to_idx = {name: i for i, name in enumerate(encoder.classes_)}
    
    print("=" * 110)
    print(f"{'Original Dataset Label':<45} | {'Normalized Display Name':<35} | {'Index':<5} | {'ID'}")
    print("=" * 110)
    for m in mapping:
        idx = class_to_idx.get(m["display"], -1)
        print(f"{m['new']:<45} | {m['display']:<35} | {idx:<5} | {m['id']}")
    print("=" * 110)

if __name__ == "__main__":
    audit_labels()
