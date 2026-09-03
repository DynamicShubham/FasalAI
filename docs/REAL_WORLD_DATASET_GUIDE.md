# Real-World Agricultural Foliage Dataset Guide
### Provenance, Metadata Standards, and Benchmark Protocol
**Project:** FasalAI (PR·FUSION · NEXORA 2026 Innovation Hackathon)  
**Date:** September 3, 2026  

---

## 1. Dataset Partitioning & Provenance Architecture

To prevent data contamination and ensure credible real-world validation, FasalAI establishes three distinct evaluation groups:

```
                                 FASALAI DATASET INVENTORY
                                              |
       +--------------------------------------+-------------------------------------+
       |                                                                            |
   TRAINING & VALIDATION (95%)                                              EVALUATION TEST SPLIT (5%)
   - Group-leakage safe grouping by Leaf GUID                              +---------------------+---------------------+
   - 87,881 unique samples across 38 classes                               |                     |                     |
   - Class-balanced sampling with augmentations                          TEST A                TEST B                TEST C
                                                                     Controlled          Augmented Val        Held-Out Field
                                                                     (PlantVillage)      (Combined Test)      (Real-World & Phone)
```

### 1.1 Dataset Source Classification

Every image in the FasalAI pipeline is tagged in `data/real_world_manifest.csv` and `data/training_manifest.csv` with authoritative provenance:

| Source Identifier | Description | In-Field Backgrounds | Primary Role |
| :--- | :--- | :--- | :--- |
| `plantvillage` | Controlled laboratory photography (uniform grey/black boards) | No (Studio) | Baseline feature extraction |
| `newplantdiseases` | Multi-dataset augmented foliar collection | Partial | Structural variance & expanded classes |
| `wikimedia_commons_field` | Verified plant pathology field photography (USDA, Bugwood) | Yes (Field/Stalk) | Independent Real-World Test C |
| `independent_held_out` | Benchmark validation images never seen in training/validation splits | Yes (Various) | Independent Real-World Test C |
| `farmer_phone_capture` | High-resolution mobile camera shots captured via FasalAI UI | Yes (Field/Canopy) | Live Production Camera Testing |

---

## 2. Benchmark Composition & Class Distribution (Test C)

The permanent independent test benchmark comprises 40 rigorously labeled, held-out images across key economic crops:

| Normalized Class | Crop Category | Pathogen / Diagnosis | Sample Count | Primary Source |
| :--- | :--- | :--- | :--- | :--- |
| `Apple - Apple Scab` | Apple (*Malus domestica*) | *Venturia inaequalis* | 3 | Independent Held-Out Benchmark |
| `Apple - Cedar Apple Rust` | Apple (*Malus domestica*) | *Gymnosporangium juniperi-virginianae* | 4 | Independent Held-Out Benchmark |
| `Corn (Maize) - Common Rust` | Corn (*Zea mays*) | *Puccinia sorghi* | 8 | Wikimedia In-Field & Held-Out Benchmark |
| `Potato - Early Blight` | Potato (*Solanum tuberosum*) | *Alternaria solani* | 5 | Independent Held-Out Benchmark |
| `Potato - Healthy` | Potato (*Solanum tuberosum*) | Healthy leaf physiology | 2 | Independent Held-Out Benchmark |
| `Tomato - Early Blight` | Tomato (*Solanum lycopersicum*) | *Alternaria solani* | 8 | Wikimedia In-Field & Held-Out Benchmark |
| `Tomato - Healthy` | Tomato (*Solanum lycopersicum*) | Healthy leaf physiology | 4 | Independent Held-Out Benchmark |
| `Tomato - Yellow Leaf Curl` | Tomato (*Solanum lycopersicum*) | *TYLCV* (Begomovirus) | 6 | Independent Held-Out Benchmark |

---

## 3. Strict No-Leakage Enforcement

1. **Leaf GUID Grouping:** In PlantVillage and NewPlantDiseases, images derived from the same leaf through geometric rotation (`_180deg.JPG`, `_flipLR.JPG`) share a common GUID prefix (`{uuid}___...`).
2. **Isolation Guarantee:** No leaf GUID present in `training_manifest.csv` exists in `real_world_manifest.csv` or the `test/test/` held-out benchmark.
3. **No Training on Test C:** Real-world benchmark images are never used for model optimization, fine-tuning, or hyperparameter selection. They serve strictly as an objective, unbiased evaluation harness.
