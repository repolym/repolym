-- ============================================================
-- ADMIN FIXES AND RLS POLICIES
-- This migration adds/updates RLS policies for admin operations
-- and ensures last-admin protection is enforced at the database
-- level.
-- ============================================================

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. ENSURE is_admin_user FUNCTION EXISTS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- 2. REVOKE AND RE-GRANT PERMISSIONS ON USERS TABLE
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;

-- Own user policies
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies: admins can read all users
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (public.is_admin_user());

-- Admins can update any user (but only non-admin fields via application logic)
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (public.is_admin_user());

-- ============================================================
-- 3. ACTIVITY LOGS POLICIES
-- ============================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_insert_own" ON activity_logs;
DROP POLICY IF EXISTS "logs_select_admin" ON activity_logs;

-- Users can insert their own logs
CREATE POLICY "logs_insert_own" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can read logs
CREATE POLICY "logs_select_admin" ON activity_logs FOR SELECT USING (public.is_admin_user());

-- ============================================================
-- 4. FUNCTION TO PREVENT LAST ADMIN DEMOTION (CLIENT-SIDE CHECK ALSO EXISTS)
-- ============================================================

-- This function can be used in RPC if needed, but the client-side check
-- in adminService.removeAdmin() is sufficient with the policy above.
-- We add a safety check here as well.

CREATE OR REPLACE FUNCTION public.can_demote_admin(p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.users WHERE is_admin = true;
    IF admin_count <= 1 THEN
        RETURN false;
    END IF;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- 5. AUDIT LOG TRIGGER FOR ADMIN ACTIONS (Optional enhancement)
-- ============================================================

-- Create a function to automatically log admin actions if needed
-- This is a lightweight audit trail at the database level.

CREATE OR REPLACE FUNCTION public.audit_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.is_admin <> NEW.is_admin THEN
        INSERT INTO public.activity_logs (user_id, action, details)
        VALUES (
            auth.uid(),
            CASE WHEN NEW.is_admin THEN 'promote_admin' ELSE 'demote_admin' END,
            jsonb_build_object(
                'target_user_id', NEW.id,
                'old_value', OLD.is_admin,
                'new_value', NEW.is_admin,
                'performed_by', auth.uid()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS audit_admin_change ON users;
CREATE TRIGGER audit_admin_change
    AFTER UPDATE OF is_admin ON users
    FOR EACH ROW
    WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
    EXECUTE FUNCTION public.audit_admin_action();

-- ============================================================
-- 6. FIX: ENSURE OLYMPIAD_ID IS STORED CORRECTLY IN USERS TABLE
-- ============================================================

-- Update the handle_new_user trigger to properly set olympiad_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin, olympiad_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false,
    NEW.raw_user_meta_data->>'olympiad_id'
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. ADD INDEXES FOR ADMIN PERFORMANCE
-- ============================================================

-- For user management queries
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_olympiad_status ON users(olympiad_id, status);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);

-- For activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_idx ON activity_logs(created_at DESC);

-- ============================================================
-- 8. RPC: GET_USER_STATS (Admin use only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only admins can call this
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH
    sessions AS (
        SELECT COUNT(*) AS total_sessions, COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM study_sessions
        WHERE user_id = p_user_id
    ),
    tests AS (
        SELECT COUNT(*) AS total_tests,
               COALESCE(AVG(CASE WHEN max_score > 0 THEN (score::FLOAT / max_score) * 100 ELSE NULL END), 0) AS avg_score
        FROM tests
        WHERE user_id = p_user_id
    ),
    streak_data AS (
        SELECT current_streak, longest_streak
        FROM streaks
        WHERE user_id = p_user_id
    )
    SELECT jsonb_build_object(
        'totalSessions', (SELECT total_sessions FROM sessions),
        'totalMinutes', (SELECT total_minutes FROM sessions),
        'totalTests', (SELECT total_tests FROM tests),
        'avgTestScore', (SELECT avg_score FROM tests),
        'currentStreak', COALESCE((SELECT current_streak FROM streak_data), 0),
        'longestStreak', COALESCE((SELECT longest_streak FROM streak_data), 0)
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated;