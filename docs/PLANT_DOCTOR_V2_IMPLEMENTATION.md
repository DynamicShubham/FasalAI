# Plant Doctor v2 — Engineering & Production Implementation
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Production Architecture Overview

The upgraded Plant Doctor v2 (`fasalai-disease-v2`) replaces the legacy 29-class model with an expanded 38-class diagnostic pipeline trained on harmonized multi-dataset benchmarks (`archive.zip` and `newplantarchive.zip`).

```
[Camera Snapshot / File Upload]
             │
             ▼
[Optical Image Quality Pre-Screening]
 (Resolution, Blur, Exposure, Foliar Chlorophyll)
             │
     ┌───────┴───────┐
  [Passed]       [Failed] ──► Return "QUALITY_REJECTED" with capture tips
     │
     ▼
[OpenCV 535-Feature Extractor]
 (HSV 3D Histograms, LAB Color Stats, Laplacian Variance, Sobel Gradients)
             │
             ▼
[Calibrated RandomForestClassifier (38 Classes)]
             │
             ▼
[Confidence & Crop-Constraint Engine]
 ├── Global Top-1 & Top-3 Candidates Evaluated
 ├── Crop-Hint Validation: Strong conflict (>=40%, >=2.5x) flags "CROP_MISMATCH"
 └── Confidence Routing:
      ├── High (>= 45%): Definitive diagnosis
      ├── Moderate (20% - 45%): Labeled "Possible {Disease}"
      └── Low (< 20%): Refuses diagnosis ("Unable to diagnose")
             │
             ▼
[Integrated ICAR Treatment Reference & Safety Disclaimers]
```

---

## 2. Image Preprocessing & Feature Extraction

Every image (from mobile camera frames or file uploads) is preprocessed identically:
- **Resizing**: Scaled to standard $128 \times 128$ bounding dimension preserving aspect ratio.
- **Color Spaces**:
  - HSV: 3D Color Histogram with $8 \times 8 \times 8 = 512$ bins capturing foliar discoloration, necrosis, and chlorosis.
  - LAB: Mean and standard deviation across L (lightness), A (green-red axis), and B (blue-yellow axis).
  - BGR: Raw channel statistics.
- **Texture & Edges**:
  - Laplacian Variance: Quantifies lesion roughness and necrotic margin sharpness.
  - Sobel X & Y: Mean gradient magnitudes capturing pustule and spore boundaries.
- **Tissue Ratios**:
  - Foliar green chlorophyll ratio ($H \in [28, 90]$).
  - Lesion / non-green tissue ratio.

Total feature vector dimensionality: **535 continuous descriptors**.

---

## 3. Optical Quality Gate (`validate_image_quality`)

Before executing feature extraction or ML inference, the pipeline executes 4 physical checks:
1. **Minimum Resolution**: Must be at least $80 \times 80$ pixels (`LOW_RESOLUTION`).
2. **Blur Detection**: Laplacian variance $< 20.0$ rejected as `BLURRY`.
3. **Exposure Check**: Mean grayscale $< 28.0$ (`UNDEREXPOSED`) or $> 242.0$ (`OVEREXPOSED`).
4. **Foliar Chlorophyll Check**: Must contain at least 5% green foliar tissue (`NO_LEAF_DETECTED`). Rejects brick walls, car dashboards, and non-plant objects.

---

## 4. Truthful Confidence & Crop Hint Handling

### 4.1 Zero Fake Confidence
- Artificial clamping (`min(0.98, max(0.72, p))`) was permanently eradicated.
- The pipeline outputs the exact uninflated probability from `model.predict_proba()`.

### 4.2 Crop Hint as Validation Constraint
- Selecting a crop does **not** renormalize probabilities (which previously manufactured 95% certainty from a 5% guess).
- If a farmer selects a crop (e.g. "Apple"), but the leaf visual features strongly indicate Corn Rust ($p \ge 40\%$ and $\ge 2.5\times$ best apple candidate):
  `status: "CROP_MISMATCH"`
  *"Image may not match selected crop (Apple). Visual pathology aligns with Corn (Maize) - Common Rust."*

---

## 5. Camera and Upload Convergence

Both the mobile camera path (`/api/v1/vision/scan-frame`) and upload path (`/api/v1/vision/upload`) route into the identical Python function:
`detector.detect_from_image_bytes(image_bytes, crop_hint)`

### Camera Consistency Proof:
When identical leaf bytes are sent via camera base64 vs multipart form upload:
- Prediction: **100% Identical** (`Corn Common Rust (Puccinia sorghi)`)
- Confidence: **100% Identical** (`95.3%`)
- Status: **100% Identical** (`SUCCESS`)
- Version: **100% Identical** (`fasalai-disease-v2`)

---

## 6. Curated Agronomic Knowledge Base

All 38 production classes map to verified ICAR / SAU reference treatments:
- Symptoms & causal pathogen description
- Organic / biological remedies (Trichoderma viride, Pseudomonas fluorescens, Neem Azadirachtin)
- Chemical reference treatments (Mancozeb, Ridomil MZ, Hexaconazole)
- Cultural and preventive practices
- Mandatory statutory disclaimer requiring label verification and local agronomist consultation.
