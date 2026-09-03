# FasalAI — Comprehensive Data Source Audit & Provenance Verification
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. Executive Summary & Ethical Transparency Standard

In high-stakes agricultural decision support, **data provenance integrity is paramount**. Misrepresenting historical averages as "live satellite readings" or presenting benchmark statistics as "live market tickers" can mislead farmers with severe economic consequences.

This document records the rigorous architectural audit of every data source, prediction pipeline, and knowledge base within **FasalAI**. Every piece of information displayed to the farmer is classified strictly into one of five mutually exclusive provenance categories:
1. **LIVE**: Fetched synchronously from an external live API or active database at runtime.
2. **CURATED**: Canonical, expert-verified reference datasets (ICAR standards, official statutory welfare portals, benchmark APMC tables).
3. **COMPUTED**: Mathematically calculated, inferred by trained machine learning models, or evaluated by deterministic decision-engine rules.
4. **USER-PROVIDED**: Directly entered by the farmer via onboarding, farm configuration, or real-time camera captures.
5. **FALLBACK**: High-fidelity regional historical baselines served strictly when live external services are unreachable, unconfigured, or rate-limited.

---

## 2. Complete Data Source Classification Matrix

| Feature / Domain | API Endpoint / Module | Upstream Data Origin | Provenance Class | Freshness & Fallback Disclosures |
| :--- | :--- | :--- | :--- | :--- |
| **Agro-Weather** | `GET /api/v1/weather/forecast` | `api.openweathermap.org` (OpenWeather 5-day / 3-hr API) | **LIVE** (when API key active) / **FALLBACK** (when unreachable) | If active key responds, flagged `isLive: true` with ISO timestamp. If offline, serves regional historical agro-climatic normals flagged `isLive: false` with label *"ESTIMATED · Agro-Climatic Model"*. |
| **Agro-Weather** | Spray Window Feasibility | `weather_service.py` & `daily_planner.py` | **COMPUTED** | Evaluated dynamically: Wind speed (<15 km/h), Humidity (<75%), and Rain probability (<30%). |
| **Market Intelligence** | `GET /api/v1/market/mandis` | `data/mandis.json` (Lasalgaon, Pimpalgaon, Akola, Pune, etc.) | **CURATED** | Official Agmarknet / APMC benchmark market bulletin reference data. Labeled as *"CURATED BENCHMARK DATA"*. Never represented as a live trading ticker. |
| **Market Intelligence** | `GET /api/v1/market/compare` | `market_optimizer.py` (Road distance × Freight rate per quintal) | **COMPUTED** | Computes net payout: `Gross Realization − Distance Transport Deduction`. Labeled as *"COMPUTED REALIZATION"*. |
| **Plant Leaf Pathology** | `POST /api/v1/vision/scan` | OpenCV 535-feature extractor + Random Forest Classifier | **COMPUTED (ML INFERENCE)** | Trained on 7,250 PlantVillage leaf samples across 29 classes (`accuracy: 92.7%`). Disclosed explicitly in UI with model architecture and accuracy. |
| **Plant Leaf Pathology** | Disease Remedies & Prevention | `data/diseases.json` & `DISEASE_KNOWLEDGE_BASE` | **CURATED** | Derived from Indian Council of Agricultural Research (ICAR) & Central Insecticides Board (CIBRC) approved pathology guidelines. |
| **Govt Schemes** | `GET /api/v1/schemes/matched` | `data/schemes.json` (PM-KISAN, PMFBY, PMKSY, KCC, SMAM, SHC) | **CURATED** | Statutory welfare guidelines from the Ministry of Agriculture & Farmers Welfare. |
| **Govt Schemes** | Match Score & Eligibility Ranking | `scheme_matcher.py` decision engine | **COMPUTED** | Evaluates farmer's acreage, land records, water source, and crop against scheme rules. Labeled *"COMPUTED MATCH"*. |
| **Crop Suitability** | `GET /api/v1/crops/recommendations` | `data/crops.json` (ICAR Agronomic Baselines & Official MSP) | **CURATED** | Sourced from ICAR agronomic package of practices and official Minimum Support Price notifications. |
| **Crop Suitability** | Suitability Score & Profit Projections | `crop_suitability.py` multi-criteria decision matrix | **COMPUTED** | Dynamically scored based on user's registered soil type, pH, irrigation availability, and acreage. |
| **Farmer Identity & Land** | `GET/POST /api/v1/farmer/profile` | Supabase PostgreSQL (`farmers`, `farm_parcels` tables) | **USER-PROVIDED** & **LIVE** | Sourced from authenticated Supabase session and user inputs, enforced with Row-Level Security (RLS). |
| **AI Farm Assistant** | `POST /api/v1/assistant/chat` | Groq LLaMA 3.3 / Qwen with grounded decision context | **LIVE (AI)** / **FALLBACK** | When `GROK_API_KEY` is active, generates responses conditioned on farm parameters. Falls back to deterministic advice if offline. |
| **Field Alerts** | `GET /api/v1/alerts/` | `backend/app/api/v1/alerts.py` | **COMPUTED** | Synthesizes current weather metrics and microclimate disease risk thresholds. Discloses whether source data is Live or Estimated. |

---

## 3. Detailed Verification & Provenance Breakdown

### 3.1. Weather Intelligence
- **Live Provider:** OpenWeather API (`api.openweathermap.org/data/2.5/forecast`).
- **Condition:** When `OPENWEATHER_API_KEY` is configured (>=16 chars) and returns HTTP 200, the response includes `isLive: true`, `dataSource: "OpenWeather API (Live Feed)"`, and an ISO freshness timestamp.
- **Fallback Guarantee:** When the external API is unreachable or unconfigured, the system falls back to regional agro-climatic normals (`isLive: false`, `dataSource: "Regional Agro-Climatic Model (Estimated Baseline)"`).
- **UI Guardrail:** The Dashboard Weather Widget checks `weather.isLive` and renders a green `🟢 LIVE · OpenWeather` badge or an amber `🟡 ESTIMATED · Agro-Climatic Model` badge. Fallback dates are generated dynamically from `datetime.now()` to ensure rolling relevance.

### 3.2. Market & Mandi Price Optimization
- **Data Source:** `data/mandis.json`.
- **Authentic Nature:** Curated Agmarknet / APMC benchmark figures (modal price, min price, max price, arrival volume).
- **Computation:** Road distance and diesel/freight charges (`distanceKm × transportCostPerQuintal`) are deducted from gross commodity value to produce the true net in-hand realization (`netPricePerQuintal`).
- **UI Guardrail:** Clearly marked as `CURATED BENCHMARK DATA` and `COMPUTED REALIZATION`. Never claimed as a real-time live trading exchange feed.

### 3.3. Computer Vision & Leaf Pathology
- **Model Architecture:** Custom OpenCV multi-color-space feature extractor (HSV 3D histogram, LAB color statistics, Laplacian gradients, green-to-lesion ratio — total 535 visual features) paired with a scikit-learn `RandomForestClassifier`.
- **Training Provenance:** Pinned to `PlantVillage Crop Disease Dataset` (7,250 balanced image samples, 29 distinct crop-pathology classes, 92.7% validation accuracy). Pinned metadata stored in `backend/app/vision/models/model_metadata.json`.
- **Treatment Provenance:** Recommendations are curated directly from ICAR and Central Insecticides Board (CIBRC) approved active chemical ingredients (e.g. Mancozeb, Chlorothalonil) and biological controls (Trichoderma viride, Pseudomonas fluorescens, Neem Azadirachtin).
- **UI Guardrail:** Clearly indicates `COMPUTED · PlantVillage ML Model (92.7% Acc)` and `CURATED · ICAR Treatment Protocol`.

### 3.4. Government Welfare Schemes
- **Statutory Source:** Official Central and State agricultural welfare directives from `pmkisan.gov.in`, `pmfby.gov.in`, `pmksy.gov.in`, and state revenue departments.
- **Matching Algorithm:** Rule engine matches farmer's landholding (marginal <2.5 acres, small 2.5-5 acres, large >5 acres), land record availability (7/12 extract / Khasra), irrigation access, and active crop cycle.
- **UI Guardrail:** Displays `CURATED GUIDELINES` and `COMPUTED MATCH`.

### 3.5. Crop Suitability & Daily Planning
- **Agronomic Registry:** `data/crops.json` stores ICAR agronomic thresholds (optimal soil types, pH ranges, water requirements in mm, season, growth stages, MSP).
- **Computation:** Multi-criteria decision matrix weights soil texture match (30%), pH tolerance (25%), irrigation adequacy (25%), and market profit potential (20%).
- **UI Guardrail:** Displays `CURATED AGRONOMIC REGISTRY` and `COMPUTED SUITABILITY`.

---

## 4. Verification Checklist

- [x] All fallback forecasts generate dynamic relative dates rather than stale hardcoded dates.
- [x] Weather widget renders an unambiguous live (`LIVE · OpenWeather`) or fallback (`ESTIMATED · Agro-Climatic Model`) badge based on authentic API status.
- [x] Mandi price views explicitly declare APMC benchmark reference status and computed freight deductions.
- [x] Computer vision diagnostic screen displays true ML model architecture, dataset, and accuracy without inflated claims.
- [x] Scheme and Crop ranking screens declare curated government/ICAR baselines and algorithmic match evaluation.
- [x] Code passes full production build verification (`npm run build`).
