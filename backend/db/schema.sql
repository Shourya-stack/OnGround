-- =============================================================================
-- OnGround — Database Schema (PostgreSQL / Supabase)
-- Authoritative schema definition for SIH 2026 Problem Statement 26122
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES & USER ROLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('planner', 'supervisor')) DEFAULT 'supervisor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'supervisor')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to prevent direct role escalation by authenticated users (SEC-01)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed and executed in context of an end-user session
    IF (auth.uid() IS NOT NULL OR current_user = 'authenticated') AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Users are not permitted to modify their own role.';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- =============================================================================
-- 1.1 PROJECT_MEMBERSHIPS (Multi-Tenant Isolation & Access Control)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.project_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('planner', 'supervisor')) DEFAULT 'supervisor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_memberships_user ON public.project_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_project ON public.project_memberships(project_id);


-- =============================================================================
-- 2. SCHEDULE_PLAN (Baseline WBS Schedule — Static Ground Truth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    activity_code TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('civil', 'piping', 'electrical', 'instrumentation', 'static_rotating_equipment', 'hse')),
    planned_start DATE NOT NULL,
    planned_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_plan_discipline ON public.schedule_plan(discipline);
CREATE INDEX IF NOT EXISTS idx_schedule_plan_project ON public.schedule_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_plan_dates ON public.schedule_plan(planned_start, planned_end);
CREATE INDEX IF NOT EXISTS idx_schedule_plan_code ON public.schedule_plan(activity_code);

-- =============================================================================
-- 3. EXTRACTIONS (Uploaded Report Jobs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('daily_report', 'spreadsheet', 'voice_transcript')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'complete', 'failed')) DEFAULT 'pending',
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extractions_project ON public.extractions(project_id);
CREATE INDEX IF NOT EXISTS idx_extractions_status ON public.extractions(status);

-- =============================================================================
-- 4. EXTRACTED_ACTIVITIES (Normalized Activities from AI Extraction)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.extracted_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_id UUID NOT NULL REFERENCES public.extractions(id) ON DELETE CASCADE,
    activity_description TEXT NOT NULL,
    discipline TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location_reference TEXT,
    extraction_confidence FLOAT NOT NULL, -- REQUIRED ADDITION (C4): Server-side calculated deterministic score (0.0 - 1.0)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_activities_extraction ON public.extracted_activities(extraction_id);
CREATE INDEX IF NOT EXISTS idx_extracted_activities_discipline ON public.extracted_activities(discipline);

-- =============================================================================
-- 5. SCHEDULE_MATCHES (AI-linked Extracted Activities to Baseline Plan)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extracted_activity_id UUID NOT NULL UNIQUE REFERENCES public.extracted_activities(id) ON DELETE CASCADE,
    plan_activity_id UUID NOT NULL REFERENCES public.schedule_plan(id) ON DELETE CASCADE,
    confidence_score FLOAT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('auto_linked', 'pending_review', 'confirmed', 'rejected')) DEFAULT 'pending_review',
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    candidates JSONB, -- REQUIRED ADDITION (C5): Top-N candidate matches array [{"plan_activity_id": "...", "activity_code": "...", "activity_description": "...", "score": 0.82}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_matches_extracted ON public.schedule_matches(extracted_activity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_matches_plan ON public.schedule_matches(plan_activity_id);
CREATE INDEX IF NOT EXISTS idx_schedule_matches_status ON public.schedule_matches(status);

-- =============================================================================
-- 6. UNMATCHED_ACTIVITIES (Activities Falling Below Threshold)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.unmatched_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extracted_activity_id UUID NOT NULL UNIQUE REFERENCES public.extracted_activities(id) ON DELETE CASCADE,
    best_score FLOAT,
    resolution TEXT NOT NULL CHECK (resolution IN ('unresolved', 'marked_new_activity', 'manually_linked')) DEFAULT 'unresolved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unmatched_extracted ON public.unmatched_activities(extracted_activity_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_resolution ON public.unmatched_activities(resolution);

-- =============================================================================
-- 7. AUDIT_TRAIL (Immutable Append-Only Log — System Memory)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    related_match_id UUID REFERENCES public.schedule_matches(id) ON DELETE SET NULL,
    related_unmatched_id UUID REFERENCES public.unmatched_activities(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('extracted', 'auto_linked', 'flagged', 'confirmed', 'rejected', 'manually_linked')),
    confidence_score FLOAT,
    actor UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = automated system action
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_match ON public.audit_trail(related_match_id);
CREATE INDEX IF NOT EXISTS idx_audit_unmatched ON public.audit_trail(related_unmatched_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_trail(created_at DESC);

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES & PROJECT ISOLATION (SEC-01 & SEC-02)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user has 'planner' role
CREATE OR REPLACE FUNCTION public.is_planner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'planner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if current user has access to a project (SEC-02)
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        p_project_id = '00000000-0000-0000-0000-000000000001'::uuid
        OR EXISTS (
            SELECT 1 FROM public.project_memberships
            WHERE project_id = p_project_id AND user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles: Authenticated users can read all profiles; users can update own profile (role protected by trigger)
CREATE POLICY "Profiles read by authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PROJECT_MEMBERSHIPS: Users can read own memberships; planners can manage memberships
CREATE POLICY "Project memberships read by authenticated"
    ON public.project_memberships FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_planner());

CREATE POLICY "Project memberships insert by planner"
    ON public.project_memberships FOR INSERT
    TO authenticated
    WITH CHECK (public.is_planner());

CREATE POLICY "Project memberships update by planner"
    ON public.project_memberships FOR UPDATE
    TO authenticated
    USING (public.is_planner())
    WITH CHECK (public.is_planner());

CREATE POLICY "Project memberships delete by planner"
    ON public.project_memberships FOR DELETE
    TO authenticated
    USING (public.is_planner());

-- SCHEDULE_PLAN: Scoped to authorized projects; only planners can insert/update/delete
CREATE POLICY "Schedule plan read by authorized project members"
    ON public.schedule_plan FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Schedule plan insert by planner"
    ON public.schedule_plan FOR INSERT
    TO authenticated
    WITH CHECK (public.is_planner() AND public.has_project_access(project_id));

CREATE POLICY "Schedule plan update by planner"
    ON public.schedule_plan FOR UPDATE
    TO authenticated
    USING (public.is_planner() AND public.has_project_access(project_id))
    WITH CHECK (public.is_planner() AND public.has_project_access(project_id));

CREATE POLICY "Schedule plan delete by planner"
    ON public.schedule_plan FOR DELETE
    TO authenticated
    USING (public.is_planner() AND public.has_project_access(project_id));

-- EXTRACTIONS: Scoped to authorized project members and job uploader
CREATE POLICY "Extractions read by authorized project members"
    ON public.extractions FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id) OR uploaded_by = auth.uid());

CREATE POLICY "Extractions insert by authenticated"
    ON public.extractions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND public.has_project_access(project_id));

-- EXTRACTED_ACTIVITIES: Scoped through parent extraction
CREATE POLICY "Extracted activities read by authorized project members"
    ON public.extracted_activities FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.extractions e
        WHERE e.id = extraction_id AND (public.has_project_access(e.project_id) OR e.uploaded_by = auth.uid())
    ));

-- SCHEDULE_MATCHES: Scoped through associated schedule plan project
CREATE POLICY "Schedule matches read by authorized project members"
    ON public.schedule_matches FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.schedule_plan p
        WHERE p.id = plan_activity_id AND public.has_project_access(p.project_id)
    ));

CREATE POLICY "Schedule matches update by planner"
    ON public.schedule_matches FOR UPDATE
    TO authenticated
    USING (public.is_planner() AND EXISTS (
        SELECT 1 FROM public.schedule_plan p
        WHERE p.id = plan_activity_id AND public.has_project_access(p.project_id)
    ))
    WITH CHECK (public.is_planner() AND EXISTS (
        SELECT 1 FROM public.schedule_plan p
        WHERE p.id = plan_activity_id AND public.has_project_access(p.project_id)
    ));

-- UNMATCHED_ACTIVITIES: Scoped through extracted activities / extractions
CREATE POLICY "Unmatched activities read by authorized project members"
    ON public.unmatched_activities FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.extracted_activities ea
        JOIN public.extractions e ON e.id = ea.extraction_id
        WHERE ea.id = extracted_activity_id AND (public.has_project_access(e.project_id) OR e.uploaded_by = auth.uid())
    ));

CREATE POLICY "Unmatched activities update by planner"
    ON public.unmatched_activities FOR UPDATE
    TO authenticated
    USING (public.is_planner() AND EXISTS (
        SELECT 1 FROM public.extracted_activities ea
        JOIN public.extractions e ON e.id = ea.extraction_id
        WHERE ea.id = extracted_activity_id AND (public.has_project_access(e.project_id) OR e.uploaded_by = auth.uid())
    ));

-- AUDIT_TRAIL: Authenticated can read; authenticated can insert (for manual links); NO UPDATE; NO DELETE (append-only)
CREATE POLICY "Audit trail read by authenticated"
    ON public.audit_trail FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Audit trail insert by authenticated"
    ON public.audit_trail FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Explicitly disallow UPDATE and DELETE on audit trail
-- (No policies created for UPDATE/DELETE, guaranteeing append-only behavior)

-- =============================================================================
-- 6. PERMISSIONS & ROLE GRANTS
-- =============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

