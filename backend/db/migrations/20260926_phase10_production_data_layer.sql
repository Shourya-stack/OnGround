-- =============================================================================
-- Migration: Phase 10 — Production Data Layer (Mock Removal)
-- Date: 2026-09-26
-- Description:
--   Non-destructive, idempotent migration that turns the mock-backed demo into a
--   real multi-project application:
--     1. Introduces the missing `projects` table (previously only a hardcoded UUID).
--     2. Backfills a real project row for legacy data, then adds the missing FKs.
--     3. Fixes the schema mismatches that made real writes fail silently
--        (audit_trail action CHECK, missing audit columns).
--     4. Adds `notifications`, `project_invites`, and the `project_stats` view.
--     5. Removes the `has_project_access()` default-project backdoor.
--     6. Blocks role self-escalation via signup metadata.
--     7. Revokes blanket `anon` grants and scopes audit_trail reads by project.
--
--   NO ROWS ARE DELETED. Legacy rows carrying the old hardcoded project id are
--   attached to a real "Legacy Project" row so the new FKs validate cleanly.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legacy sentinel previously hardcoded across the backend and RLS helper.
-- Kept ONLY as the identity of the backfilled project row.
DO $$
DECLARE
    legacy_project_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    PERFORM 1;
END $$;


-- =============================================================================
-- 1. PROJECTS (new — the multi-project backbone)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    client TEXT,
    location TEXT,
    contract_type TEXT,
    budget NUMERIC(18, 2),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Project codes are unique per owner rather than globally, so independent users
-- creating "P-001" do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_unique
    ON public.projects (lower(code), COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_touch_updated_at ON public.projects;
CREATE TRIGGER projects_touch_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- =============================================================================
-- 2. BACKFILL legacy project so the new foreign keys validate
-- =============================================================================
INSERT INTO public.projects (id, name, code, client, location, contract_type, status, start_date, end_date)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Legacy Project (pre-migration data)',
    'LEGACY-001',
    'Internal',
    'Unspecified',
    'EPC',
    'active',
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE + INTERVAL '275 days'
)
ON CONFLICT (id) DO NOTHING;

-- Any row that somehow points at a non-existent project gets attached to legacy.
UPDATE public.schedule_plan sp
   SET project_id = '00000000-0000-0000-0000-000000000001'
 WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = sp.project_id);

UPDATE public.extractions e
   SET project_id = '00000000-0000-0000-0000-000000000001'
 WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = e.project_id);

UPDATE public.project_memberships pm
   SET project_id = '00000000-0000-0000-0000-000000000001'
 WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pm.project_id);


-- =============================================================================
-- 3. Add the missing FOREIGN KEYS (project_id was a bare UUID everywhere)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'schedule_plan_project_id_fkey'
    ) THEN
        ALTER TABLE public.schedule_plan
            ADD CONSTRAINT schedule_plan_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'extractions_project_id_fkey'
    ) THEN
        ALTER TABLE public.extractions
            ADD CONSTRAINT extractions_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_memberships_project_id_fkey'
    ) THEN
        ALTER TABLE public.project_memberships
            ADD CONSTRAINT project_memberships_project_id_fkey
            FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop the hardcoded sentinel defaults: callers must now supply a real project.
ALTER TABLE public.schedule_plan ALTER COLUMN project_id DROP DEFAULT;
ALTER TABLE public.extractions   ALTER COLUMN project_id DROP DEFAULT;


-- =============================================================================
-- 4. Expand role vocabulary to match the application's ExtendedRole
--    (frontend already models planner | supervisor | manager | engineer)
-- =============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('planner', 'supervisor', 'manager', 'engineer'));

ALTER TABLE public.project_memberships DROP CONSTRAINT IF EXISTS project_memberships_role_check;
ALTER TABLE public.project_memberships
    ADD CONSTRAINT project_memberships_role_check
    CHECK (role IN ('planner', 'supervisor', 'manager', 'engineer'));


-- =============================================================================
-- 5. EXTRACTIONS: columns the reports UI needs (names, sizes, archive, errors)
-- =============================================================================
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS file_extension TEXT;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS extractions_touch_updated_at ON public.extractions;
CREATE TRIGGER extractions_touch_updated_at
    BEFORE UPDATE ON public.extractions
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_extractions_archived ON public.extractions(archived_at);


-- =============================================================================
-- 6. UNMATCHED_ACTIVITIES: persist the human-readable reason
--    (backend was writing a `reason` column that never existed — every insert failed)
-- =============================================================================
ALTER TABLE public.unmatched_activities ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.unmatched_activities ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.unmatched_activities ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.unmatched_activities ADD COLUMN IF NOT EXISTS linked_plan_activity_id UUID REFERENCES public.schedule_plan(id) ON DELETE SET NULL;


-- =============================================================================
-- 7. AUDIT_TRAIL: widen action vocabulary + persist the context that was dropped
-- =============================================================================
ALTER TABLE public.audit_trail DROP CONSTRAINT IF EXISTS audit_trail_action_check;
ALTER TABLE public.audit_trail
    ADD CONSTRAINT audit_trail_action_check
    CHECK (action IN (
        'extracted', 'auto_linked', 'flagged', 'confirmed', 'rejected',
        'manually_linked', 'uploaded', 'archived', 'imported',
        'project_created', 'project_updated',
        'member_invited', 'member_removed', 'reassigned'
    ));

ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS previous_state JSONB;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS new_state JSONB;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.audit_trail ADD COLUMN IF NOT EXISTS actor_role TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_project ON public.audit_trail(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_trail(entity_type, entity_id);

-- Backfill project_id for existing audit rows where it can be derived.
UPDATE public.audit_trail a
   SET project_id = sp.project_id
  FROM public.schedule_matches sm
  JOIN public.schedule_plan sp ON sp.id = sm.plan_activity_id
 WHERE a.related_match_id = sm.id
   AND a.project_id IS NULL;


-- =============================================================================
-- 8. NOTIFICATIONS (new — driven by real pipeline events, never seeded fakes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = project-wide
    type TEXT NOT NULL CHECK (type IN ('review', 'variance', 'evidence', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(project_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);


-- =============================================================================
-- 9. PROJECT_INVITES (new — supports TeamMember.status = 'invited')
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.project_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('planner', 'supervisor', 'manager', 'engineer')) DEFAULT 'supervisor',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_project_invites_email ON public.project_invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_project_invites_project ON public.project_invites(project_id);


-- =============================================================================
-- 10. PROJECT_STATS view — counts are DERIVED, never stored
--     (the mock layer stored stale counters; that was a source of wrong numbers)
-- =============================================================================
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
    p.id AS project_id,
    COALESCE(r.reports_count, 0)::BIGINT     AS reports_count,
    COALESCE(a.activities_count, 0)::BIGINT  AS activities_count,
    COALESCE(m.matched_count, 0)::BIGINT     AS matched_count,
    COALESCE(m.review_count, 0)::BIGINT      AS review_count,
    COALESCE(m.rejected_count, 0)::BIGINT    AS rejected_count,
    COALESCE(u.unmatched_count, 0)::BIGINT   AS unmatched_count,
    COALESCE(t.team_size, 0)::BIGINT         AS team_size,
    COALESCE(pl.plan_count, 0)::BIGINT       AS plan_count,
    CASE
        WHEN COALESCE(pl.plan_count, 0) = 0 THEN 0
        ELSE ROUND(
            (COALESCE(m.linked_plan_count, 0)::NUMERIC / pl.plan_count::NUMERIC) * 100.0
        )::INT
    END AS progress
FROM public.projects p
LEFT JOIN (
    SELECT project_id, COUNT(*) AS reports_count
      FROM public.extractions
     WHERE archived_at IS NULL
     GROUP BY project_id
) r ON r.project_id = p.id
LEFT JOIN (
    SELECT e.project_id, COUNT(ea.id) AS activities_count
      FROM public.extractions e
      JOIN public.extracted_activities ea ON ea.extraction_id = e.id
     GROUP BY e.project_id
) a ON a.project_id = p.id
LEFT JOIN (
    SELECT sp.project_id,
           COUNT(*) FILTER (WHERE sm.status IN ('auto_linked', 'confirmed')) AS matched_count,
           COUNT(*) FILTER (WHERE sm.status = 'pending_review')              AS review_count,
           COUNT(*) FILTER (WHERE sm.status = 'rejected')                    AS rejected_count,
           COUNT(DISTINCT sm.plan_activity_id)
               FILTER (WHERE sm.status IN ('auto_linked', 'confirmed'))      AS linked_plan_count
      FROM public.schedule_matches sm
      JOIN public.schedule_plan sp ON sp.id = sm.plan_activity_id
     GROUP BY sp.project_id
) m ON m.project_id = p.id
LEFT JOIN (
    SELECT e.project_id, COUNT(ua.id) AS unmatched_count
      FROM public.unmatched_activities ua
      JOIN public.extracted_activities ea ON ea.id = ua.extracted_activity_id
      JOIN public.extractions e ON e.id = ea.extraction_id
     WHERE ua.resolution = 'unresolved'
     GROUP BY e.project_id
) u ON u.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) AS team_size
      FROM public.project_memberships
     GROUP BY project_id
) t ON t.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) AS plan_count
      FROM public.schedule_plan
     GROUP BY project_id
) pl ON pl.project_id = p.id;


-- =============================================================================
-- 11. has_project_access(): REMOVE the default-project backdoor
--     Previously returned TRUE for '00000000-...-0001' for EVERY authenticated
--     user, which silently defeated multi-tenant isolation.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    IF p_project_id IS NULL OR auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.project_memberships
         WHERE project_id = p_project_id AND user_id = auth.uid()
    );
END;
$$;

-- Planner check, now scoped per project (global role is a fallback default only).
CREATE OR REPLACE FUNCTION public.is_project_planner(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    IF p_project_id IS NULL OR auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.project_memberships
         WHERE project_id = p_project_id
           AND user_id = auth.uid()
           AND role = 'planner'
    );
END;
$$;


-- =============================================================================
-- 12. handle_new_user(): block role self-escalation via signup metadata
--     Previously trusted raw_user_meta_data->>'role', so anyone could sign up
--     as 'planner'. Role is now always 'supervisor' at signup; elevation is a
--     service-side operation.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        'supervisor'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Auto-accept any pending project invitations for this email address.
    INSERT INTO public.project_memberships (project_id, user_id, role)
    SELECT pi.project_id, NEW.id, pi.role
      FROM public.project_invites pi
     WHERE lower(pi.email) = lower(NEW.email)
       AND pi.accepted_at IS NULL
    ON CONFLICT (project_id, user_id) DO NOTHING;

    UPDATE public.project_invites
       SET accepted_at = NOW()
     WHERE lower(email) = lower(NEW.email)
       AND accepted_at IS NULL;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 13. RLS for the new tables
-- =============================================================================
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites   ENABLE ROW LEVEL SECURITY;

-- PROJECTS
DROP POLICY IF EXISTS "Projects read by members" ON public.projects;
CREATE POLICY "Projects read by members"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.has_project_access(id) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Projects insert by authenticated" ON public.projects;
CREATE POLICY "Projects insert by authenticated"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "Projects update by project planner" ON public.projects;
CREATE POLICY "Projects update by project planner"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (public.is_project_planner(id) OR created_by = auth.uid())
    WITH CHECK (public.is_project_planner(id) OR created_by = auth.uid());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications read by project members" ON public.notifications;
CREATE POLICY "Notifications read by project members"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id) AND (user_id IS NULL OR user_id = auth.uid()));

DROP POLICY IF EXISTS "Notifications update own read state" ON public.notifications;
CREATE POLICY "Notifications update own read state"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (public.has_project_access(project_id) AND (user_id IS NULL OR user_id = auth.uid()))
    WITH CHECK (public.has_project_access(project_id) AND (user_id IS NULL OR user_id = auth.uid()));

-- PROJECT_INVITES
DROP POLICY IF EXISTS "Invites read by project planner" ON public.project_invites;
CREATE POLICY "Invites read by project planner"
    ON public.project_invites FOR SELECT
    TO authenticated
    USING (public.is_project_planner(project_id));

DROP POLICY IF EXISTS "Invites managed by project planner" ON public.project_invites;
CREATE POLICY "Invites managed by project planner"
    ON public.project_invites FOR ALL
    TO authenticated
    USING (public.is_project_planner(project_id))
    WITH CHECK (public.is_project_planner(project_id));


-- =============================================================================
-- 14. AUDIT_TRAIL: replace the blanket read policy with project scoping
--     Previously `USING (true)` — every authenticated user could read every
--     project's audit history.
-- =============================================================================
DROP POLICY IF EXISTS "Audit trail read by authenticated" ON public.audit_trail;
CREATE POLICY "Audit trail read by project members"
    ON public.audit_trail FOR SELECT
    TO authenticated
    USING (
        project_id IS NOT NULL AND public.has_project_access(project_id)
    );

DROP POLICY IF EXISTS "Audit trail insert by authenticated" ON public.audit_trail;
CREATE POLICY "Audit trail insert by project members"
    ON public.audit_trail FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND project_id IS NOT NULL
        AND public.has_project_access(project_id)
    );


-- =============================================================================
-- 15. Least-privilege grants — revoke the blanket `anon` access
--     Schema previously ran: GRANT ALL ON ALL TABLES ... TO anon
-- =============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT ON public.project_stats TO authenticated, service_role;

COMMIT;
