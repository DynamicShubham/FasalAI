import os
import sys
import zipfile
import cv2
import numpy as np
import joblib
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import CropDiseaseDetector, extract_features_opencv

def debug_image(image_input, ground_truth=None, crop_hint="", from_zip=None):
    detector = CropDiseaseDetector()
    
    # 1. Load image
    if isinstance(image_input, (bytes, bytearray)):
        img_bytes = image_input
        arr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        img_name = "raw_bytes"
    elif from_zip:
        with zipfile.ZipFile(from_zip, 'r') as z:
            img_bytes = z.read(image_input)
            arr = np.frombuffer(img_bytes, np.uint8)
            img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            img_name = image_input.split('/')[-1]
    else:
        img_path = Path(image_input)
        img_name = img_path.name
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        img_bgr = cv2.imread(str(img_path))

    h, w = img_bgr.shape[:2]
    
    # 2. Raw model prediction
    features = extract_features_opencv(img_bgr)
    features_2d = features.reshape(1, -1)
    probabilities = detector.model.predict_proba(features_2d)[0]
    
    top5_indices = np.argsort(probabilities)[::-1][:5]
    top1_idx = top5_indices[0]
    raw_pred_class = detector.encoder.classes_[top1_idx]
    raw_conf = probabilities[top1_idx]
    
    # 3. Full detector pipeline output (Backend API response)
    api_res = detector.detect_from_image_bytes(img_bytes, crop_hint=crop_hint)
    
    # Format top 5
    top5_list = []
    for rank, idx in enumerate(top5_indices, 1):
        cname = detector.encoder.classes_[idx]
        p = probabilities[idx]
        top5_list.append((rank, cname, p))
        
    print("-" * 65)
    print(f"Image:                 {img_name}")
    print(f"Ground Truth:          {ground_truth or 'Unknown'}")
    print(f"Dimensions:            {w}x{h} (Features: {features.shape[0]})")
    print(f"Crop Hint:             '{crop_hint}'")
    print(f"Model Version:         {detector.metadata.get('model_version', 'v2')}")
    print(f"Raw Prediction:        {raw_pred_class} (Index: {top1_idx}, Prob: {raw_conf:.4f})")
    print("Top 5 Predictions:")
    for rank, cname, p in top5_list:
        star = " <-- MATCH" if ground_truth and (cname.lower() in ground_truth.lower() or ground_truth.lower() in cname.lower()) else ""
        print(f"  {rank}. {cname:<38} — {p*100:5.2f}%{star}")
    print(f"API Result Status:     {api_res.get('status')}")
    print(f"API Disease Name:      {api_res.get('diseaseName')}")
    print(f"API Confidence:        {api_res.get('confidencePercentage')} ({api_res.get('confidenceScore')})")
    
    return {
        "image": img_name,
        "ground_truth": ground_truth,
        "raw_pred": raw_pred_class,
        "raw_conf": f"{raw_conf*100:.1f}%",
        "api_status": api_res.get("status"),
        "api_disease": api_res.get("diseaseName"),
        "api_conf": api_res.get("confidencePercentage")
    }

def test_all_samples():
    sample_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "samples"
    samples = [
        ('corn_rust.jpg', 'Corn (Maize)', 'Corn (Maize) - Common Rust'),
        ('tomato_curl.jpg', 'Tomato', 'Tomato - Yellow Leaf Curl Virus'),
        ('grape_rot.jpg', 'Grape', 'Grape - Black Rot'),
        ('bell_pepper_spot', 'Bell Pepper', 'Bell Pepper - Bacterial Spot'),
        ('apple_scab.jpg', 'Apple', 'Apple - Apple Scab'),
        ('potato_blight.jpg', 'Potato', 'Potato - Late Blight'),
    ]
    for fn, ch, gt in samples:
        filename = fn if "." in fn else f"{fn}.jpg"
        p = sample_dir / filename
        if p.exists():
            print(f"\n=== Testing {filename} with crop hint '{ch}' (GT: {gt}) ===")
            debug_image(str(p), ground_truth=gt, crop_hint=ch)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_image(sys.argv[1], crop_hint=sys.argv[2] if len(sys.argv) > 2 else "")
    else:
        test_all_samples()
