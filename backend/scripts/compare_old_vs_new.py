import csv
import time
import zipfile
import joblib
import cv2
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv
from scripts.train_model_b import extract_segmented_features

def run_comparison():
    root = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root / "archive.zip"
    new_zip_path = root / "newplantarchive.zip"
    manifest_train = root / "data" / "training_manifest.csv"
    manifest_rw = root / "data" / "real_world_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    # Load Model A
    model_a_path = models_dir / "crop_disease_opencv_model.joblib"
    encoder_a_path = models_dir / "label_encoder.joblib"
    model_a = joblib.load(model_a_path)
    encoder_a = joblib.load(encoder_a_path)
    
    # Load Model B
    model_b_path = models_dir / "model_b_segmented_rf.joblib"
    encoder_b_path = models_dir / "model_b_label_encoder.joblib"
    model_b = joblib.load(model_b_path)
    encoder_b = joblib.load(encoder_b_path)
    
    # 1. Load Real-World Test C
    rw_records = []
    with open(manifest_rw, "r", encoding="utf-8") as f:
        rw_records = list(csv.DictReader(f))
        
    rw_images = []
    y_true_rw = []
    for r in rw_records:
        p = root / r["image_path"]
        if p.exists():
            img = cv2.imread(str(p))
            if img is not None:
                rw_images.append(img)
                y_true_rw.append(r["normalized_class"])
                
    # 2. Load Controlled Test A/B
    target_classes = set(y_true_rw)
    ctrl_records = []
    with open(manifest_train, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["split"] == "test" and row["display_name"] in target_classes:
                ctrl_records.append(row)
                
    rng = np.random.default_rng(42)
    by_class = defaultdict(list)
    for r in ctrl_records:
        by_class[r["display_name"]].append(r)
        
    sampled_ctrl = []
    for cls in target_classes:
        sampled_ctrl.extend(rng.choice(by_class[cls], size=min(len(by_class[cls]), 30), replace=False))
        
    old_zip = zipfile.ZipFile(old_zip_path, 'r')
    new_zip = zipfile.ZipFile(new_zip_path, 'r')
    ctrl_images = []
    y_true_ctrl = []
    for item in sampled_ctrl:
        zfile = new_zip if item["zip_source"] == "newplantarchive.zip" else old_zip
        try:
            b = zfile.read(item["path_in_zip"])
            arr = np.frombuffer(b, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                ctrl_images.append(img)
                y_true_ctrl.append(item["display_name"])
        except Exception:
            continue
    old_zip.close()
    new_zip.close()
    
    print(f"Loaded {len(ctrl_images)} Controlled Images (Test A/B) and {len(rw_images)} Real-World Images (Test C).")
    
    # Evaluate Model A
    t0 = time.time()
    feats_a_ctrl = [extract_features_opencv(img) for img in ctrl_images]
    preds_a_ctrl = [encoder_a.classes_[np.argmax(p)] for p in model_a.predict_proba(feats_a_ctrl)]
    lat_a = (time.time() - t0) / len(ctrl_images) * 1000
    acc_a_ctrl = accuracy_score(y_true_ctrl, preds_a_ctrl)
    _, _, f1_a_ctrl, _ = precision_recall_fscore_support(y_true_ctrl, preds_a_ctrl, average='macro', zero_division=0)
    
    feats_a_rw = [extract_features_opencv(img) for img in rw_images]
    preds_a_rw = [encoder_a.classes_[np.argmax(p)] for p in model_a.predict_proba(feats_a_rw)]
    acc_a_rw = accuracy_score(y_true_rw, preds_a_rw)
    _, _, f1_a_rw, _ = precision_recall_fscore_support(y_true_rw, preds_a_rw, average='macro', zero_division=0)
    
    # Evaluate Model B
    t0 = time.time()
    feats_b_ctrl = [extract_segmented_features(img) for img in ctrl_images]
    preds_b_ctrl = [encoder_b.classes_[np.argmax(p)] for p in model_b.predict_proba(feats_b_ctrl)]
    lat_b = (time.time() - t0) / len(ctrl_images) * 1000
    acc_b_ctrl = accuracy_score(y_true_ctrl, preds_b_ctrl)
    _, _, f1_b_ctrl, _ = precision_recall_fscore_support(y_true_ctrl, preds_b_ctrl, average='macro', zero_division=0)
    
    feats_b_rw = [extract_segmented_features(img) for img in rw_images]
    preds_b_rw = [encoder_b.classes_[np.argmax(p)] for p in model_b.predict_proba(feats_b_rw)]
    acc_b_rw = accuracy_score(y_true_rw, preds_b_rw)
    _, _, f1_b_rw, _ = precision_recall_fscore_support(y_true_rw, preds_b_rw, average='macro', zero_division=0)
    
    # Print Comparison Table
    print("\n" + "=" * 90)
    print("EMPIRICAL COMPARISON: MODEL A vs MODEL B")
    print("=" * 90)
    print(f"{'Model Candidate':<32} | {'Controlled Acc':<14} | {'Real-World Acc':<14} | {'Macro F1':<10} | {'Size':<9} | {'Latency'}")
    print("-" * 90)
    size_a = f"{model_a_path.stat().st_size / (1024*1024):.1f} MB"
    size_b = f"{model_b_path.stat().st_size / (1024*1024):.1f} MB"
    print(f"{'Model A (Baseline RF)':<32} | {acc_a_ctrl*100:6.2f}%       | {acc_a_rw*100:6.2f}%       | {f1_a_rw:7.4f}   | {size_a:<9} | {lat_a:.1f} ms")
    print(f"{'Model B (Segmented & Aug RF)':<32} | {acc_b_ctrl*100:6.2f}%       | {acc_b_rw*100:6.2f}%       | {f1_b_rw:7.4f}   | {size_b:<9} | {lat_b:.1f} ms")
    print("=" * 90)
    
    # Detailed disease breakdown on Real-World images
    print("\nREAL-WORLD BENCHMARK ACCURACY BREAKDOWN BY DISEASE:")
    print("-" * 75)
    print(f"{'Disease Class':<35} | {'Model A (Baseline)':<18} | {'Model B (Segmented)'}")
    print("-" * 75)
    for cls in sorted(target_classes):
        tot = sum(1 for y in y_true_rw if y == cls)
        cor_a = sum(1 for y, p in zip(y_true_rw, preds_a_rw) if y == cls and p == cls)
        cor_b = sum(1 for y, p in zip(y_true_rw, preds_b_rw) if y == cls and p == cls)
        acc_str_a = f"{cor_a}/{tot} ({cor_a/tot*100:5.1f}%)"
        acc_str_b = f"{cor_b}/{tot} ({cor_b/tot*100:5.1f}%)"
        print(f"{cls:<35} | {acc_str_a:<18} | {acc_str_b}")
    print("=" * 75)

if __name__ == "__main__":
    run_comparison()
