# FasalAI — Live Data Architecture & Implementation Guide
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Architectural Philosophy: The Zero-Fabrication Guarantee

In agricultural computing, **false precision is dangerous**. Presenting an expired forecast as current weather or inventing replacement prices when an API is unreachable can result in ruined sprays, lost crops, or catastrophic financial decisions for a farmer.

FasalAI enforces a strict **Zero-Fabrication Guarantee**:
1. **Never manufacture replacement values.** When an upstream source fails, return an explicit `STALE` state (if cached within a verified grace period) or an `UNAVAILABLE` state.
2. **Never default an uncertain image to a disease.** If the computer vision model confidence is below threshold, output `LOW_CONFIDENCE` with guidance to retake the photo.
3. **Never claim data is "Real-Time" or "Live" unless technically verified.** Clearly distinguish live streaming feeds from periodic daily government bulletins and curated reference datasets.

---

## 2. Weather Architecture (`WeatherService`)

### Ingestion Pipeline
- **Provider:** OpenWeather API (`api.openweathermap.org/data/2.5/forecast`).
- **Authentication:** Server-side `OPENWEATHER_API_KEY` (never exposed to client bundle).
- **Location Pinning:** Coordinates (`lat`, `lon`) and district name from farmer profile.

### Caching & Status State Machine
```
Upstream Request
       │
       ├──[HTTP 200 Success]──► Store in Cache ──► status: "LIVE" (is_live: true, age_minutes: 0)
       │
       └──[HTTP Error / Timeout / Unconfigured]
                │
                ├──[Cache Age <= 120 min]──► status: "STALE" (is_live: false, is_stale: true, age_minutes: N)
                │
                └──[No Cache or Age > 120 min]──► status: "UNAVAILABLE" (currentTemp: null, forecast: [])
```

### Response Schema
```json
{
  "location": "Nashik, Maharashtra",
  "currentTemp": 26,
  "condition": "Clouds",
  "description": "Scattered Clouds",
  "humidity": 62,
  "windSpeedKm": 11.5,
  "rainProbability": 15,
  "spraySuitability": "Ideal",
  "irrigationAdvice": "Safe to irrigate. Maintain scheduled morning watering cycle.",
  "forecast": [...],
  "source": "OpenWeather",
  "source_url": "https://openweathermap.org",
  "fetched_at": "2026-09-03T05:30:00Z",
  "data_timestamp": "2026-09-03T05:00:00Z",
  "status": "LIVE",
  "is_live": true,
  "is_stale": false,
  "age_minutes": 0,
  "timezoneOffset": 19800
}
```

---

## 3. Market Intelligence & AGMARKNET Ingestion

### Pipeline Overview
Official market bulletins are collected from the Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, GoI (AGMARKNET).
1. **Ingestion & Normalization:** Records are validated to ensure uniform fields (`marketId`, `marketName`, `district`, `commodity`, `variety`, `grade`, `minPrice`, `maxPrice`, `modalPrice`, `sourceRecordDate`).
2. **Deterministic Freight Optimization:** Calculates true net realization:
   $$\text{Net Payout} = (\text{Modal Price} \times \text{Quantity}) - (\text{Distance Km} \times \text{Transport Cost/Q} \times \text{Quantity})$$
3. **Honest Labeling:** Market figures are labeled with source date (`"Market data · 02 Sep 2026"`), and net figures are explicitly flagged as `"calculationType": "ESTIMATE"`.
4. **Missing Commodity Protection:** If a commodity has no records, returns `status: "COMMODITY_NOT_FOUND"` with an empty array. **Zero fabricated prices.**

---

## 4. Computer Vision Diagnostic Guardrails

### Model Architecture
- **Classifier:** OpenCV 535-Feature Extractor (HSV 3D Color Histogram, LAB statistics, Laplacian gradient variance, green-to-lesion ratio) + scikit-learn `RandomForestClassifier`.
- **Training Baseline:** PlantVillage dataset (7,250 samples, 29 classes).
- **Validation Accuracy:** 92.7% under benchmark laboratory conditions.

### Confidence Thresholding
$$\text{Confidence} = \max_c P(y = c \mid \mathbf{x})$$
- If $\text{Confidence} < 0.45$:
  - `status: "LOW_CONFIDENCE"`
  - `success: false`
  - `diseaseName: null`
  - Warning: *"Unable to make a reliable diagnosis from this image. The leaf features do not match trained pathology patterns with sufficient confidence. Please retake the photo with clear lighting and focus directly on the affected leaf area."*
  - **Eliminated previous fallback that defaulted to "Tomato - Early Blight".**
- If $\text{Confidence} \ge 0.45$:
  - `status: "SUCCESS"`
  - `success: true`
  - Includes mandatory disclaimer: *"Validation accuracy was measured under benchmark dataset conditions. Field accuracy varies under ambient lighting, shadows, dust, and multi-pathogen complexes. Verify with local KVK agronomist before purchasing chemical pesticides."*

---

## 5. Government Schemes Verification

- All schemes are classified as `VERIFIED REFERENCE` and verified against official government portals (`pmkisan.gov.in`, `pmfby.gov.in`, `pmksy.gov.in`, `myscheme.gov.in`).
- The decision engine outputs:
  - `"Likely eligible"`
  - `"Requires Additional Verification"`
  - `"Likely ineligible"`
- Every scheme card provides:
  - Official verifying department
  - Direct portal link
  - Mandatory disclaimer: *"Indicative algorithmic assessment only. Final benefit disbursement is subject to official document verification by the implementing department or bank."*

---

## 6. Automated Verification Evidence

The entire pipeline is tested via `backend/tests/test_data_integrity.py` across 15 mandatory test scenarios:

| Test ID | Scenario Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| `test_1` | Successful weather fetch | **PASSED** | Returns `status: "LIVE"`, `is_live: true`, `age_minutes: 0` |
| `test_2` | Weather API failure with no cache | **PASSED** | Returns `status: "UNAVAILABLE"`, `currentTemp: null`, `forecast: []` |
| `test_3` | Stale weather cache | **PASSED** | Returns `status: "STALE"`, `is_stale: true`, `age_minutes >= 40` |
| `test_4` | Successful AGMARKNET market ingestion | **PASSED** | Validates modal, min, max price, variety, grade, and source date |
| `test_5` | Market API failure handling | **PASSED** | Returns `COMMODITY_NOT_FOUND` cleanly without crashing |
| `test_6` | Stale market data verification | **PASSED** | Validates record dates and status flags across all market entries |
| `test_7` | Missing market commodity | **PASSED** | Returns clean empty response without inventing prices |
| `test_8` | Scheme matching evaluation | **PASSED** | Returns `"Likely eligible"` with official URLs and disclaimers |
| `test_9` | Missing scheme criteria handling | **PASSED** | Correctly flags large/ineligible landholders as `"Likely ineligible"` |
| `test_10` | CV low confidence rejection | **PASSED** | Flat noise image returns `LOW_CONFIDENCE`, `diseaseName: null` |
| `test_11` | CV successful classification | **PASSED** | Recognizable leaf returns diagnosis with field accuracy disclaimer |
| `test_12` | Fresh farmer profile isolation | **PASSED** | Unauthenticated request returns `hasProfile: false`, `profile: null` |
| `test_13` | Second-user data isolation | **PASSED** | User A and User B cannot access or mutate each other's parcels |
| `test_14` | Upstream API timeout handling | **PASSED** | Client timeout gracefully degrades to `UNAVAILABLE` without hanging |
| `test_15` | Malformed upstream response handling | **PASSED** | Corrupt payload caught cleanly and flagged as `UNAVAILABLE` |

**Total Suite Result:** 23 / 23 automated tests passed (`tests/test_backend.py` + `tests/test_data_integrity.py`).
