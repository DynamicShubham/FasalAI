import csv
import time
import zipfile
import cv2
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

def augment_field_realistic(img_bgr, rng):
    img = img_bgr.astype(np.float32)
    # 1. Random Brightness jitter (+-22%)
    b_factor = rng.uniform(0.78, 1.22)
    img = img * b_factor
    # 2. Random Contrast jitter (+-18%)
    mean_val = np.mean(img)
    c_factor = rng.uniform(0.82, 1.18)
    img = (img - mean_val) * c_factor + mean_val
    img = np.clip(img, 0, 255).astype(np.uint8)
    
    # 3. Random horizontal / vertical flip
    if rng.random() > 0.5:
        img = cv2.flip(img, 1)
    if rng.random() > 0.5:
        img = cv2.flip(img, 0)
        
    # 4. Slight blur
    if rng.random() > 0.7:
        img = cv2.GaussianBlur(img, (3, 3), 0)
        
    return img

def extract_segmented_features(img_bgr):
    # Resize to standard canonical resolution
    img = cv2.resize(img_bgr, (256, 256), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    
    # Excess Green & Foliar Segmentation Mask
    b, g, r = cv2.split(img.astype(np.float32))
    exg = 2.0 * g - r - b
    mask = ((exg > -12.0) & (hsv[:, :, 1] > 20) & (hsv[:, :, 2] > 20)).astype(np.uint8) * 255
    if cv2.countNonZero(mask) < (256 * 256 * 0.05):
        mask = None
        
    # 1. 3D HSV Histogram on segmented leaf
    hist = cv2.calcHist([hsv], [0, 1, 2], mask, [8, 8, 8], [0, 180, 0, 256, 0, 256])
    cv2.normalize(hist, hist)
    hist_feats = hist.flatten()
    
    # 2. Color statistics on masked leaf
    if mask is not None:
        mean_bgr, std_bgr = cv2.meanStdDev(img, mask=mask)
        mean_lab, std_lab = cv2.meanStdDev(lab, mask=mask)
    else:
        mean_bgr, std_bgr = cv2.meanStdDev(img)
        mean_lab, std_lab = cv2.meanStdDev(lab)
        
    color_feats = np.hstack([mean_bgr.flatten(), std_bgr.flatten(), mean_lab.flatten(), std_lab.flatten()])
    
    # 3. Texture & Structural Gradients
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap_var = np.array([cv2.Laplacian(gray, cv2.CV_64F).var()], dtype=np.float32)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(sobelx**2 + sobely**2)
    grad_feats = np.array([np.mean(grad_mag), np.std(grad_mag)], dtype=np.float32)
    
    # 4. Foliar Index Ratios
    total_px = 256.0 * 256.0
    plant_px = float(cv2.countNonZero(mask)) if mask is not None else total_px
    plant_ratio = np.array([plant_px / total_px], dtype=np.float32)
    
    # Lesion mask
    mask_lesion = cv2.inRange(hsv, np.array([10, 50, 20]), np.array([30, 255, 200]))
    lesion_ratio = np.array([float(cv2.countNonZero(mask_lesion)) / max(1.0, plant_px)], dtype=np.float32)
    aspect_ratio = np.array([1.0], dtype=np.float32)
    
    return np.hstack([hist_feats, color_feats, lap_var, grad_feats, plant_ratio, lesion_ratio, aspect_ratio]).astype(np.float32)

def train_model_b():
    root = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root / "archive.zip"
    new_zip_path = root / "newplantarchive.zip"
    manifest_path = root / "data" / "balanced_training_manifest.csv"
    models_dir = root / "backend" / "app" / "vision" / "models"
    
    out_model_path = models_dir / "model_b_segmented_rf.joblib"
    out_encoder_path = models_dir / "model_b_label_encoder.joblib"
    
    print("Training Model B: Vegetation-Segmented & Field-Augmented RandomForest...")
    records = []
    with open(manifest_path, "r", encoding="utf-8") as f:
        records = list(csv.DictReader(f))
        
    print(f"Total training/validation records in balanced manifest: {len(records)}")
    
    old_zip = zipfile.ZipFile(old_zip_path, 'r')
    new_zip = zipfile.ZipFile(new_zip_path, 'r')
    rng = np.random.default_rng(42)
    
    X_train, y_train = [], []
    X_val, y_val = [], []
    
    t0 = time.time()
    for row in records:
        zfile = new_zip if row["zip_source"] == "newplantarchive.zip" else old_zip
        try:
            raw_bytes = zfile.read(row["path_in_zip"])
            arr = np.frombuffer(raw_bytes, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue
                
            is_train = (row["split"] == "train")
            if is_train:
                img = augment_field_realistic(img, rng)
                
            feats = extract_segmented_features(img)
            
            if is_train:
                X_train.append(feats)
                y_train.append(row["display_name"])
            else:
                X_val.append(feats)
                y_val.append(row["display_name"])
        except Exception:
            continue
            
    old_zip.close()
    new_zip.close()
    
    print(f"Features extracted in {time.time() - t0:.1f}s")
    print(f"  X_train: {len(X_train)} samples, feature dim: {len(X_train[0])}")
    print(f"  X_val:   {len(X_val)} samples")
    
    encoder = LabelEncoder()
    y_train_enc = encoder.fit_transform(y_train)
    y_val_enc = encoder.transform(y_val)
    
    clf = RandomForestClassifier(
        n_estimators=180,
        max_depth=26,
        min_samples_split=3,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )
    
    t_train = time.time()
    clf.fit(X_train, y_train_enc)
    print(f"Model B trained in {time.time() - t_train:.1f}s")
    
    val_preds = clf.predict(X_val)
    val_acc = accuracy_score(y_val_enc, val_preds)
    print(f"Model B Validation Accuracy: {val_acc * 100:.2f}%")
    
    # Save Model B
    joblib.dump(clf, out_model_path, compress=3)
    joblib.dump(encoder, out_encoder_path)
    print(f"Model B saved to {out_model_path} ({out_model_path.stat().st_size / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    train_model_b()
