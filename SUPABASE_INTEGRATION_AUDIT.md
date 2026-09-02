# FasalAI — Supabase Integration Audit Report

**Project:** FasalAI — AI Personalized Agriculture Decision Support Platform  
**Date:** September 2, 2026  
**Scope:** Frontend (Next.js), Backend (FastAPI), Database (Supabase PostgreSQL), Authentication (Supabase Auth & Google OAuth), Row Level Security (RLS).

---

## 1. Executive Summary

This audit reviews the current state of Supabase integration across the FasalAI application, identifies gaps between client-side state and database persistence, and details the plan for complete end-to-end integration.

---

## 2. Current Implementation Audit

### A. Supabase Client & Initialization
- **Frontend:** No Supabase JavaScript SDK (`@supabase/supabase-js`) was installed in `frontend/package.json`. No browser Supabase client module existed in `frontend/lib/`.
- **Backend:** Basic HTTP-based `SupabaseService` existed in `backend/app/services/supabase_service.py` using REST endpoints, but lacked token-based user authentication validation and endpoint protection.

### B. Authentication Flow
- **Current Frontend:** `AuthContext.jsx` used static in-memory React state initialized to a demo farmer ("Ramesh Patil"). The login page supported a simulated OTP flow and a demo shortcut. No Email/Password sign-up or Google OAuth was implemented.
- **Current Backend:** `backend/app/api/v1/farmer.py` used an in-memory `_current_profile` object without token validation.

### C. Database Schema & Tables
The database schema is defined in `backend/supabase_schema.sql`:
1. `public.farmers` — UUID primary key, `auth_user_id` foreign key to `auth.users(id)`, full name, phone number, state, district, language, experience years.
2. `public.farm_parcels` — Land parcels with acreage, soil type, pH, irrigation source, water availability, current standing crop, sowing date.
3. `public.disease_scans` — Scan history with image URL, confidence score, detected disease, pathogen, remedies.
4. `public.advisory_logs` — Chat interactions with user query, assistant reply, farm context JSON.

### D. Row Level Security (RLS) Status
- Schema defines RLS policies on `farmers`, `farm_parcels`, `disease_scans`, and `advisory_logs` checking `auth.uid() = auth_user_id` or parent farmer relationship.
- Backend service role key was used for all REST requests without validating caller tokens.

### E. Hardcoded/Mock Data Locations Identified
1. `frontend/context/AuthContext.jsx`: Static default user (`farmer_demo_1`, "Ramesh Patil").
2. `frontend/context/FarmContext.jsx`: Static default farm (`Patil Organic Farm`, 3.5 acres, Wheat).
3. `backend/app/api/v1/farmer.py`: Static in-memory `_current_profile`.
4. `frontend/app/settings/page.jsx` & `frontend/app/my-farm/page.jsx`: Displaying hardcoded fallback farmer properties.

---

## 3. Required Enhancements & Fixes

1. **Install `@supabase/supabase-js`** in `frontend/package.json`.
2. **Create Browser-Safe Supabase Client (`frontend/lib/supabase.js`)**:
   - Initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (with fallback to `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. **Upgrade `AuthContext`**:
   - Implement Supabase Auth listeners (`onAuthStateChange`).
   - Implement `signUp(email, password, metadata)`, `signIn(email, password)`, `signInWithGoogle()`, and `signOut()`.
   - Load real farmer profile from Supabase on session start.
   - Maintain graceful offline/demo fallback if Supabase credentials are not configured.
4. **Google OAuth Integration**:
   - Add "Continue with Google" button on login page.
   - Implement Next.js OAuth callback route (`/auth/callback`) to exchange code for session and handle onboarding routing.
   - Create `GOOGLE_AUTH_SETUP.md` documentation.
5. **Backend Authentication Dependency (`get_current_user`)**:
   - Validate `Authorization: Bearer <jwt>` against Supabase Auth API (`/auth/v1/user`).
   - Scope all farmer and farm queries to `auth_user_id`.
6. **Onboarding & Farm Setup Persistence**:
   - Persist Step 1 (Farmer Profile) to `public.farmers`.
   - Persist Step 2 (Farm Parcel) to `public.farm_parcels`.
7. **Dashboard Integration**:
   - Drive dashboard header, location, acres, and crop directly from authenticated Supabase data.
   - Render graceful individual loading and error states for weather/market cards.

---

## 4. Environment Variables Mapping

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend | Supabase Publishable / Anon Key (Browser-safe) |
| `SUPABASE_URL` | Backend | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | Backend | Supabase Service Role / Secret Key (Never in frontend) |
| `SUPABASE_KEY` | Backend | Supabase Anon Key for user-scoped requests |
