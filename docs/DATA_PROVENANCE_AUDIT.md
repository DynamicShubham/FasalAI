# FasalAI — Data Provenance & Integrity Audit
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## Executive Summary & Data Integrity Principles

The primary objective of this audit is to eliminate every fabricated fallback value and establish transparent provenance for every piece of information rendered across FasalAI.

Every data stream is classified strictly into one of six tiers:
1. **LIVE**: Synchronously retrieved from an active external API or real-time database.
2. **PERIODICALLY UPDATED**: Ingested on a regular schedule from official government repositories.
3. **CURATED REFERENCE**: Expert-verified, statutory, or academic agronomic datasets.
4. **USER-PROVIDED**: Input directly by the authenticated farmer and persisted in Supabase with RLS.
5. **COMPUTED**: Deterministically calculated by domain decision logic or inferred by local ML models.
6. **FALLBACK / FAKE / DEMO**: **PERMANENTLY ELIMINATED**. Upstream degradation now yields an honest `STALE` (with timestamp) or `UNAVAILABLE` state.

---

## 1. Comprehensive Feature-by-Feature Audit

### 1.1 Agro-Weather Intelligence (Current & 5-Day Forecast)
- **Feature:** Real-time temperature, humidity, wind speed, rain probability, and 5-day agro-forecast.
- **Current Source:** OpenWeather API (`api.openweathermap.org/data/2.5/forecast`).
- **Current Implementation:** `WeatherService` in `backend/app/services/weather_service.py` with in-memory TTL caching (15 min fresh window, 120 min stale window).
- **Whether Data is Live:** **LIVE** (when active key is configured and upstream HTTP 200 is received).
- **Whether Data is Authoritative:** **YES** (Global standard agrometeorological provider).
- **Update Frequency:** On demand with a 15-minute server-side cache.
- **Fallback Behavior:** If upstream fails and warm cache exists (<120m), returns `status: "STALE"`, `is_stale: true`, with exact `age_minutes`. If no cache exists, returns `status: "UNAVAILABLE"` with `currentTemp: null` and `forecast: []`. **Zero fake 28°C fallbacks.**
- **Problems Identified:** Previously, an offline request generated a synthetic 28°C and hardcoded dates.
- **Recommended Source:** OpenWeather API server-side with farmer coordinates.
- **Implementation Plan:** Completed. TTL cache implemented, fake fallbacks removed, explicit `UNAVAILABLE` and `STALE` states active.

---

### 1.2 Market & Mandi Prices
- **Feature:** APMC market modal prices, minimums, maximums, arrivals, and price trends.
- **Current Source:** AGMARKNET (Directorate of Marketing & Inspection / DMI, Ministry of Agriculture & Farmers Welfare, GoI).
- **Current Implementation:** Ingestion service `backend/app/services/market_ingestion.py` reading normalized records in `data/agmarknet_mandis.json`.
- **Whether Data is Live:** **PERIODICALLY UPDATED** (Daily government market bulletin).
- **Whether Data is Authoritative:** **YES** (Official statutory APMC market reporting authority in India).
- **Update Frequency:** Daily bulletin publication (~04:30 UTC).
- **Fallback Behavior:** Serves verified bulletin with explicit record date (`source_record_date: "2026-09-02"`). If a commodity is missing, returns `status: "COMMODITY_NOT_FOUND"` with an empty array. **Zero fabricated prices.**
- **Problems Identified:** Previously lacked explicit date tags, risking confusion with real-time stock-style tickers.
- **Recommended Source:** AGMARKNET / data.gov.in daily bulletin records.
- **Implementation Plan:** Completed. AGMARKNET normalization layer built, date tags added, honest empty state enforced.

---

### 1.3 Market Net Realization & Transport Optimizer
- **Feature:** Distance-adjusted in-hand payout calculation across nearby APMC mandis.
- **Current Source:** Computed algorithmically via `backend/app/decision_engine/market_optimizer.py`.
- **Current Implementation:** Deducts road distance transport freight from gross commodity value: `Net Payout = (Modal Price × Qty) - (Distance Km × Transport Rate/Q × Qty)`.
- **Whether Data is Live:** **COMPUTED**.
- **Whether Data is Authoritative:** **YES** (Deterministic mathematical optimization).
- **Update Frequency:** Computed synchronously per user request.
- **Fallback Behavior:** Returns `COMMODITY_NOT_FOUND` if commodity has no recorded prices.
- **Problems Identified:** Needed clear labeling that net realization is an estimate based on freight cost assumptions.
- **Recommended Source:** Deterministic distance-weighted freight calculation.
- **Implementation Plan:** Completed. Labeled with `calculationType: "ESTIMATE"` and explicit formula explanation.

---

### 1.4 Plant Leaf Pathology Diagnostic
- **Feature:** Leaf visual disease identification and symptom severity analysis.
- **Current Source:** In-app Computer Vision model: OpenCV 535-Feature Extractor + Random Forest Classifier.
- **Current Implementation:** `backend/app/vision/detector.py` trained on the PlantVillage dataset (7,250 samples, 29 classes).
- **Whether Data is Live:** **COMPUTED (ML INFERENCE)**.
- **Whether Data is Authoritative:** **YES** (Trained on standard academic benchmark dataset; 92.7% validation accuracy).
- **Update Frequency:** Inferred per photo capture.
- **Fallback Behavior:** If visual confidence is <0.45 (45%), returns `status: "LOW_CONFIDENCE"` and `diseaseName: null`. **Permanently removed previous fallback that defaulted to "Tomato - Early Blight".**
- **Problems Identified:** Previously defaulted to Early Blight when model failed or confidence was low.
- **Recommended Source:** Dedicated PlantVillage Random Forest inference with strict confidence thresholding (<0.45 -> Warning).
- **Implementation Plan:** Completed. Thresholding active, Early Blight fallback removed, real-world field condition disclaimers added.

---

### 1.5 Disease Treatment Protocols (Organic & Chemical)
- **Feature:** Agronomic curative and preventive pesticide/bio-agent recommendations.
- **Current Source:** Indian Council of Agricultural Research (ICAR) & Central Insecticides Board & Registration Committee (CIBRC).
- **Current Implementation:** `data/diseases.json` & `DISEASE_KNOWLEDGE_BASE`.
- **Whether Data is Live:** **CURATED REFERENCE**.
- **Whether Data is Authoritative:** **YES** (Statutory government agricultural chemicals registry).
- **Update Frequency:** Periodic agronomic review.
- **Fallback Behavior:** Deterministic mapping based on verified pathogen classification.
- **Problems Identified:** Needed clear provenance labeling in the diagnostic card.
- **Recommended Source:** ICAR & CIBRC approved bio-control agents and chemical fungicides.
- **Implementation Plan:** Completed. Labeled as `CURATED · ICAR Treatment Protocol`.

---

### 1.6 Government Welfare Schemes & Subsidies
- **Feature:** Scheme benefits, eligibility rules, and application portal links.
- **Current Source:** Official government portals (PM-KISAN, PMFBY, PMKSY, KCC, SMAM, Soil Health Card).
- **Current Implementation:** `data/schemes.json` with verified metadata and direct URLs.
- **Whether Data is Live:** **CURATED REFERENCE** (`last_verified_at: "2026-09-01"`).
- **Whether Data is Authoritative:** **YES** (Statutory welfare programs from Ministry of Agriculture & Farmers Welfare, GoI).
- **Update Frequency:** Bi-weekly administrative verification.
- **Fallback Behavior:** Curated reference data with verified portal URLs.
- **Problems Identified:** Needed clear distinction between indicative platform assessments and official government decisions.
- **Recommended Source:** myScheme & Ministry of Agriculture statutory notifications.
- **Implementation Plan:** Completed. Scheme matcher outputs `"Likely eligible"` with mandatory verification disclaimer and direct official portal links.

---

### 1.7 Crop Agronomic Registry & Suitability Ranking
- **Feature:** Optimal soil pH, water demand, growth stages, MSP, and cultivation cost.
- **Current Source:** ICAR Package of Practices & Commission for Agricultural Costs and Prices (CACP) MSP gazettes.
- **Current Implementation:** `data/crops.json` & `crop_suitability.py`.
- **Whether Data is Live:** **CURATED REFERENCE** (ICAR benchmarks) & **COMPUTED** (Suitability score).
- **Whether Data is Authoritative:** **YES** (Official agricultural research and pricing benchmarks).
- **Update Frequency:** Seasonal official gazette updates.
- **Fallback Behavior:** Evaluated deterministically against user's registered soil pH and texture.
- **Problems Identified:** Needed clear provenance metadata inside `crops.json`.
- **Recommended Source:** ICAR agronomic research standards.
- **Implementation Plan:** Completed. Metadata embedded across all crops, suitability matrix documented.

---

### 1.8 Farmer Identity & Farm Parcels
- **Feature:** Farmer profile (name, district, state, language) and land parcel data (acreage, soil type, irrigation source, crop).
- **Current Source:** Authenticated Supabase PostgreSQL database (`farmers`, `farm_parcels` tables).
- **Current Implementation:** `frontend/context/FarmContext.jsx`, `frontend/context/AuthContext.jsx`, `backend/app/api/v1/farmer.py`.
- **Whether Data is Live:** **USER-PROVIDED** & **LIVE** (Real-time read/write with Supabase).
- **Whether Data is Authoritative:** **YES** (First-party farmer declarative data).
- **Update Frequency:** On farmer registration, onboarding, or profile editing.
- **Fallback Behavior:** Unauthenticated users or users without parcels get clean empty states (`hasFarm: false`). **Zero fake farmer profiles.**
- **Problems Identified:** Unregistered states previously risked showing default demo numbers.
- **Recommended Source:** Authenticated Supabase session with Row-Level Security.
- **Implementation Plan:** Completed. Empty states enforced across dashboard and farm pages, demo fallbacks eradicated.

---

### 1.9 AI Field Advisor
- **Feature:** Conversational agricultural advisory explanations in English, Hindi, and Marathi.
- **Current Source:** Groq LLaMA 3.3 / Qwen API with grounded decision engine context.
- **Current Implementation:** `backend/app/ai/grok_service.py`.
- **Whether Data is Live:** **LIVE (AI EXPLANATION)**.
- **Whether Data is Authoritative:** **NO** (Generative AI explanation; strictly conditioned on deterministic decision engine inputs).
- **Update Frequency:** Real-time conversational inference.
- **Fallback Behavior:** Deterministic agronomic guidance if API is unreachable.
- **Problems Identified:** Risk of LLM hallucinating prices, weather numbers, or pesticide dosages.
- **Recommended Source:** Strict system prompt forbidding hallucination; LLM acts purely as an explainer of structured data.
- **Implementation Plan:** Completed. System prompt enforces strict grounding rule 6 ("Never fabricate specific weather data, market prices, or scheme details").
