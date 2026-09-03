import csv
import json
import zipfile
import joblib
import cv2
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Add parent directory to sys.path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv

def analyze_confusion():
    root_dir = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root_dir / "archive.zip"
    new_zip_path = root_dir / "newplantarchive.zip"
    manifest_path = root_dir / "data" / "training_manifest.csv"
    models_dir = root_dir / "backend" / "app" / "vision" / "models"
    
    model = joblib.load(models_dir / "crop_disease_opencv_model.joblib")
    encoder = joblib.load(models_dir / "label_encoder.joblib")
    
    # Read test split records
    test_records = []
    with open(manifest_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["split"] == "test":
                test_records.append(row)
                
    print(f"Total held-out test records: {len(test_records)}")
    
    # Sample 25 images per class for detailed confusion analysis (950 total images)
    rng = np.random.default_rng(42)
    by_class = defaultdict(list)
    for r in test_records:
        by_class[r["display_name"]].append(r)
        
    sampled_test = []
    for cls, items in by_class.items():
        chosen = rng.choice(items, size=min(len(items), 25), replace=False)
        sampled_test.extend(chosen)
        
    print(f"Evaluating {len(sampled_test)} test images across {len(by_class)} classes...")
    
    old_zip = zipfile.ZipFile(old_zip_path, 'r')
    new_zip = zipfile.ZipFile(new_zip_path, 'r')
    
    y_true = []
    y_pred_unconstrained = []
    y_pred_with_crop = []
    
    confused_pairs = defaultdict(int)
    
    for item in sampled_test:
        zfile = new_zip if item["zip_source"] == "newplantarchive.zip" else old_zip
        try:
            raw_bytes = zfile.read(item["path_in_zip"])
            arr = np.frombuffer(raw_bytes, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue
                
            true_cls = item["display_name"]
            crop_name = item["crop"]
            y_true.append(true_cls)
            
            feats = extract_features_opencv(img).reshape(1, -1)
            probs = model.predict_proba(feats)[0]
            
            # 1. Unconstrained Top-1
            pred_idx = np.argmax(probs)
            pred_cls = encoder.classes_[pred_idx]
            y_pred_unconstrained.append(pred_cls)
            
            if pred_cls != true_cls:
                confused_pairs[(true_cls, pred_cls)] += 1
                
            # 2. Crop-constrained Top-1 (simulate farmer providing their crop)
            matching_indices = [i for i, c in enumerate(encoder.classes_) if crop_name.lower() in c.lower()]
            if matching_indices:
                crop_idx = max(matching_indices, key=lambda i: probs[i])
                y_pred_with_crop.append(encoder.classes_[crop_idx])
            else:
                y_pred_with_crop.append(pred_cls)
                
        except Exception as e:
            continue
            
    old_zip.close()
    new_zip.close()
    
    acc_unconstrained = accuracy_score(y_true, y_pred_unconstrained)
    acc_crop = accuracy_score(y_true, y_pred_with_crop)
    
    print("\n" + "=" * 70)
    print("CONFUSION MATRIX & ACCURACY ANALYSIS:")
    print("=" * 70)
    print(f"Unconstrained Auto-Detect Accuracy: {acc_unconstrained * 100:.2f}%")
    print(f"Crop-Constrained Accuracy (Farmer Crop Known): {acc_crop * 100:.2f}%")
    print("\nTop 15 Most Common Misclassifications (Ground Truth -> Predicted):")
    print("-" * 70)
    for (actual, pred), count in sorted(confused_pairs.items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"  {actual:<35} -> {pred:<35} : {count} times")
    print("=" * 70)

if __name__ == "__main__":
    analyze_confusion()
