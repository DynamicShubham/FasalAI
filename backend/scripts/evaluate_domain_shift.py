import csv
import zipfile
import joblib
import cv2
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support

# Add parent directory to sys.path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv

def evaluate_domain_shift():
    root = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root / "archive.zip"
    new_zip_path = root / "newplantarchive.zip"
    manifest_train = root / "data" / "training_manifest.csv"
    manifest_rw = root / "data" / "real_world_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    model = joblib.load(models_dir / "crop_disease_opencv_model.joblib")
    encoder = joblib.load(models_dir / "label_encoder.joblib")
    
    # 1. Evaluate on Real-World / Independent Held-out Benchmark (TEST C)
    rw_records = []
    with open(manifest_rw, "r", encoding="utf-8") as f:
        rw_records = list(csv.DictReader(f))
        
    print(f"Loaded {len(rw_records)} real-world / held-out test images (TEST C).")
    
    y_true_rw = []
    y_pred_rw = []
    by_disease_rw = defaultdict(lambda: {"total": 0, "correct": 0})
    
    for r in rw_records:
        img_path = root / r["image_path"]
        if not img_path.exists():
            continue
            
        img = cv2.imread(str(img_path))
        if img is None:
            continue
            
        true_cls = r["normalized_class"]
        feats = extract_features_opencv(img).reshape(1, -1)
        probs = model.predict_proba(feats)[0]
        pred_idx = np.argmax(probs)
        pred_cls = encoder.classes_[pred_idx]
        
        y_true_rw.append(true_cls)
        y_pred_rw.append(pred_cls)
        
        by_disease_rw[true_cls]["total"] += 1
        if pred_cls == true_cls:
            by_disease_rw[true_cls]["correct"] += 1

    # 2. Evaluate on Controlled Dataset Test Split (TEST A / B) for the same diseases
    target_classes = set(by_disease_rw.keys())
    test_records = []
    with open(manifest_train, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["split"] == "test" and row["display_name"] in target_classes:
                test_records.append(row)
                
    # Sample up to 30 images per target class
    rng = np.random.default_rng(42)
    by_class = defaultdict(list)
    for r in test_records:
        by_class[r["display_name"]].append(r)
        
    sampled_controlled = []
    for cls in target_classes:
        items = by_class[cls]
        if items:
            sampled_controlled.extend(rng.choice(items, size=min(len(items), 30), replace=False))
            
    print(f"Loaded {len(sampled_controlled)} controlled dataset test images (TEST A/B).")
    
    old_zip = zipfile.ZipFile(old_zip_path, 'r')
    new_zip = zipfile.ZipFile(new_zip_path, 'r')
    
    y_true_ctrl = []
    y_pred_ctrl = []
    by_disease_ctrl = defaultdict(lambda: {"total": 0, "correct": 0})
    
    for item in sampled_controlled:
        zfile = new_zip if item["zip_source"] == "newplantarchive.zip" else old_zip
        try:
            raw_bytes = zfile.read(item["path_in_zip"])
            arr = np.frombuffer(raw_bytes, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue
                
            true_cls = item["display_name"]
            feats = extract_features_opencv(img).reshape(1, -1)
            probs = model.predict_proba(feats)[0]
            pred_idx = np.argmax(probs)
            pred_cls = encoder.classes_[pred_idx]
            
            y_true_ctrl.append(true_cls)
            y_pred_ctrl.append(pred_cls)
            
            by_disease_ctrl[true_cls]["total"] += 1
            if pred_cls == true_cls:
                by_disease_ctrl[true_cls]["correct"] += 1
        except Exception:
            continue
            
    old_zip.close()
    new_zip.close()
    
    # Metrics
    acc_ctrl = accuracy_score(y_true_ctrl, y_pred_ctrl)
    p_ctrl, r_ctrl, f1_ctrl, _ = precision_recall_fscore_support(y_true_ctrl, y_pred_ctrl, average='macro', zero_division=0)
    
    acc_rw = accuracy_score(y_true_rw, y_pred_rw)
    p_rw, r_rw, f1_rw, _ = precision_recall_fscore_support(y_true_rw, y_pred_rw, average='macro', zero_division=0)
    
    print("\n" + "=" * 80)
    print("DOMAIN SHIFT EVALUATION RESULTS (PROVING THE PROBLEM)")
    print("=" * 80)
    print(f"{'Disease Class':<35} | {'Controlled Test Acc':<20} | {'Real-World Acc':<15}")
    print("-" * 80)
    for cls in sorted(target_classes):
        c_tot = by_disease_ctrl[cls]["total"]
        c_cor = by_disease_ctrl[cls]["correct"]
        c_acc_str = f"{c_cor}/{c_tot} ({c_cor/c_tot*100:5.1f}%)" if c_tot else "N/A"
        
        r_tot = by_disease_rw[cls]["total"]
        r_cor = by_disease_rw[cls]["correct"]
        r_acc_str = f"{r_cor}/{r_tot} ({r_cor/r_tot*100:5.1f}%)" if r_tot else "N/A"
        
        print(f"{cls:<35} | {c_acc_str:<20} | {r_acc_str:<15}")
        
    print("=" * 80)
    print("AGGREGATE METRICS SUMMARY:")
    print(f"Controlled Dataset Accuracy: {acc_ctrl*100:.2f}%  |  Macro F1: {f1_ctrl:.4f}  |  Precision: {p_ctrl:.4f}  |  Recall: {r_ctrl:.4f}")
    print(f"Real-World Test Accuracy:    {acc_rw*100:.2f}%  |  Macro F1: {f1_rw:.4f}  |  Precision: {p_rw:.4f}  |  Recall: {r_rw:.4f}")
    print(f"Domain Shift Drop:           -{(acc_ctrl - acc_rw)*100:.2f}% accuracy drop on real-world images!")
    print("=" * 80)

if __name__ == "__main__":
    evaluate_domain_shift()
