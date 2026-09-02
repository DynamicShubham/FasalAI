import os
import sys
import zipfile
import io
import time
import json
import joblib
import numpy as np
import cv2
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

def extract_features_opencv(img_bgr, target_size=(128, 128)):
    """
    Extract rich OpenCV Computer Vision features from an image:
    1. HSV color histogram (captures color distribution of leaf & spots)
    2. LAB and RGB color statistics (means, standard deviations)
    3. Gray-level texture & gradients (Laplacian variance, Sobel edges)
    4. Non-green lesion ratio (disease spot quantification)
    """
    if img_bgr is None or img_bgr.size == 0:
        return None
    
    # Resize for uniform feature computation
    img_resized = cv2.resize(img_bgr, target_size)
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img_resized, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    
    features = []
    
    # 1. 3D HSV Color Histogram (8x8x8 = 512 bins, normalized)
    hist_hsv = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
    cv2.normalize(hist_hsv, hist_hsv)
    features.extend(hist_hsv.flatten())
    
    # 2. Color Statistics in BGR, HSV, LAB (3 + 3 + 3 = 9 means, 9 stds)
    for space in [img_resized, hsv, lab]:
        mean, std = cv2.meanStdDev(space)
        features.extend(mean.flatten())
        features.extend(std.flatten())
        
    # 3. Texture & Gradient Features using OpenCV Sobel & Laplacian
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    features.append(laplacian_var)
    
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobelx**2 + sobely**2)
    features.append(np.mean(sobel_mag))
    features.append(np.std(sobel_mag))
    
    # 4. Leaf Pathology Ratio: Non-green pixel ratio
    green_mask = cv2.inRange(hsv, np.array([30, 35, 35]), np.array([85, 255, 255]))
    total_pixels = target_size[0] * target_size[1]
    green_ratio = cv2.countNonZero(green_mask) / total_pixels
    features.append(green_ratio)
    features.append(1.0 - green_ratio)  # lesion / non-green ratio
    
    return np.array(features, dtype=np.float32)

def train_model(archive_path, samples_per_class=300, output_dir=None):
    print("=" * 60)
    print("FasalAI - OpenCV Crop Disease Model Training")
    print("=" * 60)
    
    archive_file = Path(archive_path)
    if not archive_file.exists():
        raise FileNotFoundError(f"Archive not found: {archive_path}")
        
    print(f"Loading dataset from: {archive_file} ({archive_file.stat().st_size / (1024*1024):.1f} MB)")
    
    start_time = time.time()
    
    with zipfile.ZipFile(archive_file, 'r') as z:
        all_names = z.namelist()
        
        # Identify image files and group by class
        class_files = {}
        for name in all_names:
            if not (name.lower().endswith('.jpg') or name.lower().endswith('.jpeg') or name.lower().endswith('.png')):
                continue
            parts = name.split('/')
            
            # Pattern: Plant Village Dataset/{Train|Test|Val|Valid}/{Class_Name}/filename
            if len(parts) >= 3 and parts[1].lower() in ['train', 'test', 'val', 'valid']:
                cls_name = parts[2]
            elif len(parts) >= 4 and parts[2].lower() in ['train', 'test', 'val', 'valid']:
                cls_name = parts[3]
            elif len(parts) >= 2:
                cls_name = parts[1] if parts[0] == 'Plant Village Dataset' else parts[0]
            else:
                continue
                
            if not cls_name or cls_name.lower() in ['train', 'test', 'val', 'valid']:
                continue
                
            if cls_name not in class_files:
                class_files[cls_name] = []
            class_files[cls_name].append(name)
            
        classes = sorted(list(class_files.keys()))
        print(f"Found {len(classes)} classes in dataset: {classes}\n")
        
        X = []
        y = []
        
        print(f"Extracting OpenCV visual features (Sampling up to {samples_per_class} images/class)...")
        for idx, cls_name in enumerate(classes):
            files = class_files[cls_name]
            np.random.seed(42)
            selected = np.random.choice(files, min(len(files), samples_per_class), replace=False)
            
            loaded_count = 0
            for fname in selected:
                try:
                    img_bytes = z.read(fname)
                    img_array = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    if img is None:
                        continue
                    feats = extract_features_opencv(img)
                    if feats is not None:
                        X.append(feats)
                        y.append(cls_name)
                        loaded_count += 1
                except Exception:
                    continue
                    
            print(f"  [{idx+1:2d}/{len(classes)}] {cls_name:<40} : {loaded_count} samples")
            
    X = np.array(X, dtype=np.float32)
    y = np.array(y)
    
    print(f"\nTotal extracted feature matrix shape: {X.shape}")
    print(f"Feature extraction completed in {time.time() - start_time:.1f}s")
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Train / Test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )
    
    print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")
    print("Training RandomForest Classifier with 150 trees...")
    
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=25,
        min_samples_split=3,
        n_jobs=-1,
        random_state=42
    )
    
    train_start = time.time()
    clf.fit(X_train, y_train)
    train_duration = time.time() - train_start
    print(f"Model trained in {train_duration:.2f}s")
    
    # Evaluation
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[OK] Validation Accuracy: {acc * 100:.2f}%\n")
    
    # Save Model Artifacts
    if output_dir is None:
        output_dir = Path(__file__).resolve().parent.parent / "app" / "vision" / "models"
    else:
        output_dir = Path(output_dir)
        
    output_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = output_dir / "crop_disease_opencv_model.joblib"
    encoder_path = output_dir / "label_encoder.joblib"
    metadata_path = output_dir / "model_metadata.json"
    
    joblib.dump(clf, model_path)
    joblib.dump(label_encoder, encoder_path)
    
    metadata = {
        "model_type": "OpenCV_Feature_Extractor + RandomForestClassifier",
        "num_classes": len(classes),
        "classes": list(label_encoder.classes_),
        "num_features": int(X.shape[1]),
        "validation_accuracy": float(acc),
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset": "PlantVillage Crop Disease Dataset",
        "total_samples": int(X.shape[0])
    }
    
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model artifacts saved successfully:")
    print(f"  - {model_path}")
    print(f"  - {encoder_path}")
    print(f"  - {metadata_path}")
    print("=" * 60)
    return acc

if __name__ == "__main__":
    archive = sys.argv[1] if len(sys.argv) > 1 else "d:/Hackathon nexora/archive.zip"
    train_model(archive, samples_per_class=250)
