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
