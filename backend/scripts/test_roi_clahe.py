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

def extract_leaf_roi_v2(img_bgr):
    if img_bgr is None or img_bgr.size == 0:
        return img_bgr
    h, w = img_bgr.shape[:2]
    
    # 1. Bilateral filter to suppress LCD pixel moire
    filtered = cv2.bilateralFilter(img_bgr, d=5, sigmaColor=30, sigmaSpace=30)
    
    # 2. Convert to LAB and apply CLAHE to L channel to counteract screen glare
    lab = cv2.cvtColor(filtered, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_eq = clahe.apply(l)
    lab_eq = cv2.merge([l_eq, a, b])
    img_eq = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)
    
    # 3. Detect leaf tissue contour
    hsv = cv2.cvtColor(img_eq, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([6, 15, 15]), np.array([100, 255, 255]))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    mask_closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(mask_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)
        if area >= (w * h * 0.05):
            x, y, bw, bh = cv2.boundingRect(c)
            # Square bounding box centered on leaf
            cx, cy = x + bw // 2, y + bh // 2
            half_side = int(max(bw, bh) * 0.60)
            x1 = max(0, cx - half_side)
            y1 = max(0, cy - half_side)
            x2 = min(w, cx + half_side)
            y2 = min(h, cy + half_side)
            return img_eq[y1:y2, x1:x2]
            
    # Center square crop if wide
    if w > h * 1.15:
        crop_w = int(h * 0.90)
        start_x = (w - crop_w) // 2
        return img_eq[:, start_x:start_x + crop_w]
        
    return img_eq

def main():
    root = Path(__file__).resolve().parent.parent.parent
    manifest = root / "data" / "camera_screen_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
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
    
    with open(manifest, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        
    images = [cv2.imread(str(root / r["image_path"])) for r in rows]
    y_true = [r["normalized_class"] for r in rows]
    
    rois = [extract_leaf_roi_v2(img) for img in images]
    tensors = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(r, cv2.COLOR_BGR2RGB))) for r in rois])
    with torch.no_grad():
        preds = [classes[idx] for idx in model_c(tensors).argmax(dim=1).tolist()]
        
    acc = accuracy_score(y_true, preds)
    p, r, f1, _ = precision_recall_fscore_support(y_true, preds, average='macro', zero_division=0)
    print(f"Accuracy with CLAHE + Centered Foliar ROI: {acc*100:.2f}% (Macro F1: {f1:.4f})")

if __name__ == "__main__":
    main()
