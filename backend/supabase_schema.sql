-- ==============================================================================
-- FasalAI — Production Supabase Schema & Row-Level Security (RLS) Policies
-- PR·FUSION — AI Personalized Agriculture Decision Support Platform
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Farmers Profile Table
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    district TEXT NOT NULL DEFAULT 'Nashik',
    language TEXT NOT NULL DEFAULT 'English',
    experience_years INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Farm Land Parcels Table
CREATE TABLE IF NOT EXISTS public.farm_parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    parcel_name TEXT NOT NULL DEFAULT 'Main Parcel',
    acreage NUMERIC(5, 2) NOT NULL DEFAULT 3.5,
    soil_type TEXT NOT NULL DEFAULT 'Black Clay Loam',
    soil_ph NUMERIC(3, 1) DEFAULT 6.8,
    irrigation_source TEXT DEFAULT 'Drip + Borewell',
    water_availability TEXT DEFAULT 'Medium',
    current_crop TEXT DEFAULT 'Wheat',
    sowing_date DATE DEFAULT CURRENT_DATE - INTERVAL '22 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Leaf Pathology & Disease Diagnostic Logs
CREATE TABLE IF NOT EXISTS public.disease_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    disease_id TEXT NOT NULL,
    disease_name TEXT NOT NULL,
    pathogen TEXT,
    severity TEXT NOT NULL DEFAULT 'Moderate',
    confidence_score NUMERIC(4, 3) NOT NULL,
    image_url TEXT,
    organic_remedy TEXT,
    chemical_remedy TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Conversational Advisory History
CREATE TABLE IF NOT EXISTS public.advisory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
    user_query TEXT NOT NULL,
    assistant_reply TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    farm_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures each farmer can only view and modify their own records
-- ==============================================================================

ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_logs ENABLE ROW LEVEL SECURITY;

-- Farmers Policy
CREATE POLICY "Farmers can access own profile"
    ON public.farmers
    FOR ALL
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Farm Parcels Policy
CREATE POLICY "Farmers can manage own parcels"
    ON public.farm_parcels
    FOR ALL
    USING (
        farmer_id IN (
            SELECT id FROM public.farmers WHERE auth_user_id = auth.uid()
        )
    );

-- Disease Scans Policy
CREATE POLICY "Farmers can view own scans"
    ON public.disease_scans
    FOR ALL
    USING (
        farmer_id IN (
            SELECT id FROM public.farmers WHERE auth_user_id = auth.uid()
        )
    );

-- Advisory Logs Policy
CREATE POLICY "Farmers can view own chat logs"
    ON public.advisory_logs
    FOR ALL
    USING (
        farmer_id IN (
            SELECT id FROM public.farmers WHERE auth_user_id = auth.uid()
        )
    );
