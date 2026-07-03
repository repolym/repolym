-- =============================================
-- سامانه المپیاد - Supabase Database Schema v2.0 (Production-Ready)
-- اجرا کنید در: Supabase Dashboard > SQL Editor
-- =============================================

-- ========================================
-- 1. جدول کاربران (Enhanced)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    olympiad_id TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    notes TEXT,
    resource TEXT,
    question_count INTEGER,
    question_difficulty TEXT,
    estimated_difficulty NUMERIC,
    question_type TEXT,
    tags TEXT,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. جدول پلن‌ها (نو)
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
-- 7. جدول یادداشت‌ها (نو)
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
-- Indexes برای Performance
-- ========================================
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
CREATE INDEX IF NOT EXISTS idx_todos_plan ON todos(plan_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);

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
-- RLS Policies - Enable RLS
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper Function: Check if Admin
-- ========================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ========================================
-- RLS Policies - Users
-- ========================================
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (public.is_admin_user());

-- ========================================
-- RLS Policies - Subjects
-- ========================================
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

-- ========================================
-- RLS Policies - Study Sessions
-- ========================================
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

-- ========================================
-- RLS Policies - Goals
-- ========================================
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

-- ========================================
-- RLS Policies - Tests
-- ========================================
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

-- ========================================
-- RLS Policies - Plans
-- ========================================
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

-- ========================================
-- RLS Policies - Todos
-- ========================================
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

-- ========================================
-- RLS Policies - Streaks
-- ========================================
DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
CREATE POLICY "streaks_select_own" ON streaks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
CREATE POLICY "streaks_update_own" ON streaks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
CREATE POLICY "streaks_insert_own" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "streaks_select_admin" ON streaks;
CREATE POLICY "streaks_select_admin" ON streaks FOR SELECT USING (public.is_admin_user());

-- ========================================
-- End of Schema
-- ========================================
