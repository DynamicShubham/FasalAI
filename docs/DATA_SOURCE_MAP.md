# FasalAI — Data Source Map & Architectural Pipeline
### PR·FUSION · NEXORA 2026 Innovation Hackathon · Team Genzcoderz (NXH036)

---

## 1. System Architecture Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             AUTHENTIC DATA SOURCES                               │
├───────────────────┬───────────────────┬───────────────────┬──────────────────────┤
│    OpenWeather    │     AGMARKNET     │  ICAR / Ministry  │    PlantVillage      │
│   Live Forecast   │ Official Mandis   │  Statutory Docs   │   CV Training Set    │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴──────────┬───────────┘
          │                   │                   │                    │
          ▼                   ▼                   ▼                    ▼
┌───────────────────┬───────────────────┬───────────────────┬──────────────────────┐
│  WeatherService   │ Market Ingestion  │  Scheme Matcher   │ CropDiseaseDetector  │
│  TTL Cache (15m)  │ Normalization     │ Indicative Scorer │ OpenCV 535 + RF      │
│ Zero-Fake Fallback│ Transport Model   │  Portal Registry  │ Confidence Thresh.   │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴──────────┬───────────┘
          │                   │                   │                    │
          └───────────────────┼───────────────────┼────────────────────┘
                              ▼                   ▼
                    ┌───────────────────┬───────────────────┐
                    │  FastAPI Backend  │ Supabase Postgres │
                    │   v1 REST APIs    │ Farmer Profile    │
                    │ Zero Fabrications │ RLS Data Isol.    │
                    └─────────┬─────────┴─────────┬─────────┘
                              │                   │
                              └─────────┬─────────┘
                                        ▼
                    ┌───────────────────────────────────────┐
                    │         Next.js 14 Client UI          │
                    │   Honest Freshness & Age Badges       │
                    │  Explicit UNAVAILABLE / STALE States  │
                    │  "Updated 4m ago" · "AGMARKNET Date"  │
                    └───────────────────────────────────────┘
```

---

## 2. Complete Data Source Map Table

| Feature / Module | Upstream Authority / Source | Collection / Ingestion Method | Refresh Frequency | Storage / Caching Layer | Failover & Stale Policy | Frontend Provenance Label |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Agro-Weather (Current & 5-Day)** | OpenWeather API (`api.openweathermap.org`) | Server-side async HTTPS request with farmer lat/lon & district | 15-minute polling / demand | In-memory cache (`CACHE_TTL = 15 min`) | Grace period: serves cached data as `STALE` up to 120 min with `age_minutes`. If expired/absent: returns explicit `UNAVAILABLE` (`currentTemp: null`, 0 fake data). | `Updated Xm ago` (LIVE) / `Cached Xm ago (Stale)` (STALE) / `Weather Unavailable` (UNAVAILABLE) |
| **Spray & Irrigation Advisory** | Agrometeorological rules engine (`weather_service.py`) | Derived from temperature, wind speed (<15 km/h), and rain probability (<30%) | Real-time computed on weather retrieval | Computed in-memory | If weather unavailable, advisory returns `Unknown (Weather Unavailable)` | `COMPUTED · Microclimate Model` |
| **Market Mandi Prices** | AGMARKNET (Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, GoI) | Ingestion and normalization of official APMC daily bulletins (`data/agmarknet_mandis.json`) | Daily bulletin updates (04:30 UTC) | Local structured repository & PostgreSQL | If commodity missing in market cluster, returns `COMMODITY_NOT_FOUND` with empty list. Zero invented prices. | `OFFICIAL AGMARKNET BULLETIN · Market data: DD Mon YYYY` |
| **Net In-Hand Transport Optimization** | Deterministic Freight Optimizer (`market_optimizer.py`) | Formula: `Gross Payout − (Distance Km × Transport Cost/Q)` | Computed on farmer demand for requested quintals | Computed in-memory | Labeled strictly as estimate | `ESTIMATED REALIZATION · Net in-hand = Modal Price − Transport` |
| **Government Welfare Schemes** | Central & State Government Portals (PM-KISAN, PMFBY, PMKSY, KCC, SMAM, Soil Health Card) | Curated statutory directives with official portal links (`data/schemes.json`) | Bi-weekly statutory verification | In-code curated registry (`status: "VERIFIED REFERENCE"`) | Always provides verified source link for official application | `Government Source · Verified 01 Sep 2026` |
| **Scheme Eligibility Evaluation** | Indicative Match Engine (`scheme_matcher.py`) | Evaluates farmer acreage, land records, water source, and crop against statutory guidelines | Computed per user profile | Computed in-memory | Outputs `Likely eligible` / `Likely ineligible` with mandatory disclaimer that final eligibility is determined by the nodal department/bank | `Likely eligible (Indicative assessment)` |
| **Agronomic Crop Benchmarks** | Indian Council of Agricultural Research (ICAR) & CACP MSP Notifications | Curated agronomic registry (`data/crops.json`) | Seasonal / official gazette updates | In-code curated registry (`status: "CURATED AGRICULTURAL REFERENCE"`) | Verified against official ICAR Package of Practices | `Curated Agricultural Reference · ICAR Standards` |
| **Crop Suitability Ranking** | Multi-Criteria Decision Engine (`crop_suitability.py`) | Multi-variable weighted scoring (Soil texture 30%, pH 25%, Irrigation 25%, Market 20%) | Real-time computed on user soil inputs | In-memory computed | Scored deterministically; zero LLM hallucinations | `COMPUTED SUITABILITY · Multi-Criteria Decision Matrix` |
| **Plant Leaf Disease Diagnostic** | In-App OpenCV Feature Extractor + Random Forest Classifier | Trained on PlantVillage dataset (7,250 samples, 29 crop-disease classes) | Pinned model artifact (`backend/app/vision/models/`) | Local scikit-learn model artifact (`validation_accuracy: 92.7%`) | Confidence thresholding (<0.45): Returns `status: "LOW_CONFIDENCE"`, `diseaseName: null`. **Zero defaulting to fake diseases.** | `COMPUTED · PlantVillage ML Model (Benchmark: 92.7%)` |
| **Disease Treatment Protocols** | ICAR & Central Insecticides Board & Registration Committee (CIBRC) | Curated agronomic pathology guidelines (`data/diseases.json`) | Annual agronomic review | In-code curated registry | Provides organic/bio-control and chemical options with application safety notes | `CURATED · ICAR & CIBRC Treatment Protocol` |
| **Farmer Identity & Farm Parcels** | Authenticated Farmer via Supabase Auth & PostgreSQL | User onboarding form, farm setup modal, and camera captures | User-initiated writes | Remote Supabase PostgreSQL with Row-Level Security (RLS) | Unauthenticated users or users without parcels get clean empty states (`hasFarm: false`). Zero mock profiles. | `USER-PROVIDED · Persisted in Supabase PostgreSQL` |
| **AI Farm Assistant** | Groq LLaMA 3.3 / Qwen via API (`grok_service.py`) | Grounded inference prompt conditioned strictly on validated decision engine context | User chat request | Ephemeral session context | System prompt strictly forbids LLM from hallucinating prices, weather, or diagnoses. Only explains provided facts. | `AI EXPLANATION · Grounded in Decision Context` |

---

## 3. Storage & Persistence Guarantees

1. **Farmer Data:** Authenticated Supabase PostgreSQL database tables (`public.farmers`, `public.farm_parcels`) with strict RLS enforcement (`auth.uid() = auth_user_id`).
2. **Weather:** In-memory TTL cache with 15-minute fresh window and 120-minute stale grace window.
3. **Market:** Normalized AGMARKNET daily bulletin records with record dates.
4. **Schemes & Crops:** Authoritative versioned reference files with documented `last_verified_at` metadata.
5. **Computer Vision:** Local model weights with strict confidence thresholding.
