-- =============================================
-- سامانه المپیاد - Supabase Database Schema v2.1 (Production-Ready)
-- شامل اصلاحات و توابع مورد نیاز
-- =============================================

-- ========================================
-- 1. جدول کاربران
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    olympiad_id TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    has_completed_baseline_survey BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- 2. جدول دروس
-- ========================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- ========================================
-- 3. جدول جلسات مطالعه (Enhanced)
-- ========================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    plan_id UUID,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
    activities TEXT,
    phone_hours NUMERIC,
    resource TEXT,
    question_count INTEGER,
    question_difficulty TEXT,
    estimated_difficulty NUMERIC,
    question_type TEXT,
    tags TEXT,
    todo_relation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. جدول اهداف
-- ========================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_minutes INTEGER NOT NULL CHECK (target_minutes > 0),
    period TEXT NOT NULL DEFAULT 'week' CHECK (period IN ('day', 'week', 'month')),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. جدول آزمون‌ها
-- ========================================
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    max_score INTEGER DEFAULT 100 CHECK (max_score > 0),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    correct_count INTEGER CHECK (correct_count IS NULL OR correct_count >= 0),
    wrong_count INTEGER CHECK (wrong_count IS NULL OR wrong_count >= 0),
    skipped_count INTEGER CHECK (skipped_count IS NULL OR skipped_count >= 0),
    total_questions INTEGER CHECK (total_questions IS NULL OR total_questions >= 0),
    avg_time_seconds NUMERIC CHECK (avg_time_seconds IS NULL OR avg_time_seconds >= 0)
);

-- ========================================
-- 6. جدول پلن‌ها
-- ========================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'flexible' CHECK (type IN ('daily', 'weekly', 'monthly', 'exam', 'flexible')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    end_date DATE,
    due_date DATE,
    estimated_duration INTEGER,
    dependencies TEXT[],
    recurring JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 7. جدول وظایف
-- ========================================
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    study_resource TEXT,
    question_count INTEGER,
    difficulty TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    deadline DATE,
    estimated_time INTEGER,
    actual_time INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 8. جدول Streaks
-- ========================================
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 9. جدول متریک‌های روزانه
-- ========================================
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours NUMERIC,
    bedtime TEXT,
    wake_time TEXT,
    phone_usage_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ========================================
-- 10. جدول نظرسنجی پایه
-- ========================================
CREATE TABLE IF NOT EXISTS baseline_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    survey_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 11. جدول لاگ‌های فعالیت
-- ========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes (Optimized)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_olympiad_admin ON users(olympiad_id, is_admin);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_sessions_plan ON study_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON goals(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_date ON tests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tests_subject ON tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_todos_subject ON todos(subject_id);
CREATE INDEX IF NOT EXISTS idx_todos_session ON todos(session_id);
CREATE INDEX IF NOT EXISTS idx_todos_plan ON todos(plan_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);

-- ========================================
-- Functions - Create User Profile
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- Triggers
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- RLS Policies
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Users policies
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (public.is_admin_user());
DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (public.is_admin_user());

-- Subjects policies
DROP POLICY IF EXISTS "subjects_select_own" ON subjects;
CREATE POLICY "subjects_select_own" ON subjects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subjects_insert_own" ON subjects;
CREATE POLICY "subjects_insert_own" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "subjects_update_own" ON subjects;
CREATE POLICY "subjects_update_own" ON subjects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subjects_delete_own" ON subjects;
CREATE POLICY "subjects_delete_own" ON subjects FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subjects_select_admin" ON subjects;
CREATE POLICY "subjects_select_admin" ON subjects FOR SELECT USING (public.is_admin_user());
DROP POLICY IF EXISTS "subjects_select_public_anon" ON subjects;
CREATE POLICY "subjects_select_public_anon" ON subjects FOR SELECT TO anon USING (true);

-- Study sessions policies
DROP POLICY IF EXISTS "sessions_select_own" ON study_sessions;
CREATE POLICY "sessions_select_own" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_insert_own" ON study_sessions;
CREATE POLICY "sessions_insert_own" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_update_own" ON study_sessions;
CREATE POLICY "sessions_update_own" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_delete_own" ON study_sessions;
CREATE POLICY "sessions_delete_own" ON study_sessions FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_select_admin" ON study_sessions;
CREATE POLICY "sessions_select_admin" ON study_sessions FOR SELECT USING (public.is_admin_user());
DROP POLICY IF EXISTS "sessions_select_public_anon" ON study_sessions;
CREATE POLICY "sessions_select_public_anon" ON study_sessions FOR SELECT TO anon USING (true);

-- Goals policies
DROP POLICY IF EXISTS "goals_select_own" ON goals;
CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "goals_insert_own" ON goals;
CREATE POLICY "goals_insert_own" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "goals_update_own" ON goals;
CREATE POLICY "goals_update_own" ON goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "goals_delete_own" ON goals;
CREATE POLICY "goals_delete_own" ON goals FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "goals_select_admin" ON goals;
CREATE POLICY "goals_select_admin" ON goals FOR SELECT USING (public.is_admin_user());

-- Tests policies
DROP POLICY IF EXISTS "tests_select_own" ON tests;
CREATE POLICY "tests_select_own" ON tests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tests_insert_own" ON tests;
CREATE POLICY "tests_insert_own" ON tests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tests_update_own" ON tests;
CREATE POLICY "tests_update_own" ON tests FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tests_delete_own" ON tests;
CREATE POLICY "tests_delete_own" ON tests FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "tests_select_admin" ON tests;
CREATE POLICY "tests_select_admin" ON tests FOR SELECT USING (public.is_admin_user());

-- Plans policies
DROP POLICY IF EXISTS "plans_select_own" ON plans;
CREATE POLICY "plans_select_own" ON plans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "plans_insert_own" ON plans;
CREATE POLICY "plans_insert_own" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "plans_update_own" ON plans;
CREATE POLICY "plans_update_own" ON plans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "plans_delete_own" ON plans;
CREATE POLICY "plans_delete_own" ON plans FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "plans_select_admin" ON plans;
CREATE POLICY "plans_select_admin" ON plans FOR SELECT USING (public.is_admin_user());

-- Todos policies
DROP POLICY IF EXISTS "todos_select_own" ON todos;
CREATE POLICY "todos_select_own" ON todos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_insert_own" ON todos;
CREATE POLICY "todos_insert_own" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_update_own" ON todos;
CREATE POLICY "todos_update_own" ON todos FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_delete_own" ON todos;
CREATE POLICY "todos_delete_own" ON todos FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "todos_select_admin" ON todos;
CREATE POLICY "todos_select_admin" ON todos FOR SELECT USING (public.is_admin_user());

-- Streaks policies
DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
CREATE POLICY "streaks_select_own" ON streaks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
CREATE POLICY "streaks_update_own" ON streaks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
CREATE POLICY "streaks_insert_own" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_select_admin" ON streaks;
CREATE POLICY "streaks_select_admin" ON streaks FOR SELECT USING (public.is_admin_user());

-- Daily metrics policies
DROP POLICY IF EXISTS "daily_metrics_select_own" ON daily_metrics;
CREATE POLICY "daily_metrics_select_own" ON daily_metrics FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_metrics_insert_own" ON daily_metrics;
CREATE POLICY "daily_metrics_insert_own" ON daily_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_metrics_update_own" ON daily_metrics;
CREATE POLICY "daily_metrics_update_own" ON daily_metrics FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_metrics_delete_own" ON daily_metrics;
CREATE POLICY "daily_metrics_delete_own" ON daily_metrics FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_metrics_select_admin" ON daily_metrics;
CREATE POLICY "daily_metrics_select_admin" ON daily_metrics FOR SELECT USING (public.is_admin_user());

-- Baseline surveys policies
DROP POLICY IF EXISTS "baseline_select_own" ON baseline_surveys;
CREATE POLICY "baseline_select_own" ON baseline_surveys FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "baseline_insert_own" ON baseline_surveys;
CREATE POLICY "baseline_insert_own" ON baseline_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "baseline_select_admin" ON baseline_surveys;
CREATE POLICY "baseline_select_admin" ON baseline_surveys FOR SELECT USING (public.is_admin_user());

-- Activity logs policies
DROP POLICY IF EXISTS "logs_insert_own" ON activity_logs;
CREATE POLICY "logs_insert_own" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "logs_select_admin" ON activity_logs;
CREATE POLICY "logs_select_admin" ON activity_logs FOR SELECT USING (public.is_admin_user());

-- ========================================
-- RPC: get_public_study_profile
-- ========================================
CREATE OR REPLACE FUNCTION public.get_public_study_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'sessions', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ss.id,
                    'date', ss.date,
                    'duration_minutes', ss.duration_minutes,
                    'subject', CASE WHEN sub.id IS NOT NULL THEN
                        jsonb_build_object('id', sub.id, 'name', sub.name, 'color', sub.color)
                    ELSE NULL END
                ) ORDER BY ss.date DESC
            ),
            '[]'::jsonb
        )
    ) INTO result
    FROM study_sessions ss
    LEFT JOIN subjects sub ON ss.subject_id = sub.id
    WHERE ss.user_id = p_user_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_study_profile TO anon, authenticated;

-- =============================================
-- Migration 002: Performance + Analytics merge
-- =============================================

CREATE OR REPLACE FUNCTION public.get_analytics(
    p_user_id UUID,
    p_today DATE,
    p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH
    sessions_last_30 AS (
        SELECT date, duration_minutes, subject_id
        FROM study_sessions
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '30 days')::DATE
          AND date <= p_today
    ),
    daily_totals AS (
        SELECT date, COALESCE(SUM(duration_minutes), 0) AS minutes
        FROM sessions_last_30
        GROUP BY date
    ),
    active_days_30 AS (SELECT COUNT(DISTINCT date) FROM sessions_last_30),
    total_minutes_30 AS (SELECT COALESCE(SUM(duration_minutes), 0) FROM sessions_last_30),
    all_sessions AS (
        SELECT date
        FROM study_sessions
        WHERE user_id = p_user_id
        ORDER BY date
    ),
    consecutive AS (
        SELECT date,
               date - LAG(date) OVER (ORDER BY date) AS gap
        FROM all_sessions
    ),
    streak_groups AS (
        SELECT date,
               SUM(CASE WHEN gap = 1 THEN 0 ELSE 1 END) OVER (ORDER BY date) AS grp
        FROM consecutive
    ),
    streak_lengths AS (
        SELECT grp, COUNT(*) AS len
        FROM streak_groups
        GROUP BY grp
    ),
    longest_streak_val AS (SELECT COALESCE(MAX(len), 0) FROM streak_lengths),
    current_streak_val AS (
        SELECT COALESCE(
            (SELECT len FROM streak_lengths WHERE grp = (SELECT MAX(grp) FROM streak_groups)),
            0
        )
    ),
    best_day AS (
        SELECT date, minutes
        FROM daily_totals
        ORDER BY minutes DESC
        LIMIT 1
    ),
    worst_day AS (
        SELECT date, minutes
        FROM daily_totals
        ORDER BY minutes ASC
        LIMIT 1
    ),
    weekday_avg AS (
        SELECT EXTRACT(DOW FROM date) AS dow, AVG(minutes) AS avg_minutes
        FROM daily_totals
        GROUP BY EXTRACT(DOW FROM date)
    ),
    best_weekday AS (
        SELECT dow
        FROM weekday_avg
        ORDER BY avg_minutes DESC
        LIMIT 1
    ),
    subject_dist AS (
        SELECT s.subject_id, sub.name, sub.color,
               SUM(s.duration_minutes) AS minutes
        FROM study_sessions s
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.user_id = p_user_id
          AND s.date >= (p_today - INTERVAL '90 days')::DATE
        GROUP BY s.subject_id, sub.name, sub.color
    ),
    total_subject_minutes AS (SELECT COALESCE(SUM(minutes), 0) FROM subject_dist),
    subject_dist_percent AS (
        SELECT subject_id, name, color, minutes,
               CASE WHEN (SELECT * FROM total_subject_minutes) > 0
                    THEN (minutes / (SELECT * FROM total_subject_minutes)) * 100
                    ELSE 0 END AS percent
        FROM subject_dist
    ),
    metrics_last_30 AS (
        SELECT sleep_hours, phone_usage_minutes
        FROM daily_metrics
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '30 days')::DATE
          AND date <= p_today
    ),
    sleep_stats AS (
        SELECT AVG(sleep_hours) AS avg_sleep,
               MIN(sleep_hours) AS min_sleep,
               MAX(sleep_hours) AS max_sleep,
               COUNT(*) AS logged_days
        FROM metrics_last_30
        WHERE sleep_hours IS NOT NULL
    ),
    phone_stats AS (
        SELECT AVG(phone_usage_minutes) AS avg_phone,
               MIN(phone_usage_minutes) AS min_phone,
               MAX(phone_usage_minutes) AS max_phone,
               COUNT(*) AS logged_days
        FROM metrics_last_30
        WHERE phone_usage_minutes IS NOT NULL
    ),
    baseline_active_days AS (
        SELECT date, SUM(duration_minutes) AS minutes
        FROM sessions_last_30
        GROUP BY date
        HAVING SUM(duration_minutes) > 0
    ),
    baseline_stats AS (
        SELECT AVG(minutes) AS avg_minutes,
               COUNT(*) AS days
        FROM baseline_active_days
    ),
    current_week AS (
        SELECT date, SUM(duration_minutes) AS minutes
        FROM study_sessions
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '7 days')::DATE
          AND date <= p_today
        GROUP BY date
    ),
    current_week_avg AS (
        SELECT AVG(minutes) AS avg_minutes
        FROM current_week
    ),
    moving_avg_days AS (
        SELECT d::DATE AS date
        FROM generate_series((p_today - INTERVAL '29 days')::DATE, p_today, '1 day'::INTERVAL) AS d
    ),
    moving_avg_data AS (
        SELECT md.date,
               COALESCE(dt.minutes, 0) AS minutes,
               AVG(COALESCE(dt.minutes, 0)) OVER (ORDER BY md.date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
        FROM moving_avg_days md
        LEFT JOIN daily_totals dt ON md.date = dt.date
    ),
    consistency_score AS (SELECT COALESCE((SELECT * FROM active_days_30)::FLOAT / 30 * 100, 0)),
    goal_completion_score AS (
        SELECT COALESCE(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END), 0)
        FROM goals
        WHERE user_id = p_user_id AND start_date >= (p_today - INTERVAL '30 days')::DATE
    ),
    test_performance_score AS (
        SELECT COALESCE(AVG((score / max_score) * 100), 0)
        FROM tests
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '30 days')::DATE
    ),
    effective_study_time_score AS (
        SELECT COALESCE(AVG(duration_minutes), 0) / 120 * 100
        FROM sessions_last_30
    ),
    productivity_score_calc AS (
        SELECT (0.3 * (SELECT * FROM consistency_score) +
                0.2 * (SELECT * FROM goal_completion_score) +
                0.3 * (SELECT * FROM test_performance_score) +
                0.2 * (SELECT * FROM effective_study_time_score)) AS score
    ),
    sleep_consistency_score AS (
        SELECT CASE WHEN (SELECT avg_sleep FROM sleep_stats) IS NOT NULL
                    THEN (1 - ((SELECT max_sleep FROM sleep_stats) - (SELECT min_sleep FROM sleep_stats)) / 24) * 100
                    ELSE 0 END
    ),
    gap_recovery_score AS (SELECT 0),
    phone_usage_impact_score AS (
        SELECT CASE WHEN (SELECT avg_phone FROM phone_stats) IS NOT NULL
                    THEN (1 - (SELECT avg_phone FROM phone_stats) / 1440) * 100
                    ELSE 0 END
    ),
    recovery_score_calc AS (
        SELECT (0.4 * (SELECT * FROM sleep_consistency_score) +
                0.3 * (SELECT * FROM gap_recovery_score) +
                0.3 * (SELECT * FROM phone_usage_impact_score)) AS score
    ),
    baseline_avg AS (SELECT avg_minutes FROM baseline_stats),
    current_avg AS (SELECT avg_minutes FROM current_week_avg),
    progress_direction AS (
        SELECT CASE
            WHEN (SELECT avg_minutes FROM current_avg) IS NULL OR (SELECT avg_minutes FROM baseline_avg) IS NULL THEN 'insufficient_data'::TEXT
            WHEN (SELECT avg_minutes FROM current_avg) > (SELECT avg_minutes FROM baseline_avg) * 1.1 THEN 'improving'
            WHEN (SELECT avg_minutes FROM current_avg) < (SELECT avg_minutes FROM baseline_avg) * 0.9 THEN 'declining'
            ELSE 'stable'
        END AS direction,
        CASE
            WHEN (SELECT avg_minutes FROM baseline_avg) IS NOT NULL AND (SELECT avg_minutes FROM baseline_avg) > 0
            THEN ((SELECT avg_minutes FROM current_avg) - (SELECT avg_minutes FROM baseline_avg)) / (SELECT avg_minutes FROM baseline_avg) * 100
            ELSE NULL
        END AS percent_change
    ),

    -- ===== NEW: solved-test performance (correct / wrong / skipped / time) =====
    tests_last_30 AS (
        SELECT * FROM tests
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '30 days')::DATE
          AND date <= p_today
    ),
    tests_prev_30 AS (
        SELECT * FROM tests
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '60 days')::DATE
          AND date < (p_today - INTERVAL '30 days')::DATE
    ),
    test_stats_calc AS (
        SELECT
            COUNT(*) AS total_tests,
            COALESCE(SUM(total_questions), 0) AS sum_total_questions,
            COALESCE(SUM(correct_count), 0) AS sum_correct,
            COALESCE(SUM(wrong_count), 0) AS sum_wrong,
            COALESCE(SUM(skipped_count), 0) AS sum_skipped,
            AVG(avg_time_seconds) AS avg_time_seconds,
            AVG(CASE WHEN max_score > 0 THEN (score::FLOAT / max_score) * 100 ELSE NULL END) AS avg_score_percent
        FROM tests_last_30
    ),
    test_stats_prev_calc AS (
        SELECT AVG(CASE WHEN max_score > 0 THEN (score::FLOAT / max_score) * 100 ELSE NULL END) AS avg_score_percent
        FROM tests_prev_30
    ),
    test_stats_final AS (
        SELECT
            (SELECT total_tests FROM test_stats_calc) AS total_tests,
            COALESCE((SELECT avg_score_percent FROM test_stats_calc), 0) AS accuracy_percent,
            CASE WHEN (SELECT sum_total_questions FROM test_stats_calc) > 0
                 THEN (SELECT sum_correct FROM test_stats_calc)::FLOAT / (SELECT sum_total_questions FROM test_stats_calc) * 100
                 ELSE COALESCE((SELECT avg_score_percent FROM test_stats_calc), 0)
            END AS correct_percent,
            CASE WHEN (SELECT sum_total_questions FROM test_stats_calc) > 0
                 THEN (SELECT sum_wrong FROM test_stats_calc)::FLOAT / (SELECT sum_total_questions FROM test_stats_calc) * 100
                 ELSE GREATEST(0, 100 - COALESCE((SELECT avg_score_percent FROM test_stats_calc), 0))
            END AS wrong_percent,
            CASE WHEN (SELECT sum_total_questions FROM test_stats_calc) > 0
                 THEN (SELECT sum_skipped FROM test_stats_calc)::FLOAT / (SELECT sum_total_questions FROM test_stats_calc) * 100
                 ELSE 0
            END AS skipped_percent,
            (SELECT avg_time_seconds FROM test_stats_calc) AS avg_time_seconds,
            (SELECT avg_score_percent FROM test_stats_prev_calc) AS prev_accuracy_percent
    ),
    test_trend AS (
        SELECT CASE
            WHEN (SELECT prev_accuracy_percent FROM test_stats_final) IS NULL THEN 'insufficient_data'
            WHEN (SELECT accuracy_percent FROM test_stats_final) > (SELECT prev_accuracy_percent FROM test_stats_final) + 2 THEN 'up'
            WHEN (SELECT accuracy_percent FROM test_stats_final) < (SELECT prev_accuracy_percent FROM test_stats_final) - 2 THEN 'down'
            ELSE 'stable'
        END AS direction
    ),

    -- ===== NEW: per-subject test accuracy (radar / topic mastery / weakness+strength) =====
    subject_test_stats_calc AS (
        SELECT t.subject_id,
               COALESCE(sub.name, 'بدون درس') AS name,
               COALESCE(sub.color, '#94a3b8') AS color,
               COUNT(*) AS tests_count,
               AVG(CASE WHEN t.max_score > 0 THEN (t.score::FLOAT / t.max_score) * 100 ELSE NULL END) AS avg_accuracy_percent
        FROM tests t
        LEFT JOIN subjects sub ON t.subject_id = sub.id
        WHERE t.user_id = p_user_id
          AND t.date >= (p_today - INTERVAL '90 days')::DATE
        GROUP BY t.subject_id, sub.name, sub.color
    ),

    -- ===== NEW: difficulty distribution (from study_sessions.question_difficulty) =====
    difficulty_raw AS (
        SELECT LOWER(TRIM(question_difficulty)) AS difficulty,
               duration_minutes
        FROM study_sessions
        WHERE user_id = p_user_id
          AND date >= (p_today - INTERVAL '90 days')::DATE
          AND question_difficulty IS NOT NULL
          AND TRIM(question_difficulty) <> ''
    ),
    difficulty_agg AS (
        SELECT difficulty, COUNT(*) AS sessions_count, SUM(duration_minutes) AS minutes
        FROM difficulty_raw
        GROUP BY difficulty
    ),
    difficulty_total AS (SELECT COALESCE(SUM(sessions_count), 0) AS total FROM difficulty_agg),

    -- ===== NEW: weekly trend (last 8 weeks, zero-filled) =====
    week_buckets AS (
        SELECT date_trunc('week', d)::DATE AS week_start
        FROM generate_series((p_today - INTERVAL '55 days')::DATE, p_today, '7 days'::INTERVAL) AS d
        GROUP BY 1
    ),
    weekly_minutes AS (
        SELECT date_trunc('week', date)::DATE AS week_start, SUM(duration_minutes) AS minutes
        FROM study_sessions
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '56 days')::DATE
        GROUP BY 1
    ),
    weekly_tests AS (
        SELECT date_trunc('week', date)::DATE AS week_start,
               COUNT(*) AS tests_count,
               AVG(CASE WHEN max_score > 0 THEN (score::FLOAT / max_score) * 100 ELSE NULL END) AS avg_accuracy_percent
        FROM tests
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '56 days')::DATE
        GROUP BY 1
    ),
    weekly_trend_data AS (
        SELECT wb.week_start,
               COALESCE(wm.minutes, 0) AS minutes,
               COALESCE(wt.tests_count, 0) AS tests_count,
               COALESCE(wt.avg_accuracy_percent, 0) AS avg_accuracy_percent
        FROM week_buckets wb
        LEFT JOIN weekly_minutes wm ON wb.week_start = wm.week_start
        LEFT JOIN weekly_tests wt ON wb.week_start = wt.week_start
        ORDER BY wb.week_start
    ),

    -- ===== NEW: monthly trend (last 6 months, zero-filled) =====
    month_buckets AS (
        SELECT date_trunc('month', d)::DATE AS month_start
        FROM generate_series((p_today - INTERVAL '5 months')::DATE, p_today, '1 month'::INTERVAL) AS d
        GROUP BY 1
    ),
    monthly_minutes AS (
        SELECT date_trunc('month', date)::DATE AS month_start, SUM(duration_minutes) AS minutes
        FROM study_sessions
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '5 months')::DATE
        GROUP BY 1
    ),
    monthly_tests AS (
        SELECT date_trunc('month', date)::DATE AS month_start,
               COUNT(*) AS tests_count,
               AVG(CASE WHEN max_score > 0 THEN (score::FLOAT / max_score) * 100 ELSE NULL END) AS avg_accuracy_percent
        FROM tests
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '5 months')::DATE
        GROUP BY 1
    ),
    monthly_trend_data AS (
        SELECT mb.month_start,
               COALESCE(mm.minutes, 0) AS minutes,
               COALESCE(mt.tests_count, 0) AS tests_count,
               COALESCE(mt.avg_accuracy_percent, 0) AS avg_accuracy_percent
        FROM month_buckets mb
        LEFT JOIN monthly_minutes mm ON mb.month_start = mm.month_start
        LEFT JOIN monthly_tests mt ON mb.month_start = mt.month_start
        ORDER BY mb.month_start
    )

    SELECT jsonb_build_object(
        'productivity_score', jsonb_build_object(
            'productivity_score', (SELECT score FROM productivity_score_calc),
            'components', jsonb_build_object(
                'consistency', (SELECT * FROM consistency_score),
                'goal_completion', (SELECT * FROM goal_completion_score),
                'test_performance', (SELECT * FROM test_performance_score),
                'effective_study_time', (SELECT * FROM effective_study_time_score)
            )
        ),
        'recovery_score', jsonb_build_object(
            'recovery_score', (SELECT score FROM recovery_score_calc),
            'components', jsonb_build_object(
                'sleep_consistency', (SELECT * FROM sleep_consistency_score),
                'gap_recovery', (SELECT * FROM gap_recovery_score),
                'phone_usage_impact', (SELECT * FROM phone_usage_impact_score)
            )
        ),
        'study_streak', jsonb_build_object(
            'current_streak', (SELECT * FROM current_streak_val),
            'longest_streak', (SELECT * FROM longest_streak_val),
            'last_study_date', (SELECT MAX(date) FROM all_sessions)
        ),
        'study_consistency', jsonb_build_object(
            'consistency_score', (SELECT (active_days_30::FLOAT / 30) * 100 FROM active_days_30),
            'active_days', (SELECT * FROM active_days_30),
            'total_days', 30,
            'target_active_days', 20
        ),
        'study_trend', jsonb_build_object(
            'direction', 'stable',
            'slope', 0,
            'average_change_per_day', 0,
            'period_days', 30
        ),
        'moving_average', (SELECT jsonb_agg(jsonb_build_object('date', date, 'minutes', minutes, 'moving_avg_7d', moving_avg_7d)) FROM moving_avg_data),
        'best_worst_day', jsonb_build_object(
            'best_date', (SELECT date FROM best_day),
            'best_date_minutes', (SELECT minutes FROM best_day),
            'worst_date', (SELECT date FROM worst_day),
            'worst_date_minutes', (SELECT minutes FROM worst_day),
            'best_weekday_iso', (SELECT dow FROM best_weekday),
            'weekday_averages', (SELECT jsonb_object_agg(dow, avg_minutes) FROM weekday_avg)
        ),
        'subject_distribution', (SELECT jsonb_agg(jsonb_build_object('subject_id', subject_id, 'subject_name', name, 'color', color, 'minutes', minutes, 'percent', percent)) FROM subject_dist_percent),
        'sleep_statistics', jsonb_build_object(
            'avg_sleep_hours', (SELECT avg_sleep FROM sleep_stats),
            'min_sleep_hours', (SELECT min_sleep FROM sleep_stats),
            'max_sleep_hours', (SELECT max_sleep FROM sleep_stats),
            'logged_days', (SELECT logged_days FROM sleep_stats)
        ),
        'phone_usage_statistics', jsonb_build_object(
            'avg_phone_minutes', (SELECT avg_phone FROM phone_stats),
            'min_phone_minutes', (SELECT min_phone FROM phone_stats),
            'max_phone_minutes', (SELECT max_phone FROM phone_stats),
            'logged_days', (SELECT logged_days FROM phone_stats)
        ),
        'personal_baseline', jsonb_build_object(
            'baseline_avg_minutes', (SELECT COALESCE(avg_minutes, 0) FROM baseline_stats),
            'baseline_avg_minutes_active_days', (SELECT COALESCE(avg_minutes, 0) FROM baseline_stats),
            'baseline_days', (SELECT COALESCE(days, 0) FROM baseline_stats)
        ),
        'progress_trend', jsonb_build_object(
            'direction', (SELECT direction FROM progress_direction),
            'percent_change_vs_baseline', (SELECT percent_change FROM progress_direction),
            'current_avg_minutes', (SELECT avg_minutes FROM current_week_avg)
        ),
        'test_stats', jsonb_build_object(
            'total_tests', (SELECT total_tests FROM test_stats_final),
            'accuracy_percent', ROUND((SELECT accuracy_percent FROM test_stats_final)::NUMERIC, 1),
            'correct_percent', ROUND((SELECT correct_percent FROM test_stats_final)::NUMERIC, 1),
            'wrong_percent', ROUND((SELECT wrong_percent FROM test_stats_final)::NUMERIC, 1),
            'skipped_percent', ROUND((SELECT skipped_percent FROM test_stats_final)::NUMERIC, 1),
            'avg_time_seconds', (SELECT avg_time_seconds FROM test_stats_final),
            'trend', (SELECT direction FROM test_trend)
        ),
        'subject_test_stats', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'subject_id', subject_id,
            'subject_name', name,
            'color', color,
            'tests_count', tests_count,
            'avg_accuracy_percent', ROUND(COALESCE(avg_accuracy_percent, 0)::NUMERIC, 1)
        )), '[]'::jsonb) FROM subject_test_stats_calc),
        'difficulty_distribution', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'difficulty', difficulty,
            'sessions_count', sessions_count,
            'minutes', minutes,
            'percent', CASE WHEN (SELECT total FROM difficulty_total) > 0
                            THEN ROUND((sessions_count::NUMERIC / (SELECT total FROM difficulty_total)) * 100, 1)
                            ELSE 0 END
        )), '[]'::jsonb) FROM difficulty_agg),
        'weekly_trend', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'week_start', week_start,
            'minutes', minutes,
            'tests_count', tests_count,
            'avg_accuracy_percent', ROUND(avg_accuracy_percent::NUMERIC, 1)
        )), '[]'::jsonb) FROM weekly_trend_data),
        'monthly_trend', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'month', month_start,
            'minutes', minutes,
            'tests_count', tests_count,
            'avg_accuracy_percent', ROUND(avg_accuracy_percent::NUMERIC, 1)
        )), '[]'::jsonb) FROM monthly_trend_data),
        'date_range', jsonb_build_object(
            'start_date', (p_today - INTERVAL '30 days')::DATE,
            'end_date', p_today,
            'range_days', 30
        ),
        'generated_at', NOW()
    ) INTO result;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics TO authenticated;

-- ========================================
-- RPC: get_olympiad_leaderboard
-- ========================================
CREATE OR REPLACE FUNCTION public.get_olympiad_leaderboard(
    p_olympiad_id TEXT,
    p_today DATE,
    p_limit INTEGER DEFAULT 50,
    p_window_type TEXT DEFAULT 'month'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    window_start DATE;
BEGIN
    IF p_window_type = 'today' THEN
        window_start := p_today;
    ELSIF p_window_type = 'week' THEN
        window_start := p_today - INTERVAL '7 days';
    ELSIF p_window_type = 'month' THEN
        window_start := p_today - INTERVAL '30 days';
    ELSE
        window_start := '2000-01-01'::DATE;
    END IF;

    WITH
    users_in_olympiad AS (
        SELECT id, name
        FROM users
        WHERE (p_olympiad_id IS NULL OR olympiad_id = p_olympiad_id)
          AND is_admin = false
    ),
    sessions_window AS (
        SELECT user_id, duration_minutes, date
        FROM study_sessions
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
          AND date >= window_start
          AND date <= p_today
    ),
    user_study AS (
        SELECT user_id,
               COALESCE(SUM(duration_minutes), 0) AS total_minutes,
               COUNT(DISTINCT date) AS active_days
        FROM sessions_window
        GROUP BY user_id
    ),
    tests_window AS (
        SELECT user_id, (score / max_score) * 100 AS pct_score
        FROM tests
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
          AND date >= window_start
          AND date <= p_today
          AND max_score > 0
    ),
    user_tests AS (
        SELECT user_id, COALESCE(AVG(pct_score), 0) AS avg_test_score
        FROM tests_window
        GROUP BY user_id
    ),
    all_sessions AS (
        SELECT user_id, date
        FROM study_sessions
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
        ORDER BY user_id, date
    ),
    streak_calc AS (
        SELECT user_id, date,
               date - LAG(date) OVER (PARTITION BY user_id ORDER BY date) AS gap
        FROM all_sessions
    ),
    streak_groups AS (
        SELECT user_id, date,
               SUM(CASE WHEN gap = 1 THEN 0 ELSE 1 END) OVER (PARTITION BY user_id ORDER BY date) AS grp
        FROM streak_calc
    ),
    streak_lengths AS (
        SELECT user_id, grp, COUNT(*) AS len
        FROM streak_groups
        GROUP BY user_id, grp
    ),
    user_best_streak AS (
        SELECT user_id, COALESCE(MAX(len), 0) AS best_streak
        FROM streak_lengths
        GROUP BY user_id
    ),
    combined AS (
        SELECT u.id AS user_id,
               u.name,
               COALESCE(us.total_minutes, 0) AS total_minutes_30,
               COALESCE(us.active_days, 0) AS active_days_30,
               COALESCE(ubs.best_streak, 0) AS best_streak,
               COALESCE(ut.avg_test_score, 0) AS avg_test_score
        FROM users_in_olympiad u
        LEFT JOIN user_study us ON u.id = us.user_id
        LEFT JOIN user_tests ut ON u.id = ut.user_id
        LEFT JOIN user_best_streak ubs ON u.id = ubs.user_id
    ),
    max_minutes AS (SELECT MAX(total_minutes_30) AS max_val FROM combined WHERE total_minutes_30 > 0),
    max_active_days AS (SELECT MAX(active_days_30) AS max_val FROM combined WHERE active_days_30 > 0),
    scored AS (
        SELECT user_id, name, total_minutes_30, active_days_30, best_streak, avg_test_score,
               (0.3 * (CASE WHEN (SELECT max_val FROM max_minutes) > 0 THEN total_minutes_30::FLOAT / (SELECT max_val FROM max_minutes) ELSE 0 END)
                + 0.3 * (CASE WHEN (SELECT max_val FROM max_active_days) > 0 THEN active_days_30::FLOAT / (SELECT max_val FROM max_active_days) ELSE 0 END)
                + 0.4 * (avg_test_score / 100)
               ) * 100 AS composite_score
        FROM combined
    ),
    ranked AS (
        SELECT user_id, name, total_minutes_30, active_days_30, best_streak, avg_test_score, composite_score,
               ROW_NUMBER() OVER (ORDER BY composite_score DESC) AS rank
        FROM scored
    )
    SELECT jsonb_build_object(
        'olympiad_id', p_olympiad_id,
        'generated_at', NOW(),
        'total_users', (SELECT COUNT(*) FROM combined),
        'entries',
(
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_id,
      'name', name,
      'total_minutes_30', total_minutes_30,
      'active_days_30', active_days_30,
      'best_streak', best_streak,
      'avg_test_score', avg_test_score,
      'composite_score', ROUND(composite_score, 2),
      'rank', rank
    )
    ORDER BY rank
  )
  FROM (
    SELECT *
    FROM ranked
    ORDER BY rank
    LIMIT p_limit
  ) r
)
    ) INTO result;
    RETURN result;
END;
$$;

GRANT EXECUTE
ON FUNCTION public.get_olympiad_leaderboard(text, date, integer, text, text)
TO authenticated;
-- ========================================
-- End of Schema
-- ========================================
