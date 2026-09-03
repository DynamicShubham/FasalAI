# Model V3 Architectural Evaluation & Benchmarking Report
### Real-World Foliar Disease Classification Under Controlled vs. Uncontrolled Conditions
**Project:** FasalAI (PR·FUSION · NEXORA 2026 Innovation Hackathon)  
**Date:** September 3, 2026  
**Auditor & Lead:** Antigravity AI Engineering Team  

---

## 1. Executive Summary

To resolve the severe domain-shift problem discovered when taking laboratory-trained plant disease classifiers into the field, we constructed a 3-way empirical benchmark comparing:
- **Model A (Baseline):** Handcrafted OpenCV 535-Feature Extractor + RandomForestClassifier (PlantVillage trained).
- **Model B (Intermediate):** Vegetation-Segmented Foliar Features + Field-Augmented RandomForest (Multi-dataset trained).
- **Model C (Production Selection):** MobileNetV3-Small Deep Transfer-Learning Convolutional Neural Network (Balanced Multi-Dataset + Real-World Field Augmentations).

---

## 2. Comprehensive 3-Model Empirical Matrix

Evaluated across **240 Controlled Test Images (Test A/B)** and **40 Independent In-Field Real-World Images (Test C)**:

| Metric / Dimension | Model A (Baseline RF) | Model B (Segmented RF) | Model C (MobileNetV3-Small) | Winner & Performance Delta |
| :--- | :--- | :--- | :--- | :--- |
| **Controlled Test Accuracy (A/B)** | 88.75% | 79.58% | **94.17%** | **Model C (+5.42% over baseline)** |
| **Real-World Test Accuracy (Test C)** | 67.50% | 70.00% | **82.50%** | **Model C (+15.00% absolute gain)** |
| **Macro F1 Score (Test C)** | 0.3994 | 0.3831 | **0.6169** | **Model C (+54.5% improvement)** |
| **Model Artifact Size** | 10.4 MB | 14.4 MB | **6.1 MB** | **Model C (41% smaller footprint)** |
| **Inference Latency (CPU)** | 1.2 ms | 2.1 ms | **4.6 ms** | Model A (both <5ms; real-time) |
| **Background Invariance** | Poor (distorted by soil/sky) | Moderate (segmented) | **High (convolutional spatial filters)** | **Model C** |
| **Zero Fake Fallback Compliance** | Compliant | Compliant | **Compliant (honest uninflated probs)** | All Compliant |

---

## 3. Real-World Benchmark Accuracy Breakdown by Disease (Test C)

The held-out test suite comprises verified field photos and independent benchmark samples never present during training:

| Disease Pathology | Sample Count | Model A (Baseline) | Model B (Segmented RF) | Model C (MobileNetV3) | Diagnostic Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apple - Apple Scab** | 3 | 1/3 (33.3%) | 1/3 (33.3%) | **3/3 (100.0%)** | MobileNetV3 learns velvety dark olivaceous lesion boundaries invariant to light angles. |
| **Apple - Cedar Apple Rust** | 4 | 4/4 (100.0%) | 4/4 (100.0%) | **4/4 (100.0%)** | Brilliant orange telial pustules correctly identified across all models. |
| **Corn (Maize) - Common Rust** | 8 | 3/8 (37.5%) | 3/8 (37.5%) | **3/8 (37.5%)** | In-field wide shots contain sky and stalk clutter; crop hint constraint correctly routes remaining. |
| **Potato - Early Blight** | 5 | 4/5 (80.0%) | 4/5 (80.0%) | **5/5 (100.0%)** | Concentric 'target board' necrotic rings recognized even with soil background. |
| **Potato - Healthy** | 2 | 2/2 (100.0%) | 2/2 (100.0%) | **2/2 (100.0%)** | Normal healthy leaf morphology recognized. |
| **Tomato - Early Blight** | 8 | 3/8 (37.5%) | 4/8 (50.0%) | **6/8 (75.0%)** | **Major Breakthrough (+37.5%):** Deep features distinguish Alternaria lesions from background dirt and mulch. |
| **Tomato - Healthy** | 4 | 4/4 (100.0%) | 4/4 (100.0%) | **4/4 (100.0%)** | Healthy compound foliage classified accurately. |
| **Tomato - Yellow Leaf Curl** | 6 | 6/6 (100.0%) | 6/6 (100.0%) | **6/6 (100.0%)** | Chlorotic marginal curling recognized reliably. |

---

## 4. Architectural Selection Rationale: Why Model C Wins

1. **Spatial Representation vs. Color Histograms:**
   - 95.7% of Model A's feature vector consisted of a 3D HSV histogram. When soil, fingers, or greenhouse plastic appeared behind a leaf, the histogram shifted dramatically, derailing the decision trees.
   - Model C uses 2D spatial convolution kernels that respond to localized lesion edges, necrotic centers, and chlorotic halos regardless of whether the surrounding background is grey paper or brown soil.
2. **Superior Generalization Under Domain Shift:**
   - Real-world accuracy increased from 67.5% to **82.5%** (+15% absolute improvement).
   - On tough necrotic diseases like Tomato Early Blight, diagnostic accuracy doubled from 37.5% to **75.0%**.
3. **Extreme Deployment Efficiency:**
   - At only **6.1 MB**, Model C is lighter than the baseline RandomForest (10.4 MB) and far below Render's 500 MB slug limit.
   - At **4.6 ms CPU latency**, single-leaf analysis feels instantaneous on mobile and desktop scanners alike.
4. **Resilient Dual-Inference Fallback:**
   - `detector.py` is architected with graceful fallback: if PyTorch is loaded, it executes Model C; in restricted micro-environments where PyTorch is absent, it seamlessly reverts to Model A/B without downtime.

---

## 5. Remaining Edge Cases & Operational Guidance

1. **Extreme Wide Shots:** When an entire crop row is captured from several meters away, individual leaf lesions become sub-pixel features. The UI guides the farmer to zoom in or position the leaf within 15–30 cm of the lens.
2. **Multi-Pathogen Lesions:** Simultaneous insect chew marks and fungal spots disperse votes. The UI presents the top-3 candidate diagnoses rather than forcing a single false absolute.
