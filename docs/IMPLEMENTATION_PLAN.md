# FasalAI — Master Implementation Plan
### PR·FUSION · AI Personalized Agriculture Decision Support Platform
### Team Genzcoderz (NXH036) · NEXORA 2026 Innovation Hackathon

---

## 1. Project Overview & Mission
FasalAI (PR·FUSION) is an AI-powered personalized agriculture decision support platform designed specifically for smallholder and rural farmers. Moving beyond passive data dashboards, FasalAI acts as a trustworthy, calm digital field companion that fuses:
- Farmer Profile & Land Details
- Geo-location & Microclimate
- Real-time Weather & Agrometeorological Guidance
- Live Computer Vision Crop Health & Disease Diagnostics
- Real-time Mandi Market Price Intelligence & Distance-Adjusted Margins
- Personalized Government Schemes & Subsidy Eligibility
- Deterministic Decision Engine & Grok AI Natural Language Explanations

The core motto: **"We don't give farmers more information. We turn information into decisions."**

---

## 2. Current Repository State & Audit
- **Root Directory**: `d:\Hackathon nexora`
- **Existing Artifacts**:
  - `NEXORA_2026_PRD.md`: Full product requirements document with 15 core modules (A to O).
  - `FasalAI_Technical_Architecture.md`: Technical stack, deterministic decision engine architecture, data contracts, and security guidelines.
  - `design-reference/`: Extracted Stitch claymorphic design reference screens, CSS tokens, and design systems.
- **Framework Status**: Clean slate ready for structured initialization of Next.js frontend (JavaScript/JSX + Tailwind + shadcn/ui + Framer Motion) and FastAPI backend (Python + Decision Engine + YOLO/CV + Grok orchestration).

---

## 3. Architecture Summary
```
+-------------------------------------------------------------------------+
|                  Next.js 14+ Frontend (React, JSX)                      |
|  - Stitch Tactile Claymorphic UI System                                 |
|  - Camera/MediaDevices Real-time Scanner Stream                         |
|  - Multilingual (English, Hindi, Marathi, Telugu, Tamil, Kannada)       |
|  - Voice Input / Web Speech Recognition                                 |
+-------------------------------------------------------------------------+
                                   | REST / JSON
                                   v
+-------------------------------------------------------------------------+
|                   FastAPI Backend (Python 3.12+)                        |
|  - API Gateway & Route Orchestrator                                     |
|  - Authentication & Farm Context Middleware                             |
|  - Deterministic Decision Engine (Suitability, Alerts, Economics)       |
|  - Real-Time CV Pipeline (Disease Detection & Confidence Engine)        |
|  - Grok API Integration (Natural Language Advisory & Reasoning)         |
|  - External Data Adapters (Weather, Market Prices, Schemes)             |
+-------------------------------------------------------------------------+
       |                         |                           |
       v                         v                           v
+---------------+      +-------------------+      +----------------------+
| Supabase      |      | Redis Cache       |      | Computer Vision &    |
| - PostgreSQL  |      | - Weather Cache   |      | Grok LLM APIs        |
| - Auth        |      | - Mandi Price TTL |      | - YOLO Model Engine  |
| - Storage     |      | - Session context |      | - Grok Reasoning     |
+---------------+      +-------------------+      +----------------------+
```

---

## 4. Folder Structure
```
d:\Hackathon nexora\
├── frontend/                   # Next.js App Router (JS/JSX only, NO TypeScript)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.jsx
│   │   │   └── register/page.jsx
│   │   ├── onboarding/page.jsx
│   │   ├── farm-setup/page.jsx
│   │   ├── dashboard/page.jsx
│   │   ├── my-farm/page.jsx
│   │   ├── crops/
│   │   │   ├── recommendations/page.jsx
│   │   │   ├── compare/page.jsx
│   │   │   └── [cropId]/page.jsx
│   │   ├── scanner/
│   │   │   ├── page.jsx
│   │   │   └── result/page.jsx
│   │   ├── weather/page.jsx
│   │   ├── market/page.jsx
│   │   ├── schemes/page.jsx
│   │   ├── assistant/page.jsx
│   │   ├── decisions/page.jsx
│   │   ├── alerts/page.jsx
│   │   ├── settings/page.jsx
│   │   ├── layout.jsx
│   │   ├── page.jsx            # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Reusable claymorphic & shadcn components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── modal.jsx
│   │   │   ├── sheet.jsx
│   │   │   └── tabs.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── dashboard/
│   │   │   ├── FarmPlanCard.jsx
│   │   │   ├── HealthStatusCard.jsx
│   │   │   ├── WeatherAlertBanner.jsx
│   │   │   └── QuickActionGrid.jsx
│   │   ├── scanner/
│   │   │   ├── CameraFeed.jsx
│   │   │   ├── ScanOverlay.jsx
│   │   │   └── DiagnosisCard.jsx
│   │   └── common/
│   │       ├── LanguageSelector.jsx
│   │       ├── VoiceInputButton.jsx
│   │       ├── LoadingState.jsx
│   │       ├── ErrorState.jsx
│   │       └── EmptyState.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── FarmContext.jsx
│   │   └── LanguageContext.jsx
│   ├── lib/
│   │   ├── api.js
│   │   ├── supabase.js
│   │   ├── translations.js
│   │   └── utils.js
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── farmer.py
│   │   │   │   ├── farm.py
│   │   │   │   ├── crops.py
│   │   │   │   ├── vision.py
│   │   │   │   ├── weather.py
│   │   │   │   ├── market.py
│   │   │   │   ├── schemes.py
│   │   │   │   ├── assistant.py
│   │   │   │   ├── decisions.py
│   │   │   │   └── alerts.py
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── redis.py
│   │   ├── decision_engine/
│   │   │   ├── crop_suitability.py
│   │   │   ├── disease_analyzer.py
│   │   │   ├── market_optimizer.py
│   │   │   ├── scheme_matcher.py
│   │   │   └── daily_planner.py
│   │   ├── vision/
│   │   │   ├── detector.py
│   │   │   ├── preprocess.py
│   │   │   └── disease_catalog.py
│   │   ├── ai/
│   │   │   ├── grok_service.py
│   │   │   └── prompts.py
│   │   ├── services/
│   │   │   ├── weather_service.py
│   │   │   ├── market_service.py
│   │   │   └── scheme_service.py
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   ├── models.py
│   │   │   └── schemas.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
│
├── data/
│   ├── crops.json
│   ├── diseases.json
│   ├── mandis.json
│   └── schemes.json
│
├── IMPLEMENTATION_PLAN.md
└── TODO.md
```

---

## 5. Frontend Implementation Plan
- **Claymorphic Tactile Design System**: Deep agricultural forest dark mode (`#00180d` background, `#002b1b` surfaces, `#4ce19a` emerald highlights, `#96f1c4` high contrast text) matching Stitch prototypes.
- **Tactile Clay Components**: Rich multi-layered inner and outer shadows (`shadow-clay`, `shadow-clay-pressed`, pill-shaped elements with `rounded-full` and `rounded-[32px]`).
- **Responsive Layout**: Fluid dual navigation (Desktop clay sidebar + Mobile sticky top header and bottom tactile navigation bar).
- **Audio & Accessibility**: Built-in voice recognition (Web Speech API) and multi-lingual dictionary support for Hindi, Marathi, Telugu, Tamil, and English.
- **Camera Scanning Flow**: Custom `<CameraFeed />` utilizing WebRTC `navigator.mediaDevices.getUserMedia` with fallback photo upload, live bounding box preview, audio feedback, and diagnosis breakdown.

---

## 6. Backend Implementation Plan
- **FastAPI Core Architecture**: Asynchronous, highly modular REST API with standard Pydantic models for validation.
- **Service-Adapter Pattern**: Abstract external dependencies so services (Weather, Market, Schemes, Grok, Vision) support both live APIs and rich offline fallback mock datasets.
- **Error Handling & Middleware**: Standard JSON envelope response, CORS middleware for Next.js, and graceful degradation when upstream network calls fail.

---

## 7. Database Implementation Plan
- **PostgreSQL / Supabase Schema**:
  - `profiles`: Farmer demographic, contact, language, experience.
  - `farms`: Geo-coordinates, acreage, soil type, irrigation source, crop history.
  - `crops`: Agricultural agronomy facts, temperature bounds, rainfall, soil suitability.
  - `scans`: Visual diagnostics records, disease labels, confidence score, treatment status.
  - `recommendations`: Recorded decision engine outputs.
  - `mandi_prices`: Daily market prices across districts.
  - `government_schemes`: Criteria definitions, benefits, application steps.
  - `alerts`: Active weather, pest, and price notifications.

---

## 8. Authentication Implementation
- Supabase Auth + JWT validation middleware on FastAPI.
- Guest / Demo Farmer Quick Access for instant hackathon evaluation without mandatory SMS verification.

---

## 9. AI Integration Plan (Grok)
- **Role of Grok**: Language translation, empathetic advisory, synthesis of decision engine data into conversational vernacular.
- **Strict Guardrail**: Decision logic is executed deterministically *before* Grok is queried. Grok receives the structured decision JSON context and generates clear, actionable advice.

---

## 10. Computer Vision Implementation Plan
- Real-time frame inspection and image classification for 30+ major crop diseases (Tomato Early/Late Blight, Cotton Leaf Curl, Rice Blast, Wheat Rust, Potato Blight, etc.).
- Returns: Disease Class, Confidence Score, Severity Level (Low/Moderate/Critical), Organic Treatment, Chemical Treatment, Prevention tips.

---

## 11. Weather Intelligence
- Agrometeorological alerts: Rain forecast vs. spraying window, heatwave protection, evapotranspiration water schedule.

---

## 12. Market Intelligence
- Multi-mandi price comparison: Net profit calculator taking distance and transport cost into account.

---

## 13. Government Scheme Engine
- Dynamic eligibility rule engine matching farmer profile (land size, state, social category, irrigation type) to relevant central & state schemes.

---

## 14. Testing & Verification Strategy
- Backend Pytest suite for Decision Engine, Scheme Matcher, and Vision pipeline.
- Frontend component rendering and responsive layout testing.
- End-to-end user journey validation from Onboarding -> Farm Setup -> Dashboard -> Scan -> Decision.

---

## 15. Hackathon Execution Phases
1. **Phase 1: Foundation & Scaffold** (Frontend + Backend + Design Tokens)
2. **Phase 2: Core Data & Services** (Crops, Diseases, Mandis, Schemes database)
3. **Phase 3: Decision Engine & Vision Module** (Deterministic logic + CV Pipeline)
4. **Phase 4: Complete Frontend UI / Stitch claymorphism** (All 15 screens & subcomponents)
5. **Phase 5: Real-time Camera Scanner & Audio UX** (Live scanner & Grok assistant)
6. **Phase 6: Integration, Polish & Verification**
