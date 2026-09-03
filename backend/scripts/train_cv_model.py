import os
import sys
import time
import json
import csv
import zipfile
import joblib
import cv2
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vision.detector import extract_features_opencv

def apply_training_augmentation(img_bgr: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Realistic training-only agricultural image augmentation:
    - Random horizontal flip (50% probability)
    - Subtle brightness perturbation (35% probability, +/- 12%)
    - Subtle contrast variation (25% probability, 0.9 - 1.1x)
    """
    img_aug = img_bgr.copy()
    
    # 1. Random horizontal flip
    if rng.random() > 0.50:
        img_aug = cv2.flip(img_aug, 1)
        
    # 2. Subtle brightness scaling
    if rng.random() > 0.65:
        factor = rng.uniform(0.88, 1.12)
        hsv = cv2.cvtColor(img_aug, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * factor, 0, 255)
        img_aug = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        
    # 3. Subtle contrast adjustment
    if rng.random() > 0.75:
        contrast = rng.uniform(0.92, 1.08)
        img_aug = np.clip(128.0 + contrast * (img_aug.astype(np.float32) - 128.0), 0, 255).astype(np.uint8)
        
    return img_aug

def train_candidate_model(
    samples_per_class: int = 150,
    n_estimators: int = 180,
    random_seed: int = 42
):
    print("=" * 70)
    print("FasalAI - Training Combined Candidate Model v2 (38 Classes)")
    print("=" * 70)
    
    root_dir = Path(__file__).resolve().parent.parent.parent
    old_zip_path = root_dir / "archive.zip"
    new_zip_path = root_dir / "newplantarchive.zip"
    manifest_path = root_dir / "data" / "balanced_training_manifest.csv"
    
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}. Run prepare_disease_dataset.py first.")
        
    print(f"Loading dataset from: {manifest_path.name}")
    print(f"Sampling budget: max {samples_per_class} train samples per canonical class")
    
    # Open zip files for streaming feature extraction
    old_zip = zipfile.ZipFile(old_zip_path, 'r')
    new_zip = zipfile.ZipFile(new_zip_path, 'r')
    
    # Read manifest rows
    train_records = defaultdict(list)
    val_records = defaultdict(list)
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cls = row["display_name"]
            split = row["split"]
            if split == "train":
                train_records[cls].append(row)
            elif split == "val":
                val_records[cls].append(row)
                
    classes = sorted(list(train_records.keys()))
    print(f"Total Canonical Classes: {len(classes)}")
    
    rng = np.random.default_rng(random_seed)
    
    X_train_list = []
    y_train_list = []
    X_val_list = []
    y_val_list = []
    
    print("\nExtracting OpenCV 535-visual features...")
    start_feat_time = time.time()
    
    # Process Training Data with Augmentation
    for cls in classes:
        items = train_records[cls]
        # Subsample to samples_per_class for balanced training
        selected = rng.choice(items, size=min(len(items), samples_per_class), replace=False)
        
        for item in selected:
            zfile = new_zip if item["zip_source"] == "newplantarchive.zip" else old_zip
            try:
                data = zfile.read(item["path_in_zip"])
                arr = np.frombuffer(data, np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if img is None:
                    continue
                # Apply training augmentation
                aug_img = apply_training_augmentation(img, rng)
                feats = extract_features_opencv(aug_img)
                if feats is not None:
                    X_train_list.append(feats)
                    y_train_list.append(cls)
            except Exception as e:
                continue

    # Process Validation Data (NO augmentation)
    for cls in classes:
        items = val_records[cls]
        selected_val = rng.choice(items, size=min(len(items), 35), replace=False)
        for item in selected_val:
            zfile = new_zip if item["zip_source"] == "newplantarchive.zip" else old_zip
            try:
                data = zfile.read(item["path_in_zip"])
                arr = np.frombuffer(data, np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if img is None:
                    continue
                feats = extract_features_opencv(img)
                if feats is not None:
                    X_val_list.append(feats)
                    y_val_list.append(cls)
            except Exception as e:
                continue

    old_zip.close()
    new_zip.close()
    
    X_train = np.array(X_train_list, dtype=np.float32)
    X_val = np.array(X_val_list, dtype=np.float32)
    
    encoder = LabelEncoder()
    y_train = encoder.fit_transform(y_train_list)
    y_val = encoder.transform(y_val_list)
    
    feat_duration = time.time() - start_feat_time
    print(f"Features extracted in {feat_duration:.1f}s")
    print(f"  X_train shape: {X_train.shape}")
    print(f"  X_val shape:   {X_val.shape}")
    print(f"  Feature dimensions: {X_train.shape[1]}")
    
    # Train Candidate Model B (RandomForest with balanced weights and 180 trees)
    print(f"\nTraining RandomForestClassifier ({n_estimators} trees, max_depth=26)...")
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=26,
        min_samples_split=3,
        class_weight="balanced",
        n_jobs=-1,
        random_state=random_seed
    )
    
    train_start = time.time()
    clf.fit(X_train, y_train)
    train_duration = time.time() - train_start
    print(f"Candidate Model B trained in {train_duration:.2f}s")
    
    # Validation Evaluation
    y_pred = clf.predict(X_val)
    val_acc = accuracy_score(y_val, y_pred)
    val_macro_f1 = f1_score(y_val, y_pred, average="macro")
    val_weighted_f1 = f1_score(y_val, y_pred, average="weighted")
    
    print("\n" + "=" * 50)
    print(f"Candidate Model B Validation Results (38 Classes):")
    print(f"  Accuracy:    {val_acc * 100:.2f}%")
    print(f"  Macro F1:    {val_macro_f1 * 100:.2f}%")
    print(f"  Weighted F1: {val_weighted_f1 * 100:.2f}%")
    print("=" * 50)
    
    # Export Candidate Model Artifacts (Saved separately to avoid overwriting production prematurely)
    output_dir = root_dir / "backend" / "app" / "vision" / "models"
    candidate_model_path = output_dir / "candidate_combined_v2.joblib"
    candidate_encoder_path = output_dir / "candidate_label_encoder_v2.joblib"
    candidate_meta_path = output_dir / "candidate_model_metadata_v2.json"
    
    joblib.dump(clf, candidate_model_path, compress=3)
    joblib.dump(encoder, candidate_encoder_path)
    
    meta = {
        "model_version": "candidate_combined_v2",
        "model_type": "OpenCV_535_Feature_Extractor + RandomForestClassifier",
        "num_classes": len(encoder.classes_),
        "classes": list(encoder.classes_),
        "num_features": int(X_train.shape[1]),
        "validation_accuracy": float(val_acc),
        "macro_f1": float(val_macro_f1),
        "weighted_f1": float(val_weighted_f1),
        "n_estimators": n_estimators,
        "max_depth": 26,
        "training_samples": int(X_train.shape[0]),
        "validation_samples": int(X_val.shape[0]),
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "datasets": ["archive.zip (previous)", "newplantarchive.zip (new)"]
    }
    
    with open(candidate_meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        
    print(f"\nCandidate artifacts saved:")
    print(f"  Model:   {candidate_model_path} ({candidate_model_path.stat().st_size / (1024*1024):.1f} MB)")
    print(f"  Encoder: {candidate_encoder_path}")
    print(f"  Meta:    {candidate_meta_path}")
    
    # Create docs/MODEL_TRAINING_V2.md
    docs_dir = root_dir / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    training_doc = docs_dir / "MODEL_TRAINING_V2.md"
    
    doc_lines = [
        "# Plant Doctor Model Training Documentation (v2)",
        "### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)",
        "",
        "---",
        "",
        "## 1. Overview & Objectives",
        "The v2 training pipeline expands FasalAI from a 29-class model to a full 38-class canonical agricultural model, ingesting and harmonizing both `archive.zip` and `newplantarchive.zip`.",
        "",
        "## 2. Dataset Preprocessing & Augmentation",
        "- **Deduplication**: Filtered exact duplicate files and isolated common GUID stems.",
        "- **Leakage-Safe Partitioning**: Base leaf GUID grouping prevents rotated variants from leaking across train/val/test splits.",
        "- **Training-Only Augmentations**:",
        "  - Random Horizontal Flip (50% probability)",
        "  - Brightness scaling (+/- 12%, 35% probability)",
        "  - Contrast adjustment (0.92 - 1.08x, 25% probability)",
        "- **Validation Data**: Zero augmentation applied.",
        "",
        "## 3. Architecture & Hyperparameters",
        "- **Feature Extractor**: 535 OpenCV descriptors (HSV 3D histogram, LAB/RGB statistics, Laplacian variance, Sobel gradients, lesion ratio).",
        "- **Classifier**: `RandomForestClassifier`",
        f"- **Trees (`n_estimators`)**: {n_estimators}",
        "- **Max Depth**: 26",
        "- **Class Weights**: `balanced`",
        "- **Random Seed**: 42 (Deterministic)",
        "",
        "## 4. Candidate Validation Metrics",
        f"- **Classes**: {len(encoder.classes_)} canonical classes",
        f"- **Training Samples**: {X_train.shape[0]:,}",
        f"- **Validation Accuracy**: {val_acc * 100:.2f}%",
        f"- **Macro F1**: {val_macro_f1 * 100:.2f}%",
        f"- **Weighted F1**: {val_weighted_f1 * 100:.2f}%",
        "",
        "## 5. Reproducibility",
        "To retrain candidate model:",
        "```bash",
        "python backend/scripts/prepare_disease_dataset.py",
        "python backend/scripts/train_cv_model.py",
        "```"
    ]
    
    with open(training_doc, "w", encoding="utf-8") as f:
        f.write("\n".join(doc_lines) + "\n")
        
    print(f"Training documentation generated at: {training_doc}")
    print("=" * 70)

if __name__ == "__main__":
    train_candidate_model()
