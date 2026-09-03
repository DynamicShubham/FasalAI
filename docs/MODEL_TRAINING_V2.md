# Plant Doctor Model Training Documentation (v2)
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Overview & Objectives
The v2 training pipeline expands FasalAI from a 29-class model to a full 38-class canonical agricultural model, ingesting and harmonizing both `archive.zip` and `newplantarchive.zip`.

## 2. Dataset Preprocessing & Augmentation
- **Deduplication**: Filtered exact duplicate files and isolated common GUID stems.
- **Leakage-Safe Partitioning**: Base leaf GUID grouping prevents rotated variants from leaking across train/val/test splits.
- **Training-Only Augmentations**:
  - Random Horizontal Flip (50% probability)
  - Brightness scaling (+/- 12%, 35% probability)
  - Contrast adjustment (0.92 - 1.08x, 25% probability)
- **Validation Data**: Zero augmentation applied.

## 3. Architecture & Hyperparameters
- **Feature Extractor**: 535 OpenCV descriptors (HSV 3D histogram, LAB/RGB statistics, Laplacian variance, Sobel gradients, lesion ratio).
- **Classifier**: `RandomForestClassifier`
- **Trees (`n_estimators`)**: 180
- **Max Depth**: 26
- **Class Weights**: `balanced`
- **Random Seed**: 42 (Deterministic)

## 4. Candidate Validation Metrics
- **Classes**: 38 canonical classes
- **Training Samples**: 5,700
- **Validation Accuracy**: 87.44%
- **Macro F1**: 87.00%
- **Weighted F1**: 87.24%

## 5. Reproducibility
To retrain candidate model:
```bash
python backend/scripts/prepare_disease_dataset.py
python backend/scripts/train_cv_model.py
```
