-- =============================================================================
-- Migration: Phase 9.2 Security & Multi-Tenant Hardening (Production Hardened)
-- Date: 2026-09-19
-- Description: Targeted non-destructive migration for live Supabase PostgreSQL.
-- Includes SECURITY DEFINER search_path hardening and least-privilege grants.
-- =============================================================================

-- 1. Create PROJECT_MEMBERSHIPS Table & Indexes (SEC-02)
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

-- 2. Profile Role Self-Promotion Protection Trigger (SEC-01) with Hardened search_path
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If role is being changed and executed in context of an end-user session
    IF (auth.uid() IS NOT NULL OR current_user = 'authenticated') AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Users are not permitted to modify their own role.';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 3. Multi-Tenant Access Verification Functions (SEC-02) with Hardened search_path
CREATE OR REPLACE FUNCTION public.is_planner()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'planner'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN (
        p_project_id = '00000000-0000-0000-0000-000000000001'::uuid
        OR EXISTS (
            SELECT 1 FROM public.project_memberships
            WHERE project_id = p_project_id AND user_id = auth.uid()
        )
    );
END;
$$;

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- 5. Drop legacy RLS policies safely before recreating
DROP POLICY IF EXISTS "Profiles read by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Project memberships read by authenticated" ON public.project_memberships;
DROP POLICY IF EXISTS "Project memberships insert by planner" ON public.project_memberships;
DROP POLICY IF EXISTS "Project memberships update by planner" ON public.project_memberships;
DROP POLICY IF EXISTS "Project memberships delete by planner" ON public.project_memberships;
DROP POLICY IF EXISTS "Schedule plan read by authenticated" ON public.schedule_plan;
DROP POLICY IF EXISTS "Schedule plan read by authorized project members" ON public.schedule_plan;
DROP POLICY IF EXISTS "Schedule plan insert by planner" ON public.schedule_plan;
DROP POLICY IF EXISTS "Schedule plan update by planner" ON public.schedule_plan;
DROP POLICY IF EXISTS "Schedule plan delete by planner" ON public.schedule_plan;
DROP POLICY IF EXISTS "Extractions read by authenticated" ON public.extractions;
DROP POLICY IF EXISTS "Extractions read by authorized project members" ON public.extractions;
DROP POLICY IF EXISTS "Extractions insert by authenticated" ON public.extractions;
DROP POLICY IF EXISTS "Extracted activities read by authenticated" ON public.extracted_activities;
DROP POLICY IF EXISTS "Extracted activities read by authorized project members" ON public.extracted_activities;
DROP POLICY IF EXISTS "Schedule matches read by authenticated" ON public.schedule_matches;
DROP POLICY IF EXISTS "Schedule matches read by authorized project members" ON public.schedule_matches;
DROP POLICY IF EXISTS "Schedule matches update by planner" ON public.schedule_matches;
DROP POLICY IF EXISTS "Unmatched activities read by authenticated" ON public.unmatched_activities;
DROP POLICY IF EXISTS "Unmatched activities read by authorized project members" ON public.unmatched_activities;
DROP POLICY IF EXISTS "Unmatched activities update by planner" ON public.unmatched_activities;
DROP POLICY IF EXISTS "Audit trail read by authenticated" ON public.audit_trail;
DROP POLICY IF EXISTS "Audit trail insert by authenticated" ON public.audit_trail;

-- 6. Apply Hardened Project-Scoped RLS Policies

-- PROFILES
CREATE POLICY "Profiles read by authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PROJECT_MEMBERSHIPS
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

-- SCHEDULE_PLAN
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

-- EXTRACTIONS
CREATE POLICY "Extractions read by authorized project members"
    ON public.extractions FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id) OR uploaded_by = auth.uid());

CREATE POLICY "Extractions insert by authenticated"
    ON public.extractions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND public.has_project_access(project_id));

-- EXTRACTED_ACTIVITIES
CREATE POLICY "Extracted activities read by authorized project members"
    ON public.extracted_activities FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.extractions e
        WHERE e.id = extraction_id AND (public.has_project_access(e.project_id) OR e.uploaded_by = auth.uid())
    ));

-- SCHEDULE_MATCHES
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

-- UNMATCHED_ACTIVITIES
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

-- AUDIT_TRAIL
CREATE POLICY "Audit trail read by authenticated"
    ON public.audit_trail FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Audit trail insert by authenticated"
    ON public.audit_trail FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Least-Privilege Role Permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Authenticated gets standard table CRUD (enforced by RLS), no schema alterations
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Service role and postgres maintain full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 8. Deterministic Project Membership Backfill for Existing Users
INSERT INTO public.project_memberships (project_id, user_id, role)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    p.id,
    p.role
FROM public.profiles p
ON CONFLICT (project_id, user_id) DO NOTHING;
