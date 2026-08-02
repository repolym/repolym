-- ============================================================
-- ADMIN ANALYTICS RPCs
-- This migration adds functions for admin dashboard analytics
-- including risk scores, anomaly detection, and insights.
-- ============================================================

-- ============================================================
-- 1. GET_RISK_DISTRIBUTION
-- Returns risk level distribution for all students.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_risk_distribution()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Ensure only admins can call this
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH risk_data AS (
        SELECT
            u.id,
            u.name,
            COALESCE(s.current_streak, 0) AS streak,
            COALESCE(s.longest_streak, 0) AS longest_streak,
            COALESCE((
                SELECT AVG(duration_minutes)
                FROM study_sessions
                WHERE user_id = u.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_study,
            COALESCE((
                SELECT COUNT(*)::FLOAT / 30
                FROM study_sessions
                WHERE user_id = u.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS consistency,
            COALESCE((
                SELECT AVG(phone_usage_minutes)
                FROM daily_metrics
                WHERE user_id = u.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_phone,
            COALESCE((
                SELECT AVG(sleep_hours)
                FROM daily_metrics
                WHERE user_id = u.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_sleep
        FROM users u
        LEFT JOIN streaks s ON u.id = s.user_id
        WHERE u.is_admin = false
    ),
    risk_score AS (
        SELECT
            id,
            name,
            -- Weighted risk score (0-100)
            GREATEST(0, LEAST(100,
                (1 - consistency) * 30 +
                (1 - (avg_study / 120)) * 20 +
                (avg_phone / 240) * 20 +
                (1 - (avg_sleep / 7)) * 15 +
                (1 - (streak::FLOAT / 10)) * 15
            )) AS risk_score
        FROM risk_data
    )
    SELECT jsonb_build_object(
        'averageRisk', COALESCE((SELECT AVG(risk_score) FROM risk_score), 0),
        'atRiskCount', (SELECT COUNT(*) FROM risk_score WHERE risk_score > 70),
        'recoveryScore', COALESCE((SELECT AVG(risk_score) FROM risk_score WHERE risk_score < 30), 0),
        'distribution', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'riskLevel', CASE
                        WHEN risk_score >= 80 THEN 'critical'
                        WHEN risk_score >= 60 THEN 'high'
                        WHEN risk_score >= 40 THEN 'medium'
                        ELSE 'low'
                    END,
                    'count', COUNT(*)
                )
            )
            FROM risk_score
            GROUP BY CASE
                WHEN risk_score >= 80 THEN 'critical'
                WHEN risk_score >= 60 THEN 'high'
                WHEN risk_score >= 40 THEN 'medium'
                ELSE 'low'
            END
        ), '[]'::jsonb)
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_risk_distribution() TO authenticated;

-- ============================================================
-- 2. GET_USER_RISK_SCORE
-- Returns detailed risk score for a specific user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_risk_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH risk_data AS (
        SELECT
            u.id,
            u.name,
            COALESCE(s.current_streak, 0) AS streak,
            COALESCE(s.longest_streak, 0) AS longest_streak,
            COALESCE((
                SELECT AVG(duration_minutes)
                FROM study_sessions
                WHERE user_id = p_user_id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_study,
            COALESCE((
                SELECT COUNT(*)::FLOAT / 30
                FROM study_sessions
                WHERE user_id = p_user_id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS consistency,
            COALESCE((
                SELECT AVG(phone_usage_minutes)
                FROM daily_metrics
                WHERE user_id = p_user_id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_phone,
            COALESCE((
                SELECT AVG(sleep_hours)
                FROM daily_metrics
                WHERE user_id = p_user_id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0) AS avg_sleep,
            COALESCE((
                SELECT COUNT(*)
                FROM study_sessions
                WHERE user_id = p_user_id
                  AND date = CURRENT_DATE
            ), 0) AS studied_today,
            COALESCE((
                SELECT COUNT(*)
                FROM daily_metrics
                WHERE user_id = p_user_id
                  AND date = CURRENT_DATE
            ), 0) AS checked_in_today
        FROM users u
        LEFT JOIN streaks s ON u.id = s.user_id
        WHERE u.id = p_user_id
    )
    SELECT jsonb_build_object(
        'userId', id,
        'name', name,
        'riskScore', GREATEST(0, LEAST(100,
            (1 - consistency) * 30 +
            (1 - (avg_study / 120)) * 20 +
            (avg_phone / 240) * 20 +
            (1 - (avg_sleep / 7)) * 15 +
            (1 - (streak::FLOAT / 10)) * 15
        )),
        'components', jsonb_build_object(
            'consistency', consistency,
            'avgStudy', avg_study,
            'avgPhone', avg_phone,
            'avgSleep', avg_sleep,
            'streak', streak,
            'longestStreak', longest_streak,
            'studiedToday', studied_today > 0,
            'checkedInToday', checked_in_today > 0
        )
    ) INTO result
    FROM risk_data;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_risk_score(UUID) TO authenticated;

-- ============================================================
-- 3. INTERVENTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('meeting', 'phone_call', 'message', 'warning', 'motivational', 'parent_contact', 'status_change', 'private_note', 'public_note', 'risk_override')),
    title TEXT NOT NULL,
    description TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interventions_select_admin" ON interventions;
CREATE POLICY "interventions_select_admin" ON interventions FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "interventions_insert_admin" ON interventions;
CREATE POLICY "interventions_insert_admin" ON interventions FOR INSERT WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "interventions_update_admin" ON interventions;
CREATE POLICY "interventions_update_admin" ON interventions FOR UPDATE USING (public.is_admin_user());

DROP POLICY IF EXISTS "interventions_delete_admin" ON interventions;
CREATE POLICY "interventions_delete_admin" ON interventions FOR DELETE USING (public.is_admin_user());

-- ============================================================
-- 4. RISK_SCORES TABLE (for historical tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    components JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_scores_select_admin" ON risk_scores;
CREATE POLICY "risk_scores_select_admin" ON risk_scores FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "risk_scores_insert_admin" ON risk_scores;
CREATE POLICY "risk_scores_insert_admin" ON risk_scores FOR INSERT WITH CHECK (public.is_admin_user());

-- ============================================================
-- 5. TRIGGER TO AUTOMATICALLY RECORD RISK SCORE DAILY
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_daily_risk_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    risk_val INTEGER;
    comp JSONB;
BEGIN
    FOR user_record IN
        SELECT id FROM users WHERE is_admin = false
    LOOP
        SELECT
            GREATEST(0, LEAST(100,
                (1 - COALESCE((
                    SELECT COUNT(*)::FLOAT / 30
                    FROM study_sessions
                    WHERE user_id = user_record.id
                      AND date >= (CURRENT_DATE - INTERVAL '30 days')
                ), 0)) * 30 +
                (1 - COALESCE((
                    SELECT AVG(duration_minutes) / 120
                    FROM study_sessions
                    WHERE user_id = user_record.id
                      AND date >= (CURRENT_DATE - INTERVAL '30 days')
                ), 0)) * 20 +
                (COALESCE((
                    SELECT AVG(phone_usage_minutes) / 240
                    FROM daily_metrics
                    WHERE user_id = user_record.id
                      AND date >= (CURRENT_DATE - INTERVAL '30 days')
                ), 0)) * 20 +
                (1 - COALESCE((
                    SELECT AVG(sleep_hours) / 7
                    FROM daily_metrics
                    WHERE user_id = user_record.id
                      AND date >= (CURRENT_DATE - INTERVAL '30 days')
                ), 0)) * 15 +
                (1 - COALESCE((
                    SELECT current_streak / 10.0
                    FROM streaks
                    WHERE user_id = user_record.id
                ), 0)) * 15
            )) INTO risk_val;

        comp := jsonb_build_object(
            'consistency', COALESCE((
                SELECT COUNT(*)::FLOAT / 30
                FROM study_sessions
                WHERE user_id = user_record.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0),
            'avgStudy', COALESCE((
                SELECT AVG(duration_minutes)
                FROM study_sessions
                WHERE user_id = user_record.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0),
            'avgPhone', COALESCE((
                SELECT AVG(phone_usage_minutes)
                FROM daily_metrics
                WHERE user_id = user_record.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0),
            'avgSleep', COALESCE((
                SELECT AVG(sleep_hours)
                FROM daily_metrics
                WHERE user_id = user_record.id
                  AND date >= (CURRENT_DATE - INTERVAL '30 days')
            ), 0),
            'streak', COALESCE((
                SELECT current_streak
                FROM streaks
                WHERE user_id = user_record.id
            ), 0)
        );

        INSERT INTO risk_scores (user_id, score, components)
        VALUES (user_record.id, risk_val, comp)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;

-- Schedule this to run daily via pg_cron or a Supabase Edge Function.
-- For now, we can call it manually or via a cron job.

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_admin_id ON interventions(admin_id);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_user_id ON risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_created_at ON risk_scores(created_at DESC);