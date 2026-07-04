
-- =============================================
-- سامانه المپیاد - Supabase Database Schema (نسخه اصلاح‌شده)
-- اجرا کنید در: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. جدول کاربران
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول دروس
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 3. جدول جلسات مطالعه
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول اهداف
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

-- 5. جدول آزمون‌ها
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

-- =============================================
-- ایندکس‌ها برای سرعت بیشتر
-- =============================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_date ON tests(user_id, date DESC);

-- =============================================
-- تابع ساخت پروفایل کاربر بعد از ثبت‌نام (مهم: SECURITY DEFINER)
-- این تابع با دسترسی admin اجرا می‌شه و RLS رو bypass می‌کنه
-- =============================================
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تریگر برای ساخت پروفایل خودکار
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS - امنیت ردیف‌ها
-- =============================================

-- کاربران
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
-- INSERT توسط trigger با SECURITY DEFINER انجام می‌شه، نه توسط کاربر مستقیم
-- اما برای اطمینان این policy هم باشه:
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- دروس
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select_own" ON subjects;
DROP POLICY IF EXISTS "subjects_insert_own" ON subjects;
DROP POLICY IF EXISTS "subjects_update_own" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_own" ON subjects;
CREATE POLICY "subjects_select_own" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subjects_insert_own" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subjects_update_own" ON subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subjects_delete_own" ON subjects FOR DELETE USING (auth.uid() = user_id);

-- جلسات مطالعه
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_select_own" ON study_sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON study_sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON study_sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON study_sessions;
CREATE POLICY "sessions_select_own" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

-- اهداف
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals_select_own" ON goals;
DROP POLICY IF EXISTS "goals_insert_own" ON goals;
DROP POLICY IF EXISTS "goals_update_own" ON goals;
DROP POLICY IF EXISTS "goals_delete_own" ON goals;
CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON goals FOR DELETE USING (auth.uid() = user_id);

-- آزمون‌ها
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tests_select_own" ON tests;
DROP POLICY IF EXISTS "tests_insert_own" ON tests;
DROP POLICY IF EXISTS "tests_update_own" ON tests;
DROP POLICY IF EXISTS "tests_delete_own" ON tests;
CREATE POLICY "tests_select_own" ON tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tests_insert_own" ON tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tests_update_own" ON tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tests_delete_own" ON tests FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- دسترسی ادمین (رفع باگ حیاتی): پیش از این هیچ Policy ای به ادمین اجازه
-- نمی‌داد داده‌های سایر کاربران را ببیند، در نتیجه پنل ادمین (و هر فیلتری
-- در آن، از جمله فیلتر تاریخ) همیشه فقط داده‌های خودِ ادمین را برمی‌گرداند —
-- نه به این دلیل که فیلتر اشتباه بود، بلکه چون دیتابیس اساساً ردیف‌های
-- کاربران دیگر را پنهان می‌کرد. این تابع SECURITY DEFINER بدون ایجاد
-- بازگشت بی‌نهایت در RLS، نقش ادمین کاربر جاری را بررسی می‌کند.
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "subjects_select_admin" ON subjects;
CREATE POLICY "subjects_select_admin" ON subjects FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "sessions_select_admin" ON study_sessions;
CREATE POLICY "sessions_select_admin" ON study_sessions FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "goals_select_admin" ON goals;
CREATE POLICY "goals_select_admin" ON goals FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "tests_select_admin" ON tests;
CREATE POLICY "tests_select_admin" ON tests FOR SELECT USING (public.is_admin_user());

-- =============================================
-- دسترسی عمومی برای صفحهٔ اشتراک‌گذاری (رفع باگ حیاتی): صفحهٔ
-- «/public/:userId» قرار است بدون نیاز به ورود قابل مشاهده باشد (دکمهٔ
-- «اشتراک‌گذاری ساعات مطالعه» چنین لینکی می‌سازد)، اما پیش از این هیچ Policy
-- ای به کاربر ناشناس (anon) اجازهٔ خواندن نمی‌داد، پس این صفحه برای همه
-- (به‌جز خودِ کاربر) همیشه خالی نمایش داده می‌شد. این Policy فقط به نقش
-- anon اجازهٔ SELECT می‌دهد (نه به کاربران واردشده) تا دسترسی کاربران
-- واردشده به داده‌های خودشان/سایرین تغییری نکند. توجه: کلاینت در
-- PublicStudyPage.tsx فقط ستون‌های غیرحساس (date, duration_minutes,
-- subject) را انتخاب می‌کند، نه notes (که شامل ساعت خواب/بیداری/گوشی است).
-- =============================================
DROP POLICY IF EXISTS "sessions_select_public_anon" ON study_sessions;
CREATE POLICY "sessions_select_public_anon" ON study_sessions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "subjects_select_public_anon" ON subjects;
CREATE POLICY "subjects_select_public_anon" ON subjects FOR SELECT TO anon USING (true);

-- =============================================
-- محدودیت‌های کسب‌وکار (رفع باگ #۱۰): یک روز نمی‌تواند بیش از ۲۴ ساعت
-- مطالعه + استفاده از گوشی داشته باشد. اعتبارسنجی سمت کلاینت (در SessionForm)
-- می‌تواند دور زده شود، پس این قانون باید در پایگاه‌داده نیز اجرا شود.
-- ساعت گوشی داخل ستون notes (JSON متنی) ذخیره می‌شود.
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_session_daily_limit()
RETURNS TRIGGER AS $$
DECLARE
  phone_hours NUMERIC := 0;
  notes_json JSONB;
BEGIN
  IF NEW.duration_minutes IS NULL OR NEW.duration_minutes <= 0 OR NEW.duration_minutes > 1440 THEN
    RAISE EXCEPTION 'مدت مطالعه باید بین ۱ دقیقه و ۲۴ ساعت باشد';
  END IF;

  IF NEW.notes IS NOT NULL THEN
    BEGIN
      notes_json := NEW.notes::JSONB;
      phone_hours := COALESCE((notes_json->>'phone')::NUMERIC, 0);
    EXCEPTION WHEN OTHERS THEN
      phone_hours := 0;
    END;
  END IF;

  IF phone_hours < 0 THEN
    RAISE EXCEPTION 'ساعت استفاده از گوشی نمی‌تواند منفی باشد';
  END IF;

  IF phone_hours > 24 THEN
    RAISE EXCEPTION 'ساعت استفاده از گوشی نمی‌تواند بیش از ۲۴ ساعت باشد';
  END IF;

  IF (NEW.duration_minutes::NUMERIC / 60.0) + phone_hours > 24 THEN
    RAISE EXCEPTION 'مجموع ساعت مطالعه و استفاده از گوشی نمی‌تواند بیش از ۲۴ ساعت در روز باشد';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_session_daily_limit ON study_sessions;
CREATE TRIGGER trg_validate_session_daily_limit
  BEFORE INSERT OR UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_daily_limit();

-- =============================================
-- مهاجرت: انتخاب المپیاد + تنظیمات کاربر (افزایشی، سازگار با نسخه قبلی)
-- این بخش فقط ستون اضافه می‌کند و هیچ داده یا Policy موجودی را تغییر نمی‌دهد.
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS olympiad_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
-- preferences: محل ذخیره تنظیمات سبک (تم، اعلان‌ها و...) به‌صورت انعطاف‌پذیر
-- بدون نیاز به مهاجرت‌های بعدی برای هر تنظیم جدید.
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- =============================================
-- مطالعه - افزودن فیلدهای جدید به جلسات (اختیاری)
-- =============================================
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS resource TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_count INTEGER;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_difficulty TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS estimated_difficulty TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS todo_relation TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS tags TEXT;

-- =============================================
-- برنامه‌ریزی - جدول برنامه‌ها
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'exam', 'flexible')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    end_date DATE,
    due_date DATE,
    estimated_duration INTEGER, -- minutes
    dependencies JSONB, -- array of plan IDs
    recurring JSONB, -- { frequency: 'daily'|'weekly'|'monthly', interval: 1, days?: [1,2,3] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_start_date ON plans(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(user_id, status);

-- اضافه کردن ستون plan_id به study_sessions (اختیاری)
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_plan_id ON study_sessions(plan_id);

-- =============================================
-- برنامه‌ریزی - RLS و محدودیت‌های تاریخ
-- =============================================

-- 1. فعال‌سازی RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 2. سیاست‌های دسترسی
DROP POLICY IF EXISTS "plans_select_own" ON plans;
DROP POLICY IF EXISTS "plans_insert_own" ON plans;
DROP POLICY IF EXISTS "plans_update_own" ON plans;
DROP POLICY IF EXISTS "plans_delete_own" ON plans;

CREATE POLICY "plans_select_own" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plans_insert_own" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plans_update_own" ON plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "plans_delete_own" ON plans FOR DELETE USING (auth.uid() = user_id);

-- 3. محدودیت‌های تاریخ (اگر قبلاً اضافه نشده‌اند)
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_end_date_check;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_due_date_check;

ALTER TABLE plans ADD CONSTRAINT plans_end_date_check 
  CHECK (end_date IS NULL OR end_date >= start_date);

ALTER TABLE plans ADD CONSTRAINT plans_due_date_check 
  CHECK (due_date IS NULL OR due_date >= start_date);

  -- =============================================
-- وظایف (Todos) - جدول جدید
-- =============================================
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    study_resource TEXT,
    question_count INTEGER,
    difficulty TEXT, -- e.g., 'easy', 'medium', 'hard'
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    deadline DATE,
    estimated_time INTEGER, -- minutes
    actual_time INTEGER, -- minutes
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(user_id, deadline);

-- RLS policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_select_own" ON todos;
DROP POLICY IF EXISTS "todos_insert_own" ON todos;
DROP POLICY IF EXISTS "todos_update_own" ON todos;
DROP POLICY IF EXISTS "todos_delete_own" ON todos;

CREATE POLICY "todos_select_own" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "todos_insert_own" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update_own" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "todos_delete_own" ON todos FOR DELETE USING (auth.uid() = user_id);

-- Admin access (optional)
DROP POLICY IF EXISTS "todos_select_admin" ON todos;
CREATE POLICY "todos_select_admin" ON todos FOR SELECT USING (public.is_admin_user());

-- =============================================
-- ANALYTICS TABLES AND FUNCTIONS
-- =============================================

-- Table: daily_metrics (sleep and phone usage)
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours NUMERIC(3,1) CHECK (sleep_hours IS NULL OR sleep_hours BETWEEN 0 AND 24),
    phone_usage_minutes INTEGER CHECK (phone_usage_minutes IS NULL OR phone_usage_minutes BETWEEN 0 AND 1440),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- Table: daily_study_summary (rolled-up study data)
CREATE TABLE IF NOT EXISTS daily_study_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_minutes INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    unique_subjects INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summary_user_date ON daily_study_summary(user_id, date DESC);

-- Table: analytics_cache (cached RPC results)
CREATE TABLE IF NOT EXISTS analytics_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reference_date DATE NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Function: refresh_daily_study_summary (trigger)
CREATE OR REPLACE FUNCTION refresh_daily_study_summary()
RETURNS TRIGGER AS $$
DECLARE
    affected_date DATE;
    affected_user UUID;
BEGIN
    -- Determine which user/date changed
    IF TG_OP = 'DELETE' THEN
        affected_user = OLD.user_id;
        affected_date = OLD.date;
    ELSE
        affected_user = NEW.user_id;
        affected_date = NEW.date;
    END IF;

    -- Recompute summary for that day
    INSERT INTO daily_study_summary (user_id, date, total_minutes, session_count, unique_subjects, last_updated)
    SELECT
        s.user_id,
        s.date,
        COALESCE(SUM(s.duration_minutes), 0) AS total_minutes,
        COUNT(*) AS session_count,
        COUNT(DISTINCT s.subject_id) AS unique_subjects,
        NOW()
    FROM study_sessions s
    WHERE s.user_id = affected_user AND s.date = affected_date
    GROUP BY s.user_id, s.date
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_minutes = EXCLUDED.total_minutes,
        session_count = EXCLUDED.session_count,
        unique_subjects = EXCLUDED.unique_subjects,
        last_updated = EXCLUDED.last_updated;

    -- Invalidate cache for this user
    DELETE FROM analytics_cache WHERE user_id = affected_user;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers on study_sessions to keep summary up-to-date
DROP TRIGGER IF EXISTS trg_study_sessions_summary_insert ON study_sessions;
CREATE TRIGGER trg_study_sessions_summary_insert
    AFTER INSERT OR UPDATE OR DELETE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION refresh_daily_study_summary();

-- =============================================
-- ANALYTICS RPC FUNCTION (REPLACE)
-- =============================================

CREATE OR REPLACE FUNCTION get_analytics(
    p_user_id UUID,
    p_today DATE DEFAULT CURRENT_DATE,
    p_force_refresh BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    cache_record RECORD;
    cache_ttl INTERVAL := INTERVAL '30 minutes';
    v_last_30_start DATE;
    v_last_90_start DATE;
    v_baseline_start DATE;
    v_total_minutes_30 NUMERIC := 0;
    v_active_days_30 INT := 0;
    v_total_days_90 INT := 0;
    v_active_days_90 INT := 0;
    v_avg_minutes_active_90 NUMERIC := 0;
    v_stddev_minutes_90 NUMERIC := 0;
    v_baseline_avg NUMERIC := 0;
    v_current_streak INT := 0;
    v_longest_streak INT := 0;
    v_best_date DATE;
    v_best_minutes INT;
    v_worst_date DATE;
    v_worst_minutes INT;
    v_best_weekday INT;
    v_direction TEXT;
    v_slope NUMERIC;
    v_avg_change_per_day NUMERIC;
    v_percent_change NUMERIC;
    v_current_avg NUMERIC;
    v_progress_direction TEXT;
BEGIN
    -- Calculate date ranges
    v_last_30_start := p_today - INTERVAL '30 days';
    v_last_90_start := p_today - INTERVAL '90 days';
    v_baseline_start := p_today - INTERVAL '180 days';

    -- Check cache
    IF NOT p_force_refresh THEN
        SELECT payload INTO cache_record
        FROM analytics_cache
        WHERE user_id = p_user_id AND reference_date = p_today
        AND expires_at > NOW();
        IF FOUND THEN
            RETURN cache_record.payload;
        END IF;
    END IF;

    -- Aggregate daily study data for last 90 days
    WITH daily AS (
        SELECT
            date,
            COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM study_sessions
        WHERE user_id = p_user_id
          AND date >= v_last_90_start
          AND date <= p_today
        GROUP BY date
    ),
    -- 30‑day stats
    stats_30 AS (
        SELECT
            COALESCE(SUM(total_minutes), 0) AS total_minutes,
            COUNT(*) AS total_days,
            COUNT(*) FILTER (WHERE total_minutes > 0) AS active_days,
            COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS avg_active
        FROM daily
        WHERE date >= v_last_30_start
    ),
    -- 90‑day stats
    stats_90 AS (
        SELECT
            COUNT(*) AS total_days,
            COUNT(*) FILTER (WHERE total_minutes > 0) AS active_days,
            COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS avg_active,
            COALESCE(STDDEV(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS stddev
        FROM daily
        WHERE date >= v_last_90_start
    ),
    -- Baseline (180 days, excluding last 90)
    baseline_stats AS (
        SELECT COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS baseline_avg
        FROM daily
        WHERE date >= v_baseline_start AND date < v_last_90_start
    ),
    -- Moving average
    moving_avg AS (
        SELECT
            date,
            total_minutes AS minutes,
            AVG(total_minutes) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
        FROM daily
        WHERE date >= v_last_30_start
        ORDER BY date
    ),
    -- Subject distribution
    subject_dist AS (
        SELECT
            s.subject_id,
            COALESCE(sub.name, 'بدون درس') AS subject_name,
            COALESCE(sub.color, '#9CA3AF') AS color,
            SUM(s.duration_minutes) AS minutes,
            ROUND((SUM(s.duration_minutes)::NUMERIC / NULLIF((SELECT total_minutes FROM stats_30), 0)) * 100, 1) AS percent
        FROM study_sessions s
        LEFT JOIN subjects sub ON sub.id = s.subject_id
        WHERE s.user_id = p_user_id
          AND s.date >= v_last_90_start
        GROUP BY s.subject_id, sub.name, sub.color
        HAVING SUM(s.duration_minutes) > 0
        ORDER BY minutes DESC
    ),
    -- Wellbeing
    wellbeing AS (
        SELECT
            AVG(sleep_hours) AS avg_sleep,
            MIN(sleep_hours) AS min_sleep,
            MAX(sleep_hours) AS max_sleep,
            AVG(phone_usage_minutes) AS avg_phone,
            MIN(phone_usage_minutes) AS min_phone,
            MAX(phone_usage_minutes) AS max_phone,
            COUNT(*) FILTER (WHERE sleep_hours IS NOT NULL) AS sleep_logged,
            COUNT(*) FILTER (WHERE phone_usage_minutes IS NOT NULL) AS phone_logged
        FROM daily_metrics
        WHERE user_id = p_user_id
          AND date >= v_last_30_start
    ),
    -- Best/worst
    best_worst AS (
        SELECT
            (SELECT date FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes DESC LIMIT 1) AS best_date,
            (SELECT total_minutes FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes DESC LIMIT 1) AS best_minutes,
            (SELECT date FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes ASC LIMIT 1) AS worst_date,
            (SELECT total_minutes FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes ASC LIMIT 1) AS worst_minutes,
            (SELECT EXTRACT(ISODOW FROM date) FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start GROUP BY date ORDER BY AVG(total_minutes) DESC LIMIT 1) AS best_weekday_iso
    ),
    -- Streaks
    streak_groups AS (
        SELECT
            date,
            total_minutes > 0 AS studied,
            ROW_NUMBER() OVER (ORDER BY date DESC) - ROW_NUMBER() OVER (PARTITION BY total_minutes > 0 ORDER BY date DESC) AS grp
        FROM daily
        WHERE date >= v_last_90_start
    ),
    streak_calc AS (
        SELECT
            COALESCE(SUM(CASE WHEN studied = true AND grp = (SELECT grp FROM streak_groups WHERE date = (SELECT MAX(date) FROM streak_groups WHERE studied = true)) THEN 1 ELSE 0 END), 0) AS current_streak,
            COALESCE(MAX(CASE WHEN studied = true THEN streak_len ELSE 0 END), 0) AS longest_streak
        FROM (
            SELECT
                studied,
                grp,
                COUNT(*) AS streak_len
            FROM streak_groups
            GROUP BY studied, grp
        ) sub
    ),
    -- Trend
    trend_calc AS (
        SELECT
            CASE
                WHEN COUNT(*) < 2 THEN 'insufficient_data'
                WHEN REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC) > 0.1 THEN 'increasing'
                WHEN REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC) < -0.1 THEN 'decreasing'
                ELSE 'stable'
            END AS direction,
            COALESCE(REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC), 0) AS slope
        FROM daily
        WHERE date >= v_last_30_start
          AND total_minutes > 0
    ),
    -- Goals completion (last 90 days)
    goal_stats AS (
        SELECT
            COUNT(*) AS total_goals,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_goals
        FROM goals
        WHERE user_id = p_user_id
          AND end_date >= v_last_90_start
    ),
    -- Tests (last 30 days)
    test_stats AS (
        SELECT AVG((score::NUMERIC / NULLIF(max_score, 0)) * 100) AS avg_test_score
        FROM tests
        WHERE user_id = p_user_id
          AND date >= v_last_30_start
    )
    -- Fetch all values into variables
    SELECT
        (SELECT total_minutes FROM stats_30),
        (SELECT active_days FROM stats_30),
        (SELECT total_days FROM stats_90),
        (SELECT active_days FROM stats_90),
        (SELECT avg_active FROM stats_90),
        (SELECT stddev FROM stats_90),
        (SELECT baseline_avg FROM baseline_stats),
        (SELECT current_streak FROM streak_calc),
        (SELECT longest_streak FROM streak_calc),
        (SELECT best_date FROM best_worst),
        (SELECT best_minutes FROM best_worst),
        (SELECT worst_date FROM best_worst),
        (SELECT worst_minutes FROM best_worst),
        (SELECT best_weekday_iso FROM best_worst),
        (SELECT direction FROM trend_calc),
        (SELECT slope FROM trend_calc),
        (SELECT slope * 86400 FROM trend_calc),
        (SELECT
            CASE
                WHEN (SELECT baseline_avg FROM baseline_stats) = 0 THEN NULL
                ELSE ROUND(((SELECT avg_active FROM stats_30) - (SELECT baseline_avg FROM baseline_stats)) / (SELECT baseline_avg FROM baseline_stats) * 100, 1)
            END
        ),
        (SELECT avg_active FROM stats_30),
        (SELECT
            CASE
                WHEN (SELECT baseline_avg FROM baseline_stats) = 0 THEN 'insufficient_data'
                WHEN (SELECT avg_active FROM stats_30) > (SELECT baseline_avg FROM baseline_stats) * 1.1 THEN 'improving'
                WHEN (SELECT avg_active FROM stats_30) < (SELECT baseline_avg FROM baseline_stats) * 0.9 THEN 'declining'
                ELSE 'stable'
            END
        )
    INTO
        v_total_minutes_30,
        v_active_days_30,
        v_total_days_90,
        v_active_days_90,
        v_avg_minutes_active_90,
        v_stddev_minutes_90,
        v_baseline_avg,
        v_current_streak,
        v_longest_streak,
        v_best_date,
        v_best_minutes,
        v_worst_date,
        v_worst_minutes,
        v_best_weekday,
        v_direction,
        v_slope,
        v_avg_change_per_day,
        v_percent_change,
        v_current_avg,
        v_progress_direction;

    -- Build JSON result
    SELECT jsonb_build_object(
        'productivity_score', jsonb_build_object(
            'productivity_score', ROUND(
                COALESCE(
                    (CASE WHEN v_total_days_90 > 0 THEN ROUND((v_active_days_30::NUMERIC / 30) * 100, 0) ELSE 0 END) * 0.4 +
                    COALESCE((SELECT ROUND((completed_goals::NUMERIC / NULLIF(total_goals, 0)) * 100, 0) FROM goal_stats), 0) * 0.2 +
                    COALESCE((SELECT ROUND(COALESCE(avg_test_score, 0), 0) FROM test_stats), 0) * 0.2 +
                    COALESCE(
                        (CASE WHEN v_active_days_30 > 0 AND v_avg_minutes_active_90 > 0 THEN
                            ROUND((SELECT COALESCE(AVG(total_minutes), 0) FROM daily WHERE date >= v_last_30_start AND total_minutes > 60) / NULLIF((SELECT AVG(total_minutes) FROM daily WHERE date >= v_last_30_start), 0) * 100, 0)
                        ELSE 0 END),
                    0) * 0.2
                ), 0
            ),
            'components', jsonb_build_object(
                'consistency', COALESCE((CASE WHEN v_total_days_90 > 0 THEN ROUND((v_active_days_30::NUMERIC / 30) * 100, 0) ELSE 0 END), 0),
                'goal_completion', COALESCE((SELECT ROUND((completed_goals::NUMERIC / NULLIF(total_goals, 0)) * 100, 0) FROM goal_stats), 0),
                'test_performance', COALESCE((SELECT ROUND(COALESCE(avg_test_score, 0), 0) FROM test_stats), 0),
                'effective_study_time', COALESCE(
                    (CASE WHEN v_active_days_30 > 0 AND v_avg_minutes_active_90 > 0 THEN
                        ROUND((SELECT COALESCE(AVG(total_minutes), 0) FROM daily WHERE date >= v_last_30_start AND total_minutes > 60) / NULLIF((SELECT AVG(total_minutes) FROM daily WHERE date >= v_last_30_start), 0) * 100, 0)
                    ELSE 0 END),
                0)
            )
        ),
        'recovery_score', jsonb_build_object(
            'recovery_score', ROUND(
                COALESCE((SELECT ROUND(COALESCE(AVG(sleep_hours), 0) * 10, 0) FROM wellbeing), 0) * 0.4 +
                COALESCE((CASE WHEN v_avg_minutes_active_90 > 0 THEN ROUND((1 - (v_stddev_minutes_90 / NULLIF(v_avg_minutes_active_90, 0))) * 100, 0) ELSE 0 END), 0) * 0.3 +
                COALESCE((SELECT ROUND(100 - (COALESCE(AVG(phone_usage_minutes), 0) / 240 * 100), 0) FROM wellbeing), 0) * 0.3
            , 0),
            'components', jsonb_build_object(
                'sleep_consistency', COALESCE((SELECT ROUND(COALESCE(AVG(sleep_hours), 0) * 10, 0) FROM wellbeing), 0),
                'gap_recovery', COALESCE((CASE WHEN v_avg_minutes_active_90 > 0 THEN ROUND((1 - (v_stddev_minutes_90 / NULLIF(v_avg_minutes_active_90, 0))) * 100, 0) ELSE 0 END), 0),
                'phone_usage_impact', COALESCE((SELECT ROUND(100 - (COALESCE(AVG(phone_usage_minutes), 0) / 240 * 100), 0) FROM wellbeing), 0)
            )
        ),
        'study_streak', jsonb_build_object(
            'current_streak', COALESCE(v_current_streak, 0),
            'longest_streak', COALESCE(v_longest_streak, 0),
            'last_study_date', (SELECT MAX(date) FROM daily WHERE total_minutes > 0 AND date <= p_today)
        ),
        'study_consistency', jsonb_build_object(
            'consistency_score', COALESCE(ROUND((v_active_days_30::NUMERIC / 30) * 100, 0), 0),
            'active_days', COALESCE(v_active_days_30, 0),
            'total_days', 30,
            'target_active_days', 26
        ),
        'study_trend', jsonb_build_object(
            'direction', COALESCE(v_direction, 'insufficient_data'),
            'slope', COALESCE(v_slope, 0),
            'average_change_per_day', COALESCE(v_avg_change_per_day, 0),
            'period_days', 30
        ),
        'moving_average', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', date, 'minutes', minutes, 'moving_avg_7d', moving_avg_7d)) FROM moving_avg), '[]'::jsonb),
        'best_worst_day', jsonb_build_object(
            'best_date', v_best_date,
            'best_date_minutes', v_best_minutes,
            'worst_date', v_worst_date,
            'worst_date_minutes', v_worst_minutes,
            'best_weekday_iso', v_best_weekday,
            'weekday_averages', (SELECT jsonb_object_agg(day, avg_minutes) FROM (
                SELECT EXTRACT(ISODOW FROM date) AS day, AVG(total_minutes) AS avg_minutes
                FROM daily
                WHERE total_minutes > 0 AND date >= v_last_90_start
                GROUP BY day
            ) weekdays)
        ),
        'subject_distribution', COALESCE((SELECT jsonb_agg(jsonb_build_object('subject_id', subject_id, 'subject_name', subject_name, 'color', color, 'minutes', minutes, 'percent', percent)) FROM subject_dist), '[]'::jsonb),
        'sleep_statistics', jsonb_build_object(
            'avg_sleep_hours', (SELECT avg_sleep FROM wellbeing),
            'min_sleep_hours', (SELECT min_sleep FROM wellbeing),
            'max_sleep_hours', (SELECT max_sleep FROM wellbeing),
            'logged_days', COALESCE((SELECT sleep_logged FROM wellbeing), 0)
        ),
        'phone_usage_statistics', jsonb_build_object(
            'avg_phone_minutes', (SELECT avg_phone FROM wellbeing),
            'min_phone_minutes', (SELECT min_phone FROM wellbeing),
            'max_phone_minutes', (SELECT max_phone FROM wellbeing),
            'logged_days', COALESCE((SELECT phone_logged FROM wellbeing), 0)
        ),
        'personal_baseline', jsonb_build_object(
            'baseline_avg_minutes', COALESCE(v_baseline_avg, 0),
            'baseline_avg_minutes_active_days', COALESCE(v_baseline_avg, 0),
            'baseline_days', 180
        ),
        'progress_trend', jsonb_build_object(
            'direction', COALESCE(v_progress_direction, 'insufficient_data'),
            'percent_change_vs_baseline', v_percent_change,
            'current_avg_minutes', v_current_avg
        ),
        'date_range', jsonb_build_object(
            'start_date', v_last_30_start,
            'end_date', p_today,
            'range_days', 30
        ),
        'generated_at', NOW()
    ) INTO result;

    -- Cache the result
    INSERT INTO analytics_cache (user_id, reference_date, payload, expires_at)
    VALUES (p_user_id, p_today, result, NOW() + INTERVAL '30 minutes')
    ON CONFLICT (user_id) DO UPDATE SET
        reference_date = EXCLUDED.reference_date,
        payload = EXCLUDED.payload,
        expires_at = EXCLUDED.expires_at;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- ANALYTICS TABLES AND FUNCTIONS (CLEAN REINSTALL)
-- =============================================

-- Drop existing objects (if any) to avoid conflicts
DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS daily_metrics CASCADE;
DROP TABLE IF EXISTS daily_study_summary CASCADE;
DROP FUNCTION IF EXISTS refresh_daily_study_summary CASCADE;
DROP FUNCTION IF EXISTS get_analytics CASCADE;

-- 1. Table: daily_metrics (sleep and phone usage)
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours NUMERIC(3,1) CHECK (sleep_hours IS NULL OR sleep_hours BETWEEN 0 AND 24),
    phone_usage_minutes INTEGER CHECK (phone_usage_minutes IS NULL OR phone_usage_minutes BETWEEN 0 AND 1440),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- 2. Table: daily_study_summary (rolled-up study data)
CREATE TABLE daily_study_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_minutes INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    unique_subjects INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summary_user_date ON daily_study_summary(user_id, date DESC);

-- 3. Table: analytics_cache (cached RPC results)
CREATE TABLE analytics_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reference_date DATE NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- 4. Function: refresh_daily_study_summary (trigger)
CREATE OR REPLACE FUNCTION refresh_daily_study_summary()
RETURNS TRIGGER AS $$
DECLARE
    affected_date DATE;
    affected_user UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        affected_user = OLD.user_id;
        affected_date = OLD.date;
    ELSE
        affected_user = NEW.user_id;
        affected_date = NEW.date;
    END IF;

    INSERT INTO daily_study_summary (user_id, date, total_minutes, session_count, unique_subjects, last_updated)
    SELECT
        s.user_id,
        s.date,
        COALESCE(SUM(s.duration_minutes), 0) AS total_minutes,
        COUNT(*) AS session_count,
        COUNT(DISTINCT s.subject_id) AS unique_subjects,
        NOW()
    FROM study_sessions s
    WHERE s.user_id = affected_user AND s.date = affected_date
    GROUP BY s.user_id, s.date
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_minutes = EXCLUDED.total_minutes,
        session_count = EXCLUDED.session_count,
        unique_subjects = EXCLUDED.unique_subjects,
        last_updated = EXCLUDED.last_updated;

    DELETE FROM analytics_cache WHERE user_id = affected_user;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_study_sessions_summary_insert ON study_sessions;
CREATE TRIGGER trg_study_sessions_summary_insert
    AFTER INSERT OR UPDATE OR DELETE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION refresh_daily_study_summary();

-- 5. Main RPC: get_analytics
CREATE OR REPLACE FUNCTION get_analytics(
    p_user_id UUID,
    p_today DATE DEFAULT CURRENT_DATE,
    p_force_refresh BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    cache_record RECORD;
    v_last_30_start DATE;
    v_last_90_start DATE;
    v_baseline_start DATE;
    v_total_minutes_30 NUMERIC := 0;
    v_active_days_30 INT := 0;
    v_total_days_90 INT := 0;
    v_active_days_90 INT := 0;
    v_avg_minutes_active_90 NUMERIC := 0;
    v_stddev_minutes_90 NUMERIC := 0;
    v_baseline_avg NUMERIC := 0;
    v_current_streak INT := 0;
    v_longest_streak INT := 0;
    v_best_date DATE;
    v_best_minutes INT;
    v_worst_date DATE;
    v_worst_minutes INT;
    v_best_weekday INT;
    v_direction TEXT;
    v_slope NUMERIC;
    v_avg_change_per_day NUMERIC;
    v_percent_change NUMERIC;
    v_current_avg NUMERIC;
    v_progress_direction TEXT;
    v_goal_completion NUMERIC := 0;
    v_test_performance NUMERIC := 0;
    v_effective_study NUMERIC := 0;
    v_consistency NUMERIC := 0;
    v_sleep_score NUMERIC := 0;
    v_gap_recovery NUMERIC := 0;
    v_phone_impact NUMERIC := 0;
    v_avg_sleep NUMERIC;
    v_min_sleep NUMERIC;
    v_max_sleep NUMERIC;
    v_sleep_logged INT;
    v_avg_phone NUMERIC;
    v_min_phone NUMERIC;
    v_max_phone NUMERIC;
    v_phone_logged INT;
BEGIN
    -- Date ranges
    v_last_30_start := p_today - INTERVAL '30 days';
    v_last_90_start := p_today - INTERVAL '90 days';
    v_baseline_start := p_today - INTERVAL '180 days';

    -- Check cache
    IF NOT p_force_refresh THEN
        SELECT payload INTO cache_record
        FROM analytics_cache
        WHERE user_id = p_user_id AND reference_date = p_today
        AND expires_at > NOW();
        IF FOUND THEN
            RETURN cache_record.payload;
        END IF;
    END IF;

    -- Compute aggregates
    WITH daily AS (
        SELECT
            date,
            COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM study_sessions
        WHERE user_id = p_user_id
          AND date >= v_last_90_start
          AND date <= p_today
        GROUP BY date
    ),
    stats_30 AS (
        SELECT
            COALESCE(SUM(total_minutes), 0) AS total_minutes,
            COUNT(*) AS total_days,
            COUNT(*) FILTER (WHERE total_minutes > 0) AS active_days,
            COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS avg_active
        FROM daily
        WHERE date >= v_last_30_start
    ),
    stats_90 AS (
        SELECT
            COUNT(*) AS total_days,
            COUNT(*) FILTER (WHERE total_minutes > 0) AS active_days,
            COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS avg_active,
            COALESCE(STDDEV(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS stddev
        FROM daily
        WHERE date >= v_last_90_start
    ),
    baseline_stats AS (
        SELECT COALESCE(AVG(total_minutes) FILTER (WHERE total_minutes > 0), 0) AS baseline_avg
        FROM daily
        WHERE date >= v_baseline_start AND date < v_last_90_start
    ),
    moving_avg AS (
        SELECT
            date,
            total_minutes AS minutes,
            AVG(total_minutes) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
        FROM daily
        WHERE date >= v_last_30_start
        ORDER BY date
    ),
    subject_dist AS (
        SELECT
            s.subject_id,
            COALESCE(sub.name, 'بدون درس') AS subject_name,
            COALESCE(sub.color, '#9CA3AF') AS color,
            SUM(s.duration_minutes) AS minutes,
            ROUND((SUM(s.duration_minutes)::NUMERIC / NULLIF((SELECT total_minutes FROM stats_30), 0)) * 100, 1) AS percent
        FROM study_sessions s
        LEFT JOIN subjects sub ON sub.id = s.subject_id
        WHERE s.user_id = p_user_id
          AND s.date >= v_last_90_start
        GROUP BY s.subject_id, sub.name, sub.color
        HAVING SUM(s.duration_minutes) > 0
        ORDER BY minutes DESC
    ),
    wellbeing AS (
        SELECT
            AVG(sleep_hours) AS avg_sleep,
            MIN(sleep_hours) AS min_sleep,
            MAX(sleep_hours) AS max_sleep,
            AVG(phone_usage_minutes) AS avg_phone,
            MIN(phone_usage_minutes) AS min_phone,
            MAX(phone_usage_minutes) AS max_phone,
            COUNT(*) FILTER (WHERE sleep_hours IS NOT NULL) AS sleep_logged,
            COUNT(*) FILTER (WHERE phone_usage_minutes IS NOT NULL) AS phone_logged
        FROM daily_metrics
        WHERE user_id = p_user_id
          AND date >= v_last_30_start
    ),
    best_worst AS (
        SELECT
            (SELECT date FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes DESC LIMIT 1) AS best_date,
            (SELECT total_minutes FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes DESC LIMIT 1) AS best_minutes,
            (SELECT date FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes ASC LIMIT 1) AS worst_date,
            (SELECT total_minutes FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start ORDER BY total_minutes ASC LIMIT 1) AS worst_minutes,
            (SELECT EXTRACT(ISODOW FROM date) FROM daily WHERE total_minutes > 0 AND date >= v_last_90_start GROUP BY date ORDER BY AVG(total_minutes) DESC LIMIT 1) AS best_weekday_iso
    ),
    streak_groups AS (
        SELECT
            date,
            total_minutes > 0 AS studied,
            ROW_NUMBER() OVER (ORDER BY date DESC) - ROW_NUMBER() OVER (PARTITION BY total_minutes > 0 ORDER BY date DESC) AS grp
        FROM daily
        WHERE date >= v_last_90_start
    ),
    streak_calc AS (
        SELECT
            COALESCE(SUM(CASE WHEN studied = true AND grp = (SELECT grp FROM streak_groups WHERE date = (SELECT MAX(date) FROM streak_groups WHERE studied = true)) THEN 1 ELSE 0 END), 0) AS current_streak,
            COALESCE(MAX(CASE WHEN studied = true THEN streak_len ELSE 0 END), 0) AS longest_streak
        FROM (
            SELECT
                studied,
                grp,
                COUNT(*) AS streak_len
            FROM streak_groups
            GROUP BY studied, grp
        ) sub
    ),
    trend_calc AS (
        SELECT
            CASE
                WHEN COUNT(*) < 2 THEN 'insufficient_data'
                WHEN REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC) > 0.1 THEN 'increasing'
                WHEN REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC) < -0.1 THEN 'decreasing'
                ELSE 'stable'
            END AS direction,
            COALESCE(REGR_SLOPE(total_minutes, EXTRACT(EPOCH FROM date)::NUMERIC), 0) AS slope
        FROM daily
        WHERE date >= v_last_30_start
          AND total_minutes > 0
    ),
    goal_stats AS (
        SELECT
            COUNT(*) AS total_goals,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_goals
        FROM goals
        WHERE user_id = p_user_id
          AND end_date >= v_last_90_start
    ),
    test_stats AS (
        SELECT AVG((score::NUMERIC / NULLIF(max_score, 0)) * 100) AS avg_test_score
        FROM tests
        WHERE user_id = p_user_id
          AND date >= v_last_30_start
    )
    SELECT
        (SELECT total_minutes FROM stats_30),
        (SELECT active_days FROM stats_30),
        (SELECT total_days FROM stats_90),
        (SELECT active_days FROM stats_90),
        (SELECT avg_active FROM stats_90),
        (SELECT stddev FROM stats_90),
        (SELECT baseline_avg FROM baseline_stats),
        (SELECT current_streak FROM streak_calc),
        (SELECT longest_streak FROM streak_calc),
        (SELECT best_date FROM best_worst),
        (SELECT best_minutes FROM best_worst),
        (SELECT worst_date FROM best_worst),
        (SELECT worst_minutes FROM best_worst),
        (SELECT best_weekday_iso FROM best_worst),
        (SELECT direction FROM trend_calc),
        (SELECT slope FROM trend_calc),
        (SELECT slope * 86400 FROM trend_calc),
        (SELECT
            CASE
                WHEN (SELECT baseline_avg FROM baseline_stats) = 0 THEN NULL
                ELSE ROUND(((SELECT avg_active FROM stats_30) - (SELECT baseline_avg FROM baseline_stats)) / (SELECT baseline_avg FROM baseline_stats) * 100, 1)
            END
        ),
        (SELECT avg_active FROM stats_30),
        (SELECT
            CASE
                WHEN (SELECT baseline_avg FROM baseline_stats) = 0 THEN 'insufficient_data'
                WHEN (SELECT avg_active FROM stats_30) > (SELECT baseline_avg FROM baseline_stats) * 1.1 THEN 'improving'
                WHEN (SELECT avg_active FROM stats_30) < (SELECT baseline_avg FROM baseline_stats) * 0.9 THEN 'declining'
                ELSE 'stable'
            END
        ),
        (SELECT ROUND((completed_goals::NUMERIC / NULLIF(total_goals, 0)) * 100, 0) FROM goal_stats),
        (SELECT ROUND(COALESCE(avg_test_score, 0), 0) FROM test_stats),
        (SELECT
            CASE
                WHEN (SELECT active_days FROM stats_30) > 0 AND (SELECT avg_active FROM stats_90) > 0 THEN
                    ROUND((SELECT COALESCE(AVG(total_minutes), 0) FROM daily WHERE date >= v_last_30_start AND total_minutes > 60) / NULLIF((SELECT AVG(total_minutes) FROM daily WHERE date >= v_last_30_start), 0) * 100, 0)
                ELSE 0
            END
        ),
        (SELECT ROUND((active_days::NUMERIC / 30) * 100, 0) FROM stats_30),
        (SELECT ROUND(COALESCE(AVG(sleep_hours), 0) * 10, 0) FROM wellbeing),
        (SELECT
            CASE
                WHEN (SELECT avg_active FROM stats_90) > 0 THEN ROUND((1 - (stddev / NULLIF(avg_active, 0))) * 100, 0)
                ELSE 0
            END
        FROM stats_90),
        (SELECT ROUND(100 - (COALESCE(AVG(phone_usage_minutes), 0) / 240 * 100), 0) FROM wellbeing),
        (SELECT avg_sleep FROM wellbeing),
        (SELECT min_sleep FROM wellbeing),
        (SELECT max_sleep FROM wellbeing),
        (SELECT sleep_logged FROM wellbeing),
        (SELECT avg_phone FROM wellbeing),
        (SELECT min_phone FROM wellbeing),
        (SELECT max_phone FROM wellbeing),
        (SELECT phone_logged FROM wellbeing)
    INTO
        v_total_minutes_30,
        v_active_days_30,
        v_total_days_90,
        v_active_days_90,
        v_avg_minutes_active_90,
        v_stddev_minutes_90,
        v_baseline_avg,
        v_current_streak,
        v_longest_streak,
        v_best_date,
        v_best_minutes,
        v_worst_date,
        v_worst_minutes,
        v_best_weekday,
        v_direction,
        v_slope,
        v_avg_change_per_day,
        v_percent_change,
        v_current_avg,
        v_progress_direction,
        v_goal_completion,
        v_test_performance,
        v_effective_study,
        v_consistency,
        v_sleep_score,
        v_gap_recovery,
        v_phone_impact,
        v_avg_sleep,
        v_min_sleep,
        v_max_sleep,
        v_sleep_logged,
        v_avg_phone,
        v_min_phone,
        v_max_phone,
        v_phone_logged;

    -- Build JSON result using variables
    SELECT jsonb_build_object(
        'productivity_score', jsonb_build_object(
            'productivity_score', ROUND(
                COALESCE(v_consistency, 0) * 0.4 +
                COALESCE(v_goal_completion, 0) * 0.2 +
                COALESCE(v_test_performance, 0) * 0.2 +
                COALESCE(v_effective_study, 0) * 0.2
            , 0),
            'components', jsonb_build_object(
                'consistency', COALESCE(v_consistency, 0),
                'goal_completion', COALESCE(v_goal_completion, 0),
                'test_performance', COALESCE(v_test_performance, 0),
                'effective_study_time', COALESCE(v_effective_study, 0)
            )
        ),
        'recovery_score', jsonb_build_object(
            'recovery_score', ROUND(
                COALESCE(v_sleep_score, 0) * 0.4 +
                COALESCE(v_gap_recovery, 0) * 0.3 +
                COALESCE(v_phone_impact, 0) * 0.3
            , 0),
            'components', jsonb_build_object(
                'sleep_consistency', COALESCE(v_sleep_score, 0),
                'gap_recovery', COALESCE(v_gap_recovery, 0),
                'phone_usage_impact', COALESCE(v_phone_impact, 0)
            )
        ),
        'study_streak', jsonb_build_object(
            'current_streak', COALESCE(v_current_streak, 0),
            'longest_streak', COALESCE(v_longest_streak, 0),
            'last_study_date', (SELECT MAX(date) FROM daily WHERE total_minutes > 0 AND date <= p_today)
        ),
        'study_consistency', jsonb_build_object(
            'consistency_score', COALESCE(v_consistency, 0),
            'active_days', COALESCE(v_active_days_30, 0),
            'total_days', 30,
            'target_active_days', 26
        ),
        'study_trend', jsonb_build_object(
            'direction', COALESCE(v_direction, 'insufficient_data'),
            'slope', COALESCE(v_slope, 0),
            'average_change_per_day', COALESCE(v_avg_change_per_day, 0),
            'period_days', 30
        ),
        'moving_average', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('date', date, 'minutes', minutes, 'moving_avg_7d', moving_avg_7d))
             FROM moving_avg),
            '[]'::jsonb
        ),
        'best_worst_day', jsonb_build_object(
            'best_date', v_best_date,
            'best_date_minutes', v_best_minutes,
            'worst_date', v_worst_date,
            'worst_date_minutes', v_worst_minutes,
            'best_weekday_iso', v_best_weekday,
            'weekday_averages', (SELECT jsonb_object_agg(day, avg_minutes) FROM (
                SELECT EXTRACT(ISODOW FROM date) AS day, AVG(total_minutes) AS avg_minutes
                FROM daily
                WHERE total_minutes > 0 AND date >= v_last_90_start
                GROUP BY day
            ) weekdays)
        ),
        'subject_distribution', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('subject_id', subject_id, 'subject_name', subject_name, 'color', color, 'minutes', minutes, 'percent', percent))
             FROM subject_dist),
            '[]'::jsonb
        ),
        'sleep_statistics', jsonb_build_object(
            'avg_sleep_hours', v_avg_sleep,
            'min_sleep_hours', v_min_sleep,
            'max_sleep_hours', v_max_sleep,
            'logged_days', COALESCE(v_sleep_logged, 0)
        ),
        'phone_usage_statistics', jsonb_build_object(
            'avg_phone_minutes', v_avg_phone,
            'min_phone_minutes', v_min_phone,
            'max_phone_minutes', v_max_phone,
            'logged_days', COALESCE(v_phone_logged, 0)
        ),
        'personal_baseline', jsonb_build_object(
            'baseline_avg_minutes', COALESCE(v_baseline_avg, 0),
            'baseline_avg_minutes_active_days', COALESCE(v_baseline_avg, 0),
            'baseline_days', 180
        ),
        'progress_trend', jsonb_build_object(
            'direction', COALESCE(v_progress_direction, 'insufficient_data'),
            'percent_change_vs_baseline', v_percent_change,
            'current_avg_minutes', v_current_avg
        ),
        'date_range', jsonb_build_object(
            'start_date', v_last_30_start,
            'end_date', p_today,
            'range_days', 30
        ),
        'generated_at', NOW()
    ) INTO result;

    -- Cache the result
    INSERT INTO analytics_cache (user_id, reference_date, payload, expires_at)
    VALUES (p_user_id, p_today, result, NOW() + INTERVAL '30 minutes')
    ON CONFLICT (user_id) DO UPDATE SET
        reference_date = EXCLUDED.reference_date,
        payload = EXCLUDED.payload,
        expires_at = EXCLUDED.expires_at;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
