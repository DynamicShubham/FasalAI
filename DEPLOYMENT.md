# FasalAI — Production Deployment Guide
### PR·FUSION · NEXORA 2026 Innovation Hackathon

This guide provides end-to-end instructions for deploying the **FasalAI** platform:
- **Frontend:** Next.js on **Vercel**
- **Backend:** FastAPI on **Render** (Web Service)
- **Database & Auth:** **Supabase** (PostgreSQL & Row-Level Security)
- **Cache:** **Render Key Value** (Redis-compatible)
- **AI Engine:** **Grok API (xAI)**

---

## Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Vercel Edge CDN                        │
 │                Next.js App Router (Frontend)                │
 └──────────────┬───────────────────────────────▲──────────────┘
                │ Client Requests               │ JSON Responses
                ▼                               │
 ┌──────────────────────────────────────────────┴──────────────┐
 │                    Render Web Service                       │
 │                   FastAPI REST Gateway                      │
 │                 (0.0.0.0:$PORT / Python 3)                  │
 └──────┬───────────────────────┬───────────────────────┬──────┘
        │                       │                       │
        ▼                       ▼                       ▼
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │   Supabase   │        │ Render Redis │        │   Grok AI    │
 │  PostgreSQL  │        │  Key Value   │        │   (xAI API)  │
 └──────────────┘        └──────────────┘        └──────────────┘
```

---

## 1. Local Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start local Next.js development server on port 3000
npm run dev
```
Accessible at: `http://localhost:3000`

---

## 2. Local Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install requirements
pip install -r requirements.txt

# Run FastAPI backend with hot reloading on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Gateway: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

---

## 3. Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com).
2. Retrieve your credentials under **Project Settings ➔ API**:
   - **Project URL:** `SUPABASE_URL` (e.g., `https://xxxx.supabase.co`)
   - **Anon / Public Key:** `SUPABASE_KEY`
   - **Service Role Secret Key:** `SUPABASE_SERVICE_ROLE_KEY`
3. Add these variables to your Render Web Service environment.

---

## 4. Redis Configuration (Render Key Value)

FasalAI uses a Redis service abstraction for caching high-frequency market prices and agronomic lookup tables:

- **On Render:** Deploy a **Render Key Value** instance (Free or Starter plan).
- **Environment Variable:** Set `REDIS_URL` to your Render Redis connection string (`redis://red-xxxx:6379` or `rediss://...`).
- **Resilience:** If Redis is temporarily offline or unconfigured, the application automatically falls back to in-memory caching without crashing.

---

## 5. Render Backend Deployment

### Option A: Using Render Blueprint (`render.yaml`) — Recommended
1. In the [Render Dashboard](https://dashboard.render.com), click **New ➔ Blueprint**.
2. Connect your GitHub repository: `DynamicShubham/FasalAI`.
3. Render will detect [`render.yaml`](./render.yaml) and automatically configure:
   - Web Service: `fasalai-backend` (Root Directory: `backend`)
   - Key Value store: `fasalai-redis`
4. Fill in your secret environment variables (`GROK_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENWEATHER_API_KEY`).
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New ➔ Web Service**.
2. Connect your GitHub repo.
3. Configure settings:
   | Setting | Value |
   |---|---|
   | **Name** | `fasalai-backend` |
   | **Region** | `Oregon (US West)` or nearest |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | **Health Check Path**| `/health` |
4. Under **Environment Variables**, add the variables listed below.

---

## 6. Vercel Frontend Deployment

1. Go to [vercel.com/new](https://vercel.com/new) and import your repo.
2. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./` *(or `frontend`)*
3. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL = https://fasalai-backend.onrender.com/api/v1
   ```
4. Click **Deploy**.

---

## 7. Environment Variables Reference

### Backend (`backend/.env` / Render Dashboard)

| Variable | Description | Example |
|---|---|---|
| `PYTHON_VERSION` | Pinned Python runtime | `3.11.8` |
| `DEBUG` | Debug mode toggle | `false` (in prod) |
| `PORT` | Auto-assigned by Render | `$PORT` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,https://fasalai.vercel.app` |
| `GROK_API_KEY` | xAI / Grok API Key | `gsk_...` |
| `OPENWEATHER_API_KEY` | OpenWeather API Key | `a444d9...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon public key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service secret | `eyJhbGci...` |
| `REDIS_URL` | Render Key Value / Redis URL | `redis://...` |

### Frontend (`frontend/.env.local` / Vercel Dashboard)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public backend API endpoint | `https://fasalai-backend.onrender.com/api/v1` |

---

## 8. CORS Configuration

The backend CORS middleware is configured in [`backend/app/main.py`](backend/app/main.py) to:
- Accept origins defined in `CORS_ORIGINS`.
- Dynamically match Vercel preview URLs via `allow_origin_regex=r"https://.*\.vercel\.app"`.
- Support credentials and all standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`).

---

## 9. Production API URL Configuration

When both services are deployed:
1. Copy the Render Web Service URL (e.g. `https://fasalai-backend.onrender.com`).
2. Set `NEXT_PUBLIC_API_URL=https://fasalai-backend.onrender.com/api/v1` in Vercel.
3. Redeploy the frontend on Vercel to pick up the production backend URL.

---

## 10. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **Render Build Fails: ModuleNotFoundError** | Root directory not set to `backend` | In Render settings, ensure **Root Directory** is set to `backend`. |
| **Render Health Check Times Out** | Start command not listening on `$PORT` or `0.0.0.0` | Verify start command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT` and health path is `/health`. |
| **CORS Error on Vercel** | Vercel domain missing from `CORS_ORIGINS` | Add your specific Vercel URL to `CORS_ORIGINS` on Render (e.g., `https://your-app.vercel.app`). |
| **OpenWeather / Grok API 401** | Missing or expired API key | Check the key value in Render Environment Variables. |
| **Vercel Build Error** | Build output not found | The repository includes [`vercel.json`](vercel.json) that automatically routes the build to `frontend/.next`. |
