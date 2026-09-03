# Plant Doctor Reliability & Computer Vision Fix Report
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Problem Statement & Root Cause Audit

Before this fix, FasalAI's Plant Doctor suffered from critical reliability and transparency issues that created false certainty:

1. **Artificial Confidence Inflation**: Line 499 of `detector.py` previously executed `confidence = min(0.98, max(0.72, confidence))`. This artificially compressed and floored any prediction into the 72%–98% range, regardless of how uncertain the model actually was.
2. **Fabricated Fallback Diagnosis**: If model weights failed to load or were uninitialized, line 502 defaulted to `Tomato - Early Blight` with `0.88` confidence.
3. **Crop-Hint Probability Renormalization**: When a farmer selected a crop in the dropdown (e.g. "Apple"), the code filtered the 29-class probability vector to the matching classes and divided by their sum (`raw_conf / subset_sum`). A weak 5% probability was thereby manufactured into an 85%+ "confident" prediction.
4. **No Image Quality Pre-Screening**: Blurry photos, underexposed shots, glare, and non-plant objects (blue sky, bricks, carpet) were passed directly to feature extraction and forced into one of 29 plant disease classes.
5. **No Low-Confidence Exit Path**: The pipeline had no mechanism to admit uncertainty; every input was forced to return a definitive pathology diagnosis.
6. **Overconfident Chemical Prescriptions**: Chemical fungicides were presented as universally applicable prescriptions rather than reference benchmarks requiring label verification.

---

## 2. Engineering Architecture & Solutions Implemented

### 2.1 Removed Fake Confidence Clamping
- Permanently removed `min(0.98, max(0.72, confidence))`.
- The pipeline now returns the **exact, un-inflated probability** calculated by the scikit-learn `RandomForestClassifier.predict_proba()` method.

### 2.2 Removed Fake Fallback
- Completely eradicated the `Tomato - Early Blight` default.
- If model files are missing or uninitialized, the system returns `status: "MODEL_UNAVAILABLE"`, `success: false`, and `diseaseName: null`.

### 2.3 Redesigned Crop-Hint Handling (Constraint vs Inflation)
- **Eliminated Subset Renormalization**: Crop filtering no longer divides probabilities by a subset sum.
- **Crop Constraint Signal**:
  - Global top prediction across all 29 classes is evaluated first (`global_prob`).
  - Best candidate matching the selected crop is evaluated (`crop_best_prob`).
  - If `global_prob >= 0.40` and `global_prob >= 2.5 * crop_best_prob`, the pipeline emits:
    `status: "CROP_MISMATCH"`, `message: "Image may not match selected crop"`
  - Prevents forcing an apple disease onto a corn leaf.

### 2.4 Lightweight Image Quality Pre-Screening
Before computing the 535 OpenCV features, `validate_image_quality()` executes 4 optical tests:
1. **Resolution Validation**: Requires at least $80 \times 80$ pixels.
2. **Blur Detection**: Calculates Laplacian variance on grayscale image. Values $< 20.0$ are flagged as `BLURRY`.
3. **Exposure Check**: Mean pixel intensity $< 28.0$ is flagged as `UNDEREXPOSED`; $> 242.0$ is flagged as `OVEREXPOSED`.
4. **Foliar Chlorophyll Check**: Analyzes HSV space for green foliage ($H \in [28, 90]$). If green ratio $< 5\%$, flagged as `NO_LEAF_DETECTED`.

If any check fails, inference halts immediately with:
`status: "QUALITY_REJECTED"`, accompanied by actionable capture guidance.

### 2.5 Multi-Tier Confidence Routing
Across 29 classes, random chance is $1/29 \approx 3.4\%$. The system implements three mathematically sound tiers:
- **High Confidence ($\ge 45\%$, $\approx 13\times$ random chance)**:
  - `status: "SUCCESS"`
  - `diseaseName: details["diseaseName"]` (Definitive diagnosis)
- **Moderate Confidence ($20\% - 45\%$, $\approx 6\times - 13\times$ random chance)**:
  - `status: "MODERATE_CONFIDENCE"`
  - `diseaseName: f"Possible {details['diseaseName']}"`
  - Advisory note to confirm symptoms before applying chemical sprays.
- **Low Confidence ($< 20\%$)**:
  - `status: "LOW_CONFIDENCE"`
  - `success: false`
  - `diseaseName: null`
  - Message: *"FasalAI couldn't make a reliable diagnosis from this image."*

### 2.6 Top-K Diagnostic Debug Breakdown
Exposes diagnostic transparency in the response payload and scanner UI:
- `topKPredictions`: Top 3 candidates with class names, raw probabilities, and percentages.
- `debugInfo`: Selected crop, global prediction, and raw probability.

### 2.7 Treatment Safety Refinement
- Chemical remedies are retitled: `"Example Chemical Treatment (ICAR Reference)"`.
- Mandatory statutory disclaimer attached:
  *"Illustrative reference benchmark based on ICAR recommendations. Always check local agricultural regulations and the product label for exact crop registration, dosage, and statutory pre-harvest intervals (PHI)."*

---

## 3. Verification & Test Evidence

### 3.1 Automated Model Evaluation (`backend/scripts/evaluate_plant_doctor.py`)
Executed across 17 comprehensive scenarios:
- **A. Benchmark Disease Samples**: 6 / 6 PASSED (`corn_rust` 73%, `tomato_curl` 91%, `grape_rot` 63%, `bell_pepper_spot` 54%, `apple_scab` 24% [Moderate], `potato_blight` 23% [Moderate]).
- **B. Healthy Foliage**: 1 / 1 PASSED (Identified healthy foliar profile without false blight).
- **C. Cross-Crop Constraint**: 3 / 3 PASSED (`CROP_MISMATCH` correctly returned when Corn tested with Apple hint, Tomato tested with Potato hint, Grape tested with Bell Pepper hint).
- **D. Image Quality Degradation**: 4 / 4 PASSED (Blurry, dark, glare, and low-res images cleanly rejected with `QUALITY_REJECTED`).
- **E. Non-Leaf Rejection**: 2 / 2 PASSED (Blue texture and red brick rejected with `NO_LEAF_DETECTED`).
- **F. Ambiguity Handling**: 1 / 1 PASSED (Dispersed vote pattern returned `LOW_CONFIDENCE`, `diseaseName: null`).

**Overall Evaluation Score:** **17 / 17 (100.0% PASS)**. Documented in `docs/PLANT_DOCTOR_EVALUATION.md`.

### 3.2 Backend Test Suite
- `pytest tests/test_data_integrity.py`: **15 / 15 PASSED** in 3.46s.
- `pytest tests/`: **23 / 23 PASSED** in 4.36s.

### 3.3 Frontend Compilation
- `npm run build`: **Compiled successfully** (20 / 20 static pages with 0 errors).

---

## 4. Model Reality Check: PlantVillage vs Field Conditions

The current model was trained on the benchmark PlantVillage dataset (7,250 samples across 29 classes) with OpenCV 535 visual features + Random Forest. While PlantVillage achieves 92.7% validation accuracy under controlled laboratory lighting, **this does not represent real-world ambient field performance**.

Real-world field conditions differ significantly:
1. **Lighting & Shadows**: Direct sunlight produces specular highlights on waxy leaves (altering color histograms); deep canopy shade skews LAB values.
2. **Co-Infections & Nutritional Deficiencies**: A plant may suffer simultaneously from potassium deficiency and early leaf spot, splitting tree votes.
3. **Background Clutter**: Soil, weeds, and hands in the frame add noise unless properly segmented.

**Conclusion**: The implemented guardrails (optical pre-filtering, multi-tier confidence classification, crop mismatch prevention, and refusal to diagnose low-confidence inputs) prevent the model from misleading farmers, making FasalAI robust, honest, and trustworthy for the NEXORA 2026 Hackathon.
