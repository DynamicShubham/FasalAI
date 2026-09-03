# FasalAI — Multi-Dataset Plant Disease Inventory & Audit
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Executive Summary

This document records the comprehensive inventory and cross-dataset audit between:
1. **Previous Dataset (`archive.zip`)**: 29 classes, 67,118 images (1,029.4 MB).
2. **New Dataset (`newplantarchive.zip`)**: 38 classes, 175,767 images (2,763.5 MB).

### Key Audit Findings
- **Class Expansion**: The new dataset introduces **9 critical additional classes** previously missing in production (Citrus Greening, Soybean, Squash Powdery Mildew, 4 additional Tomato diseases, Blueberry, and Raspberry).
- **Duplicate Overlap**: **67,104 filenames (99.98% of the old dataset)** overlap directly with the new dataset.
- **Data Leakage Risk**: The dataset contains multiple rotational augmentations of the same physical leaf (e.g. `_90deg.JPG`, `_270deg.JPG`, `_new30degFlipLR.JPG`) sharing identical base leaf GUID prefixes. Naive random train/test splitting causes severe data leakage. A group-stratified split by base leaf GUID prefix is mandatory to ensure authentic generalization.

---

## 2. Canonical 38-Class Mapping Matrix

| Canonical ID | Crop | Disease / Health | Display Name | Status | Old Dataset Label (`archive.zip`) | New Dataset Label (`newplantarchive.zip`) | Old Images | New Images |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `apple_scab` | Apple | Apple Scab (Diseased) | **Apple - Apple Scab** | ALIGNED | `Apple - Apple Scab` | `Apple___Apple_scab` | 2,520 | 5,040 |
| `apple_black_rot` | Apple | Black Rot (Diseased) | **Apple - Black Rot** | ALIGNED | `Apple - Black Rot` | `Apple___Black_rot` | 2,484 | 4,968 |
| `apple_cedar_rust` | Apple | Cedar Apple Rust (Diseased) | **Apple - Cedar Apple Rust** | ALIGNED | `Apple - Cedar Apple Rust` | `Apple___Cedar_apple_rust` | 2,200 | 4,400 |
| `apple_healthy` | Apple | Healthy (Healthy) | **Apple - Healthy** | ALIGNED | `Apple - Healthy` | `Apple___healthy` | 2,510 | 5,020 |
| `blueberry_healthy` | Blueberry | Healthy (Healthy) | **Blueberry - Healthy** | EXPANDED (NEW) | `*(Not Present)*` | `Blueberry___healthy` | 0 | 4,540 |
| `cherry_powdery_mildew` | Cherry | Powdery Mildew (Diseased) | **Cherry - Powdery Mildew** | ALIGNED | `Cherry - Powdery Mildew` | `Cherry_(including_sour)___Powdery_mildew` | 2,104 | 4,208 |
| `cherry_healthy` | Cherry | Healthy (Healthy) | **Cherry - Healthy** | ALIGNED | `Cherry - Healthy` | `Cherry_(including_sour)___healthy` | 2,282 | 4,564 |
| `corn_cercospora` | Corn (Maize) | Cercospora Leaf Spot (Gray Leaf Spot) (Diseased) | **Corn (Maize) - Cercospora Leaf Spot** | ALIGNED | `Corn (Maize) - Cercospora Leaf Spot` | `Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot` | 2,056 | 4,104 |
| `corn_common_rust` | Corn (Maize) | Common Rust (Diseased) | **Corn (Maize) - Common Rust** | ALIGNED | `Corn (Maize) - Common Rust` | `Corn_(maize)___Common_rust_` | 2,384 | 4,768 |
| `corn_northern_blight` | Corn (Maize) | Northern Leaf Blight (Diseased) | **Corn (Maize) - Northern Leaf Blight** | ALIGNED | `Corn (Maize) - Northern Leaf Blight` | `Corn_(maize)___Northern_Leaf_Blight` | 2,385 | 4,770 |
| `corn_healthy` | Corn (Maize) | Healthy (Healthy) | **Corn (Maize) - Healthy** | ALIGNED | `Corn (Maize) - Healthy` | `Corn_(maize)___healthy` | 2,324 | 4,648 |
| `grape_black_rot` | Grape | Black Rot (Diseased) | **Grape - Black Rot** | ALIGNED | `Grape - Black Rot` | `Grape___Black_rot` | 2,360 | 4,720 |
| `grape_esca` | Grape | Esca (Black Measles) (Diseased) | **Grape - Esca (Black Measles)** | ALIGNED | `Grape - Esca (Black Measles)` | `Grape___Esca_(Black_Measles)` | 2,400 | 4,800 |
| `grape_leaf_blight` | Grape | Leaf Blight (Isariopsis) (Diseased) | **Grape - Leaf Blight** | ALIGNED | `Grape - Leaf Blight` | `Grape___Leaf_blight_(Isariopsis_Leaf_Spot)` | 2,152 | 4,304 |
| `grape_healthy` | Grape | Healthy (Healthy) | **Grape - Healthy** | ALIGNED | `Grape - Healthy` | `Grape___healthy` | 2,115 | 4,230 |
| `orange_citrus_greening` | Orange | Huanglongbing (Citrus Greening) (Diseased) | **Orange - Citrus Greening** | EXPANDED (NEW) | `*(Not Present)*` | `Orange___Haunglongbing_(Citrus_greening)` | 0 | 5,026 |
| `peach_bacterial_spot` | Peach | Bacterial Spot (Diseased) | **Peach - Bacterial Spot** | ALIGNED | `Peach - Bacterial Spot` | `Peach___Bacterial_spot` | 2,297 | 4,594 |
| `peach_healthy` | Peach | Healthy (Healthy) | **Peach - Healthy** | ALIGNED | `Peach - Healthy` | `Peach___healthy` | 2,160 | 4,320 |
| `bell_pepper_bacterial_spot` | Bell Pepper | Bacterial Spot (Diseased) | **Bell Pepper - Bacterial Spot** | ALIGNED | `Bell Pepper - Bacterial Spot` | `Pepper,_bell___Bacterial_spot` | 2,391 | 4,782 |
| `bell_pepper_healthy` | Bell Pepper | Healthy (Healthy) | **Bell Pepper - Healthy** | ALIGNED | `Bell Pepper - Healthy` | `Pepper,_bell___healthy` | 2,485 | 4,970 |
| `potato_early_blight` | Potato | Early Blight (Diseased) | **Potato - Early Blight** | ALIGNED | `Potato - Early Blight` | `Potato___Early_blight` | 2,424 | 4,848 |
| `potato_late_blight` | Potato | Late Blight (Diseased) | **Potato - Late Blight** | ALIGNED | `Potato - Late Blight` | `Potato___Late_blight` | 2,424 | 4,848 |
| `potato_healthy` | Potato | Healthy (Healthy) | **Potato - Healthy** | ALIGNED | `Potato - Healthy` | `Potato___healthy` | 2,280 | 4,560 |
| `raspberry_healthy` | Raspberry | Healthy (Healthy) | **Raspberry - Healthy** | EXPANDED (NEW) | `*(Not Present)*` | `Raspberry___healthy` | 0 | 4,452 |
| `soybean_healthy` | Soybean | Healthy (Healthy) | **Soybean - Healthy** | EXPANDED (NEW) | `*(Not Present)*` | `Soybean___healthy` | 0 | 5,054 |
| `squash_powdery_mildew` | Squash | Powdery Mildew (Diseased) | **Squash - Powdery Mildew** | EXPANDED (NEW) | `*(Not Present)*` | `Squash___Powdery_mildew` | 0 | 4,340 |
| `strawberry_leaf_scorch` | Strawberry | Leaf Scorch (Diseased) | **Strawberry - Leaf Scorch** | ALIGNED | `Strawberry - Leaf Scorch` | `Strawberry___Leaf_scorch` | 2,218 | 4,436 |
| `strawberry_healthy` | Strawberry | Healthy (Healthy) | **Strawberry - Healthy** | ALIGNED | `Strawberry - Healthy` | `Strawberry___healthy` | 2,280 | 4,560 |
| `tomato_bacterial_spot` | Tomato | Bacterial Spot (Diseased) | **Tomato - Bacterial Spot** | ALIGNED | `Tomato - Bacterial Spot` | `Tomato___Bacterial_spot` | 2,127 | 4,254 |
| `tomato_early_blight` | Tomato | Early Blight (Diseased) | **Tomato - Early Blight** | ALIGNED | `Tomato - Early Blight` | `Tomato___Early_blight` | 2,400 | 4,800 |
| `tomato_late_blight` | Tomato | Late Blight (Diseased) | **Tomato - Late Blight** | ALIGNED | `Tomato - Late Blight` | `Tomato___Late_blight` | 2,314 | 4,628 |
| `tomato_leaf_mold` | Tomato | Leaf Mold (Diseased) | **Tomato - Leaf Mold** | EXPANDED (NEW) | `*(Not Present)*` | `Tomato___Leaf_Mold` | 0 | 4,704 |
| `tomato_septoria` | Tomato | Septoria Leaf Spot (Diseased) | **Tomato - Septoria Leaf Spot** | ALIGNED | `Tomato - Septoria Leaf Spot` | `Tomato___Septoria_leaf_spot` | 2,184 | 4,362 |
| `tomato_spider_mites` | Tomato | Spider Mites (Two-Spotted) (Diseased) | **Tomato - Spider Mites** | EXPANDED (NEW) | `*(Not Present)*` | `Tomato___Spider_mites Two-spotted_spider_mite` | 0 | 4,352 |
| `tomato_target_spot` | Tomato | Target Spot (Diseased) | **Tomato - Target Spot** | EXPANDED (NEW) | `*(Not Present)*` | `Tomato___Target_Spot` | 0 | 4,568 |
| `tomato_curl_virus` | Tomato | Yellow Leaf Curl Virus (Diseased) | **Tomato - Yellow Leaf Curl Virus** | ALIGNED | `Tomato - Yellow Leaf Curl Virus` | `Tomato___Tomato_Yellow_Leaf_Curl_Virus` | 2,451 | 4,902 |
| `tomato_mosaic_virus` | Tomato | Mosaic Virus (Diseased) | **Tomato - Mosaic Virus** | EXPANDED (NEW) | `*(Not Present)*` | `Tomato___Tomato_mosaic_virus` | 0 | 4,476 |
| `tomato_healthy` | Tomato | Healthy (Healthy) | **Tomato - Healthy** | ALIGNED | `Tomato - Healthy` | `Tomato___healthy` | 2,407 | 4,814 |

---

## 3. Dataset Characteristics & Integrity

### 3.1 File Formats & Image Integrity
- **Image Encoding**: 100% JPEG standard files (`.JPG` / `.jpg`).
- **Corrupted / Truncated Files**: 0 unreadable headers detected across sampled zip records.
- **Dimensions**: Uniform $256 \times 256$ pixels across PlantVillage benchmarks.

### 3.2 Class Imbalance Analysis
- Minimum images per class (new dataset): ~3,000 to 5,000 images per class (well balanced).
- Maximum images per class: `Soybean___healthy` (5,054) and `Apple___Apple_scab` (5,040).
- Class balance ratio is under $1.7:1$ across all 38 classes, presenting negligible imbalance risk.

### 3.3 Leakage Mitigation Strategy
Every image filename adheres to the naming pattern:
```
{base_leaf_uuid}___{pathology_descriptor}_{augmentation_suffix}.JPG
```
By grouping on `{base_leaf_uuid}`, we guarantee that all angular rotations and flips of any individual leaf stay strictly within a single partition (Train, Val, or Test).
