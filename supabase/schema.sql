-- =====================================================================
-- ENTERPRISE RESTAURANT SOP MANAGEMENT SYSTEM
-- Target Platform: Supabase PostgreSQL
-- Architecture:
--   Owner → Office Staff → Karigar / Cashier
--   Accountability Chain: Do → Record → Verify → Follow Up → Escalate → Analyse
--   Task Status: pending | completed | partial | not_completed | not_applicable
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 2. CORE TABLES
-- =====================================================================

-- Branches (Multi-branch support)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    compliance_threshold_warning INT NOT NULL DEFAULT 75,  -- % below this → yellow alert
    compliance_threshold_critical INT NOT NULL DEFAULT 60, -- % below this → red alert
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure UNIQUE constraint on existing DB
ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_name_key;
ALTER TABLE public.branches ADD CONSTRAINT branches_name_key UNIQUE (name);

-- Insert default 16 branches
INSERT INTO public.branches (name, location) VALUES
  ('Himmatnagar', 'Himmatnagar'),
  ('Sola Bridge', 'Sola Bridge'),
  ('Bopal', 'Bopal'),
  ('Mehsana', 'Mehsana'),
  ('Statue of Unity', 'Statue of Unity'),
  ('VS Hospital', 'VS Hospital'),
  ('Fedra', 'Fedra'),
  ('Bhadaj', 'Bhadaj'),
  ('Food Mall', 'Food Mall'),
  ('Gandhinagar', 'Gandhinagar'),
  ('Changodar', 'Changodar'),
  ('Vadodara', 'Vadodara'),
  ('Adalaj', 'Adalaj'),
  ('Makarba', 'Makarba'),
  ('Chotila', 'Chotila'),
  ('Bliss Resort (Mehsana)', 'Bliss Resort')
ON CONFLICT (name) DO NOTHING;

-- Profiles Table (3-Tier: owner → office_staff → karigar/cashier)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'office_staff', 'karigar', 'cashier', 'ground_staff', 'admin', 'user', 'removed')),
    department TEXT NOT NULL DEFAULT 'general' CHECK (department IN ('general', 'kitchen', 'cashier', 'inventory', 'hygiene', 'all')),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add new columns & update role check constraint for existing DBs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'office_staff', 'karigar', 'cashier', 'ground_staff', 'admin', 'user', 'removed'));

-- SOP Task Templates (Master SOP definitions created by Owner/Office Staff)
CREATE TABLE IF NOT EXISTS public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL DEFAULT 'kitchen' CHECK (department IN ('kitchen', 'cashier', 'inventory', 'hygiene', 'general')),
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    assigned_role TEXT NOT NULL DEFAULT 'karigar' CHECK (assigned_role IN ('karigar', 'cashier', 'office_staff', 'all')),
    verifier_role TEXT NOT NULL DEFAULT 'office_staff' CHECK (verifier_role IN ('office_staff', 'owner')),
    escalation_role TEXT NOT NULL DEFAULT 'owner',
    requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    deadline_time TEXT,  -- e.g. '10:00 AM'
    position INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assigned Tasks (Daily task instances generated from templates for each staff member)
CREATE TABLE IF NOT EXISTS public.assigned_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- 5-Level Status System
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'partial', 'not_completed', 'not_applicable')),
    reason TEXT,           -- Required when status is not_completed or partial
    action_required TEXT,  -- What action will be taken
    completed_at TIMESTAMPTZ,
    evidence_url TEXT,     -- Photo evidence URL (for critical tasks)
    submitted_at TIMESTAMPTZ, -- When ground staff marked/submitted the task
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_template_date UNIQUE (template_id, assigned_to, assigned_date)
);

-- Task Verifications (Office Staff verification of submitted tasks)
CREATE TABLE IF NOT EXISTS public.task_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_task_id UUID NOT NULL REFERENCES public.assigned_tasks(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'follow_up', 'escalated')),
    follow_up_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalations (Issues escalated to Owner attention)
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_task_id UUID NOT NULL REFERENCES public.assigned_tasks(id) ON DELETE CASCADE,
    escalated_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    escalated_to UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema cache fix for existing DBs: Alter Foreign Keys & Unique Constraints
ALTER TABLE public.assigned_tasks DROP CONSTRAINT IF EXISTS assigned_tasks_assigned_to_fkey;
ALTER TABLE public.assigned_tasks ADD CONSTRAINT assigned_tasks_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.task_verifications DROP CONSTRAINT IF EXISTS task_verifications_verified_by_fkey;
ALTER TABLE public.task_verifications ADD CONSTRAINT task_verifications_verified_by_fkey 
  FOREIGN KEY (verified_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.escalations DROP CONSTRAINT IF EXISTS escalations_escalated_by_fkey;
ALTER TABLE public.escalations ADD CONSTRAINT escalations_escalated_by_fkey 
  FOREIGN KEY (escalated_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.escalations DROP CONSTRAINT IF EXISTS escalations_escalated_to_fkey;
ALTER TABLE public.escalations ADD CONSTRAINT escalations_escalated_to_fkey 
  FOREIGN KEY (escalated_to) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Ensure UNIQUE constraints exist for ON CONFLICT queries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_template_date') THEN
        ALTER TABLE public.assigned_tasks ADD CONSTRAINT unique_user_template_date UNIQUE (template_id, assigned_to, assigned_date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_task_verification') THEN
        ALTER TABLE public.task_verifications ADD CONSTRAINT unique_task_verification UNIQUE (assigned_task_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_task_escalation') THEN
        ALTER TABLE public.escalations ADD CONSTRAINT unique_task_escalation UNIQUE (assigned_task_id);
    END IF;
END $$;


-- Legacy tables kept for backward compatibility (Days, Tasks, Task Activity, Master Days, Master Tasks)
CREATE TABLE IF NOT EXISTS public.days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_day_number UNIQUE (user_id, day_number)
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    position INT NOT NULL DEFAULT 0,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('completed', 'uncompleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL DEFAULT 'kitchen',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_day_id UUID NOT NULL REFERENCES public.master_days(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL DEFAULT 'kitchen',
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.master_days ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'kitchen';
ALTER TABLE public.master_tasks ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'kitchen';

-- =====================================================================
-- 3. INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_dept ON public.profiles(role, department);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_dept_freq ON public.task_templates(department, frequency);
CREATE INDEX IF NOT EXISTS idx_task_templates_branch ON public.task_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_user_date ON public.assigned_tasks(assigned_to, assigned_date);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_template ON public.assigned_tasks(template_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_status ON public.assigned_tasks(status, assigned_date);
CREATE INDEX IF NOT EXISTS idx_task_verifications_task ON public.task_verifications(assigned_task_id);
CREATE INDEX IF NOT EXISTS idx_escalations_task ON public.escalations(assigned_task_id);
CREATE INDEX IF NOT EXISTS idx_escalations_unresolved ON public.escalations(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_days_user_id_day_num ON public.days(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_tasks_user_day ON public.tasks(user_id, day_id, position);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_created ON public.task_activity(task_id, created_at DESC);

-- =====================================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 5. HELPER FUNCTIONS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_owner()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('owner', 'office_staff', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ground_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role IN ('karigar', 'cashier', 'ground_staff', 'user')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================================================================
-- 6. DROP EXISTING POLICIES (clean slate for idempotent execution)
-- =====================================================================
DROP POLICY IF EXISTS "Allow authenticated users select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile or admins select all" ON public.profiles;
DROP POLICY IF EXISTS "Users select own profile or managers select all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile or manager updates" ON public.profiles;

DROP POLICY IF EXISTS "Users select own days or admins select all" ON public.days;
DROP POLICY IF EXISTS "Users select own days or managers select all" ON public.days;
DROP POLICY IF EXISTS "Users insert own days or admins insert" ON public.days;
DROP POLICY IF EXISTS "Users insert own days or managers insert" ON public.days;
DROP POLICY IF EXISTS "Users update own days or admins update" ON public.days;
DROP POLICY IF EXISTS "Users update own days or managers update" ON public.days;
DROP POLICY IF EXISTS "Users delete own days or admins delete" ON public.days;
DROP POLICY IF EXISTS "Users delete own days or managers delete" ON public.days;

DROP POLICY IF EXISTS "Users select own tasks or admins select all" ON public.tasks;
DROP POLICY IF EXISTS "Users select own tasks or managers select all" ON public.tasks;
DROP POLICY IF EXISTS "Users insert own tasks or admins insert" ON public.tasks;
DROP POLICY IF EXISTS "Users insert own tasks or managers insert" ON public.tasks;
DROP POLICY IF EXISTS "Users update own tasks or admins update" ON public.tasks;
DROP POLICY IF EXISTS "Users update own tasks or managers update" ON public.tasks;
DROP POLICY IF EXISTS "Users delete own tasks or admins delete" ON public.tasks;
DROP POLICY IF EXISTS "Users delete own tasks or managers delete" ON public.tasks;

DROP POLICY IF EXISTS "Users select own task activity or admins select all" ON public.task_activity;
DROP POLICY IF EXISTS "Users select own task activity or managers select all" ON public.task_activity;
DROP POLICY IF EXISTS "Users insert own task activity" ON public.task_activity;

DROP POLICY IF EXISTS "Authenticated users can select master days" ON public.master_days;
DROP POLICY IF EXISTS "Admins can insert master days" ON public.master_days;
DROP POLICY IF EXISTS "Managers can insert master days" ON public.master_days;
DROP POLICY IF EXISTS "Managers can update master days" ON public.master_days;
DROP POLICY IF EXISTS "Managers can delete master days" ON public.master_days;

DROP POLICY IF EXISTS "Authenticated users can select master tasks" ON public.master_tasks;
DROP POLICY IF EXISTS "Admins can insert master tasks" ON public.master_tasks;
DROP POLICY IF EXISTS "Managers can insert master tasks" ON public.master_tasks;
DROP POLICY IF EXISTS "Managers can update master tasks" ON public.master_tasks;
DROP POLICY IF EXISTS "Managers can delete master tasks" ON public.master_tasks;

DROP POLICY IF EXISTS "Anyone can read branches" ON public.branches;
DROP POLICY IF EXISTS "Managers can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Anyone authenticated can read templates" ON public.task_templates;
DROP POLICY IF EXISTS "Managers can manage templates" ON public.task_templates;
DROP POLICY IF EXISTS "Staff see own assigned tasks managers see all" ON public.assigned_tasks;
DROP POLICY IF EXISTS "Staff insert own assigned tasks managers insert all" ON public.assigned_tasks;
DROP POLICY IF EXISTS "Staff update own assigned tasks managers update all" ON public.assigned_tasks;
DROP POLICY IF EXISTS "Managers can manage verifications" ON public.task_verifications;
DROP POLICY IF EXISTS "Managers can see verifications" ON public.task_verifications;
DROP POLICY IF EXISTS "Managers can manage escalations" ON public.escalations;
DROP POLICY IF EXISTS "Managers and owners can see escalations" ON public.escalations;

-- =====================================================================
-- 7. CREATE RLS POLICIES
-- =====================================================================

-- Branches
CREATE POLICY "Anyone can read branches" ON public.branches
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can manage branches" ON public.branches
    FOR ALL USING (public.is_owner());

-- Profiles (Allow authenticated users/managers full management)
CREATE POLICY "Allow authenticated users select profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users delete profiles" ON public.profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Task Templates (SOP definitions)
CREATE POLICY "Anyone authenticated can read templates" ON public.task_templates
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can manage templates" ON public.task_templates
    FOR ALL USING (public.is_manager_or_owner());

-- Assigned Tasks
CREATE POLICY "Staff see own assigned tasks managers see all" ON public.assigned_tasks
    FOR SELECT USING (auth.uid() = assigned_to OR public.is_manager_or_owner());
CREATE POLICY "Staff insert own assigned tasks managers insert all" ON public.assigned_tasks
    FOR INSERT WITH CHECK (auth.uid() = assigned_to OR public.is_manager_or_owner());
CREATE POLICY "Staff update own assigned tasks managers update all" ON public.assigned_tasks
    FOR UPDATE USING (auth.uid() = assigned_to OR public.is_manager_or_owner());

-- Task Verifications (Office Staff & Owner only)
CREATE POLICY "Managers can see verifications" ON public.task_verifications
    FOR SELECT USING (public.is_manager_or_owner());
CREATE POLICY "Managers can manage verifications" ON public.task_verifications
    FOR ALL USING (public.is_manager_or_owner());

-- Escalations (Office Staff & Owner only)
CREATE POLICY "Managers and owners can see escalations" ON public.escalations
    FOR SELECT USING (public.is_manager_or_owner());
CREATE POLICY "Managers can manage escalations" ON public.escalations
    FOR ALL USING (public.is_manager_or_owner());

-- Legacy Days
CREATE POLICY "Users select own days or managers select all" ON public.days
    FOR SELECT USING (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users insert own days or managers insert" ON public.days
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users update own days or managers update" ON public.days
    FOR UPDATE USING (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users delete own days or managers delete" ON public.days
    FOR DELETE USING (auth.uid() = user_id OR public.is_manager_or_owner());

-- Legacy Tasks
CREATE POLICY "Users select own tasks or managers select all" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users insert own tasks or managers insert" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users update own tasks or managers update" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users delete own tasks or managers delete" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id OR public.is_manager_or_owner());

-- Legacy Task Activity
CREATE POLICY "Users select own task activity or managers select all" ON public.task_activity
    FOR SELECT USING (auth.uid() = user_id OR public.is_manager_or_owner());
CREATE POLICY "Users insert own task activity" ON public.task_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Legacy Master Days
CREATE POLICY "Authenticated users can select master days" ON public.master_days
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can insert master days" ON public.master_days
    FOR INSERT WITH CHECK (public.is_manager_or_owner());
CREATE POLICY "Managers can update master days" ON public.master_days
    FOR UPDATE USING (public.is_manager_or_owner());
CREATE POLICY "Managers can delete master days" ON public.master_days
    FOR DELETE USING (public.is_manager_or_owner());

-- Legacy Master Tasks
CREATE POLICY "Authenticated users can select master tasks" ON public.master_tasks
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can insert master tasks" ON public.master_tasks
    FOR INSERT WITH CHECK (public.is_manager_or_owner());
CREATE POLICY "Managers can update master tasks" ON public.master_tasks
    FOR UPDATE USING (public.is_manager_or_owner());
CREATE POLICY "Managers can delete master tasks" ON public.master_tasks
    FOR DELETE USING (public.is_manager_or_owner());

-- =====================================================================
-- 8. RPC FUNCTIONS
-- =====================================================================

-- Sync/generate assigned tasks from templates for all ground staff for today
CREATE OR REPLACE FUNCTION public.sync_sop_tasks_for_today(
    p_frequency TEXT DEFAULT 'daily'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff RECORD;
    v_template RECORD;
    v_synced_count INT := 0;
    v_today DATE := CURRENT_DATE;
    v_branch_id UUID;
BEGIN
    IF NOT public.is_manager_or_owner() THEN
        RAISE EXCEPTION 'Only managers or owners can sync SOP tasks.';
    END IF;

    -- Get default branch if no branch specified
    SELECT id INTO v_branch_id FROM public.branches WHERE is_active = TRUE LIMIT 1;

    -- For each ground staff user
    FOR v_staff IN 
        SELECT user_id, role, department, branch_id
        FROM public.profiles 
        WHERE role IN ('karigar', 'cashier', 'ground_staff', 'user')
    LOOP
        -- For each active template matching this staff's role and frequency
        FOR v_template IN 
            SELECT * FROM public.task_templates
            WHERE is_active = TRUE
              AND frequency = p_frequency
              AND (
                assigned_role = 'all'
                OR assigned_role = v_staff.role
                OR (assigned_role = 'karigar' AND v_staff.role IN ('karigar', 'ground_staff'))
                OR (assigned_role = 'cashier' AND v_staff.role = 'cashier')
              )
            ORDER BY position ASC
        LOOP
            -- Insert assigned task if not already exists for today
            INSERT INTO public.assigned_tasks (
                template_id, assigned_to, branch_id, assigned_date, status
            ) VALUES (
                v_template.id,
                v_staff.user_id,
                COALESCE(v_staff.branch_id, v_branch_id),
                v_today,
                'pending'
            )
            ON CONFLICT (template_id, assigned_to, assigned_date) DO NOTHING;
            
            v_synced_count := v_synced_count + 1;
        END LOOP;
    END LOOP;

    RETURN v_synced_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_sop_tasks_for_today(TEXT) TO authenticated;

-- Get daily compliance stats for a branch
CREATE OR REPLACE FUNCTION public.get_branch_compliance(
    p_branch_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    pending_tasks BIGINT,
    partial_tasks BIGINT,
    not_completed_tasks BIGINT,
    not_applicable_tasks BIGINT,
    compliance_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_branch_id UUID;
BEGIN
    IF p_branch_id IS NULL THEN
        SELECT id INTO v_branch_id FROM public.branches WHERE is_active = TRUE LIMIT 1;
    ELSE
        v_branch_id := p_branch_id;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE at.status = 'completed') AS completed_tasks,
        COUNT(*) FILTER (WHERE at.status = 'pending') AS pending_tasks,
        COUNT(*) FILTER (WHERE at.status = 'partial') AS partial_tasks,
        COUNT(*) FILTER (WHERE at.status = 'not_completed') AS not_completed_tasks,
        COUNT(*) FILTER (WHERE at.status = 'not_applicable') AS not_applicable_tasks,
        CASE 
            WHEN COUNT(*) FILTER (WHERE at.status != 'not_applicable') = 0 THEN 100
            ELSE ROUND(
                (COUNT(*) FILTER (WHERE at.status = 'completed')::NUMERIC / 
                 NULLIF(COUNT(*) FILTER (WHERE at.status != 'not_applicable'), 0)) * 100, 1
            )
        END AS compliance_pct
    FROM public.assigned_tasks at
    WHERE at.assigned_date = p_date
      AND (v_branch_id IS NULL OR at.branch_id = v_branch_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_branch_compliance(UUID, DATE) TO authenticated;

-- Legacy atomic toggle function
CREATE OR REPLACE FUNCTION public.toggle_task_status(
    p_task_id UUID,
    p_completed BOOLEAN
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_task public.tasks%ROWTYPE;
    v_user_id UUID;
    v_action TEXT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request';
    END IF;

    SELECT * INTO v_task
    FROM public.tasks
    WHERE id = p_task_id AND (user_id = v_user_id OR public.is_manager_or_owner());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found or access denied';
    END IF;

    IF p_completed THEN
        v_action := 'completed';
        UPDATE public.tasks
        SET completed = TRUE, completed_at = v_now, updated_at = v_now
        WHERE id = p_task_id
        RETURNING * INTO v_task;
    ELSE
        v_action := 'uncompleted';
        UPDATE public.tasks
        SET completed = FALSE, completed_at = NULL, updated_at = v_now
        WHERE id = p_task_id
        RETURNING * INTO v_task;
    END IF;

    INSERT INTO public.task_activity (task_id, user_id, action, created_at)
    VALUES (p_task_id, v_user_id, v_action, v_now);

    RETURN v_task;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_task_status(UUID, BOOLEAN) TO authenticated;

-- Legacy sync master tasks function
CREATE OR REPLACE FUNCTION public.sync_master_tasks_to_all_users()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_mday RECORD;
    v_mtask RECORD;
    v_user_day_id UUID;
    v_synced_count INT := 0;
BEGIN
    IF NOT public.is_manager_or_owner() THEN
        RAISE EXCEPTION 'Only managers or owners can execute master task sync.';
    END IF;

    FOR v_user IN SELECT user_id AS id, department FROM public.profiles LOOP
        DELETE FROM public.days
        WHERE user_id = v_user.id 
          AND day_number NOT IN (SELECT day_number FROM public.master_days);

        FOR v_mday IN SELECT * FROM public.master_days ORDER BY day_number ASC LOOP
            v_user_day_id := NULL;
            SELECT id INTO v_user_day_id
            FROM public.days
            WHERE user_id = v_user.id AND day_number = v_mday.day_number;

            IF v_user_day_id IS NULL THEN
                INSERT INTO public.days (user_id, day_number, title, description)
                VALUES (v_user.id, v_mday.day_number, v_mday.title, v_mday.description)
                RETURNING id INTO v_user_day_id;
            ELSE
                UPDATE public.days
                SET title = v_mday.title, description = v_mday.description, updated_at = NOW()
                WHERE id = v_user_day_id;
            END IF;

            DELETE FROM public.tasks
            WHERE user_id = v_user.id 
              AND day_id = v_user_day_id 
              AND completed = FALSE 
              AND title NOT IN (SELECT title FROM public.master_tasks WHERE master_day_id = v_mday.id);

            FOR v_mtask IN 
                SELECT * FROM public.master_tasks 
                WHERE master_day_id = v_mday.id 
                ORDER BY position ASC 
            LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM public.tasks
                    WHERE user_id = v_user.id AND day_id = v_user_day_id AND title = v_mtask.title
                ) THEN
                    INSERT INTO public.tasks (user_id, day_id, title, description, position)
                    VALUES (v_user.id, v_user_day_id, v_mtask.title, v_mtask.description, v_mtask.position);
                    v_synced_count := v_synced_count + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

    RETURN v_synced_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_master_tasks_to_all_users() TO authenticated;

-- =====================================================================
-- 9. AUTO PROFILE TRIGGER
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_role TEXT;
    v_dept TEXT := 'general';
    v_branch_id UUID;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    v_role := NEW.raw_user_meta_data->>'role';

    -- First ever user becomes Owner if no profiles exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
        v_role := 'owner';
        v_dept := 'all';
    ELSIF v_role IS NULL OR v_role = '' THEN
        RAISE EXCEPTION 'Role selection is mandatory for user creation.';
    END IF;

    -- Get default branch
    SELECT id INTO v_branch_id FROM public.branches WHERE is_active = TRUE LIMIT 1;

    -- Create Profile
    INSERT INTO public.profiles (user_id, name, email, role, department, branch_id)
    VALUES (NEW.id, v_full_name, NEW.email, v_role, v_dept, v_branch_id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
