import csv
import time
import zipfile
import joblib
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import mobilenet_v3_small
from PIL import Image
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv
from scripts.train_model_b import extract_segmented_features

def evaluate_all():
    root = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root / "archive.zip"
    new_zip_path = root / "newplantarchive.zip"
    manifest_train = root / "data" / "training_manifest.csv"
    manifest_rw = root / "data" / "real_world_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    # 1. Load Model A (Baseline RF)
    model_a = joblib.load(models_dir / "crop_disease_opencv_model.joblib")
    encoder_a = joblib.load(models_dir / "label_encoder.joblib")
    
    # 2. Load Model B (Segmented RF)
    model_b = joblib.load(models_dir / "model_b_segmented_rf.joblib")
    encoder_b = joblib.load(models_dir / "model_b_label_encoder.joblib")
    
    # 3. Load Model C (MobileNetV3) if ready
    model_c_path = models_dir / "model_c_mobilenet_v3.pth"
    model_c = None
    if model_c_path.exists():
        classes = list(encoder_a.classes_)
        model_c = mobilenet_v3_small(weights=None)
        model_c.classifier[3] = nn.Linear(model_c.classifier[3].in_features, len(classes))
        model_c.load_state_dict(torch.load(model_c_path, map_location="cpu"))
        model_c.eval()
        
    c_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load Real-World Test C
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
                
    # Load Controlled Test A/B
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
    
    results = []
    
    # Model A
    t0 = time.time()
    feats_a_ctrl = [extract_features_opencv(img) for img in ctrl_images]
    preds_a_ctrl = [encoder_a.classes_[np.argmax(p)] for p in model_a.predict_proba(feats_a_ctrl)]
    lat_a = (time.time() - t0) / len(ctrl_images) * 1000
    acc_a_ctrl = accuracy_score(y_true_ctrl, preds_a_ctrl)
    
    feats_a_rw = [extract_features_opencv(img) for img in rw_images]
    preds_a_rw = [encoder_a.classes_[np.argmax(p)] for p in model_a.predict_proba(feats_a_rw)]
    acc_a_rw = accuracy_score(y_true_rw, preds_a_rw)
    _, _, f1_a_rw, _ = precision_recall_fscore_support(y_true_rw, preds_a_rw, average='macro', zero_division=0)
    size_a = (models_dir / "crop_disease_opencv_model.joblib").stat().st_size / (1024*1024)
    results.append(("Model A (Baseline RF)", acc_a_ctrl, acc_a_rw, f1_a_rw, size_a, lat_a, preds_a_rw))
    
    # Model B
    t0 = time.time()
    feats_b_ctrl = [extract_segmented_features(img) for img in ctrl_images]
    preds_b_ctrl = [encoder_b.classes_[np.argmax(p)] for p in model_b.predict_proba(feats_b_ctrl)]
    lat_b = (time.time() - t0) / len(ctrl_images) * 1000
    acc_b_ctrl = accuracy_score(y_true_ctrl, preds_b_ctrl)
    
    feats_b_rw = [extract_segmented_features(img) for img in rw_images]
    preds_b_rw = [encoder_b.classes_[np.argmax(p)] for p in model_b.predict_proba(feats_b_rw)]
    acc_b_rw = accuracy_score(y_true_rw, preds_b_rw)
    _, _, f1_b_rw, _ = precision_recall_fscore_support(y_true_rw, preds_b_rw, average='macro', zero_division=0)
    size_b = (models_dir / "model_b_segmented_rf.joblib").stat().st_size / (1024*1024)
    results.append(("Model B (Segmented & Aug RF)", acc_b_ctrl, acc_b_rw, f1_b_rw, size_b, lat_b, preds_b_rw))
    
    # Model C (if available)
    if model_c is not None:
        classes = list(encoder_a.classes_)
        t0 = time.time()
        tensors_ctrl = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))) for img in ctrl_images])
        with torch.no_grad():
            preds_c_ctrl = [classes[idx] for idx in model_c(tensors_ctrl).argmax(dim=1).tolist()]
        lat_c = (time.time() - t0) / len(ctrl_images) * 1000
        acc_c_ctrl = accuracy_score(y_true_ctrl, preds_c_ctrl)
        
        tensors_rw = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))) for img in rw_images])
        with torch.no_grad():
            preds_c_rw = [classes[idx] for idx in model_c(tensors_rw).argmax(dim=1).tolist()]
        acc_c_rw = accuracy_score(y_true_rw, preds_c_rw)
        _, _, f1_c_rw, _ = precision_recall_fscore_support(y_true_rw, preds_c_rw, average='macro', zero_division=0)
        size_c = model_c_path.stat().st_size / (1024*1024)
        results.append(("Model C (MobileNetV3-Small)", acc_c_ctrl, acc_c_rw, f1_c_rw, size_c, lat_c, preds_c_rw))

    print("\n" + "=" * 92)
    print("FINAL 3-MODEL COMPARATIVE EVALUATION BENCHMARK:")
    print("=" * 92)
    print(f"{'Model Architecture':<30} | {'Controlled Acc':<14} | {'Real-World Acc':<14} | {'Macro F1':<10} | {'Size':<9} | {'Latency'}")
    print("-" * 92)
    for name, c_acc, r_acc, f1, sz, lat, _ in results:
        print(f"{name:<30} | {c_acc*100:6.2f}%       | {r_acc*100:6.2f}%       | {f1:7.4f}   | {sz:5.1f} MB  | {lat:.1f} ms")
    print("=" * 92)

if __name__ == "__main__":
    evaluate_all()
