import csv
import joblib
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import mobilenet_v3_small
from PIL import Image
from pathlib import Path
from sklearn.metrics import accuracy_score

try:
    from evaluate_camera_screen import extract_leaf_roi_test
except ImportError:
    from scripts.evaluate_camera_screen import extract_leaf_roi_test

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
    crops = [r["crop"] for r in rows]
    
    rois = [extract_leaf_roi_test(img) for img in images]
    tensors = torch.stack([c_transform(Image.fromarray(cv2.cvtColor(r, cv2.COLOR_BGR2RGB))) for r in rois])
    with torch.no_grad():
        probs_all = torch.softmax(model_c(tensors), dim=1).numpy()
        
    preds_unconstrained = [classes[np.argmax(p)] for p in probs_all]
    acc_unconstrained = accuracy_score(y_true, preds_unconstrained)
    
    preds_constrained = []
    for i, p in enumerate(probs_all):
        crop_name = crops[i].lower()
        if "pepper" in crop_name:
            crop_name = "bell pepper"
        matching = [idx for idx, c in enumerate(classes) if crop_name in c.lower()]
        if matching:
            best_crop_idx = max(matching, key=lambda idx: p[idx])
            preds_constrained.append(classes[best_crop_idx])
        else:
            preds_constrained.append(classes[np.argmax(p)])
            
    acc_constrained = accuracy_score(y_true, preds_constrained)
    print("=" * 70)
    print(f"Camera Screen Accuracy (Unconstrained):   {acc_unconstrained*100:5.2f}%")
    print(f"Camera Screen Accuracy (Crop-Constrained): {acc_constrained*100:5.2f}%")
    print("=" * 70)

if __name__ == "__main__":
    main()
