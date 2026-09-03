import csv
import time
import joblib
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import mobilenet_v3_small
from PIL import Image
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv

def extract_leaf_roi_test(img_bgr):
    if img_bgr is None or img_bgr.size == 0:
        return img_bgr
    h, w = img_bgr.shape[:2]
    aspect = max(w / max(1, h), h / max(1, w))
    filtered = cv2.bilateralFilter(img_bgr, d=5, sigmaColor=35, sigmaSpace=35)
    
    hsv = cv2.cvtColor(filtered, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([8, 18, 18]), np.array([95, 255, 255]))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask_closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(mask_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)
        if (w * h * 0.08) <= area <= (w * h * 0.88):
            x, y, bw, bh = cv2.boundingRect(c)
            pad_x = int(bw * 0.12)
            pad_y = int(bh * 0.12)
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(w, x + bw + pad_x)
            y2 = min(h, y + bh + pad_y)
            return filtered[y1:y2, x1:x2]
            
    if aspect > 1.25:
        if w > h:
            crop_size = int(h * 0.96)
            start_x = (w - crop_size) // 2
            return filtered[:, start_x:start_x + crop_size]
        else:
            crop_size = int(w * 0.96)
            start_y = (h - crop_size) // 2
            return filtered[start_y:start_y + crop_size, :]
            
    return filtered

def run_camera_screen_benchmark():
    root = Path(__file__).resolve().parent.parent.parent
    manifest = root / "data" / "camera_screen_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    # Load models
    model_a = joblib.load(models_dir / "crop_disease_opencv_model.joblib")
    encoder = joblib.load(models_dir / "label_encoder.joblib")
    classes = list(encoder.classes_)
    
    model_c = mobilenet_v3_small(weights=None)
    model_c.classifier[3] = nn.Linear(model_c.classifier[3].in_features, len(classes))
    model_c.load_state_dict(torch.load(models_dir / "model_c_mobilenet_v3.pth", map_location="cpu"))
    model_c.eval()
    
    c_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    records = []
    with open(manifest, "r", encoding="utf-8") as f:
        records = list(csv.DictReader(f))
        
    images = []
    y_true = []
    for r in records:
        p = root / r["image_path"]
        if p.exists():
            img = cv2.imread(str(p))
            if img is not None:
                images.append(img)
                y_true.append(r["normalized_class"])
                
    print(f"Loaded {len(images)} camera-photographed screen benchmark images.")
    
    # 1. Model A (OpenCV RF on uncropped camera image)
    feats_a = [extract_features_opencv(img) for img in images]
    preds_a = [encoder.classes_[np.argmax(p)] for p in model_a.predict_proba(feats_a)]
    acc_a = accuracy_score(y_true, preds_a)
    
    # 2. Model C without Leaf ROI
    tensors_raw = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))) for img in images])
    with torch.no_grad():
        preds_c_raw = [classes[idx] for idx in model_c(tensors_raw).argmax(dim=1).tolist()]
    acc_c_raw = accuracy_score(y_true, preds_c_raw)
    
    # 3. Model C WITH Leaf ROI & Bilateral Filter
    rois = [extract_leaf_roi_test(img) for img in images]
    tensors_roi = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB))) for roi in rois])
    with torch.no_grad():
        preds_c_roi = [classes[idx] for idx in model_c(tensors_roi).argmax(dim=1).tolist()]
    acc_c_roi = accuracy_score(y_true, preds_c_roi)
    _, _, f1_c_roi, _ = precision_recall_fscore_support(y_true, preds_c_roi, average='macro', zero_division=0)
    
    print("\n" + "=" * 80)
    print("CAMERA-PHOTOGRAPHED SCREEN BENCHMARK RESULTS (PHASE 18)")
    print("=" * 80)
    print(f"{'Pipeline Configuration':<45} | {'Camera Screen Accuracy':<22}")
    print("-" * 80)
    print(f"{'Model A: Baseline OpenCV RandomForest':<45} | {acc_a*100:6.2f}% (Collapsed)")
    print(f"{'Model C: MobileNetV3 (Raw Camera Frame)':<45} | {acc_c_raw*100:6.2f}%")
    print(f"{'Model C: MobileNetV3 + Foliar ROI & Moiré Filter':<45} | {acc_c_roi*100:6.2f}% (Macro F1: {f1_c_roi:.4f})")
    print("=" * 80)

if __name__ == "__main__":
    run_camera_screen_benchmark()
