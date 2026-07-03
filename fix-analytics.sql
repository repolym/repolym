-- =============================================
-- FIX: Drop all conflicting objects and recreate
-- =============================================

DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS daily_metrics CASCADE;
DROP TABLE IF EXISTS daily_study_summary CASCADE;
DROP FUNCTION IF EXISTS refresh_daily_study_summary CASCADE;
DROP FUNCTION IF EXISTS get_analytics CASCADE;
DROP FUNCTION IF EXISTS get_olympiad_leaderboard CASCADE;

-- =============================================
-- 1. daily_metrics
-- =============================================
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

-- =============================================
-- 2. daily_study_summary
-- =============================================
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

-- =============================================
-- 3. analytics_cache
-- =============================================
CREATE TABLE analytics_cache (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reference_date DATE NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- =============================================
-- 4. Trigger function to refresh daily summary
-- =============================================
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

-- =============================================
-- 5. Main analytics function (get_analytics)
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
    -- Streaks (using gaps-and-islands with date arithmetic)
    streak_groups AS (
        SELECT
            date,
            total_minutes > 0 AS studied,
            -- Subtract a row number (as days) to form groups of consecutive studied days
            date - (ROW_NUMBER() OVER (PARTITION BY total_minutes > 0 ORDER BY date) || ' days')::INTERVAL AS grp
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
        (SELECT slope * 86400 FROM trend_calc),   -- slope per day (minutes per day)
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

    -- Build JSON result
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

-- =============================================
-- 6. Leaderboard function
-- =============================================
CREATE OR REPLACE FUNCTION get_olympiad_leaderboard(
    p_olympiad_id TEXT,
    p_today DATE DEFAULT CURRENT_DATE,
    p_limit INT DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
    v_30_start DATE;
    v_90_start DATE;
    result JSONB;
BEGIN
    v_30_start := p_today - INTERVAL '30 days';
    v_90_start := p_today - INTERVAL '90 days';

    WITH olympiad_users AS (
        SELECT id, name
        FROM users
        WHERE olympiad_id = p_olympiad_id
    ),
    study_30 AS (
        SELECT
            ss.user_id,
            COALESCE(SUM(ss.duration_minutes), 0)          AS total_minutes_30,
            COUNT(DISTINCT ss.date)                        AS active_days_30
        FROM study_sessions ss
        WHERE ss.user_id IN (SELECT id FROM olympiad_users)
          AND ss.date >= v_30_start
          AND ss.date <= p_today
        GROUP BY ss.user_id
    ),
    studied_days AS (
        SELECT
            ss.user_id,
            ss.date
        FROM study_sessions ss
        WHERE ss.user_id IN (SELECT id FROM olympiad_users)
          AND ss.date >= v_90_start
          AND ss.date <= p_today
        GROUP BY ss.user_id, ss.date
        HAVING SUM(ss.duration_minutes) > 0
    ),
    streak_grp AS (
        SELECT
            user_id,
            date,
            date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date) || ' days')::INTERVAL AS grp
        FROM studied_days
    ),
    streak_max AS (
        SELECT user_id, MAX(cnt) AS best_streak
        FROM (
            SELECT user_id, grp, COUNT(*) AS cnt
            FROM streak_grp
            GROUP BY user_id, grp
        ) sub
        GROUP BY user_id
    ),
    test_avg AS (
        SELECT
            t.user_id,
            ROUND(AVG((t.score::NUMERIC / NULLIF(t.max_score, 0)) * 100), 1) AS avg_score
        FROM tests t
        WHERE t.user_id IN (SELECT id FROM olympiad_users)
          AND t.date >= v_30_start
        GROUP BY t.user_id
    ),
    ranked AS (
        SELECT
            ou.id                                                          AS user_id,
            ou.name,
            COALESCE(s30.total_minutes_30, 0)                             AS total_minutes_30,
            COALESCE(s30.active_days_30, 0)                               AS active_days_30,
            COALESCE(sm.best_streak, 0)                                   AS best_streak,
            COALESCE(ta.avg_score, 0)                                     AS avg_test_score,
            ROUND(
                LEAST(COALESCE(s30.active_days_30, 0)::NUMERIC / 30 * 100, 100) * 0.40 +
                LEAST(COALESCE(s30.total_minutes_30, 0)::NUMERIC / 3000 * 100, 100) * 0.30 +
                COALESCE(ta.avg_score, 0) * 0.30
            , 1) AS composite_score,
            ROW_NUMBER() OVER (
                ORDER BY
                    ROUND(
                        LEAST(COALESCE(s30.active_days_30, 0)::NUMERIC / 30 * 100, 100) * 0.40 +
                        LEAST(COALESCE(s30.total_minutes_30, 0)::NUMERIC / 3000 * 100, 100) * 0.30 +
                        COALESCE(ta.avg_score, 0) * 0.30
                    , 1) DESC,
                    COALESCE(s30.total_minutes_30, 0) DESC,
                    COALESCE(s30.active_days_30, 0) DESC
            ) AS rank
        FROM olympiad_users ou
        LEFT JOIN study_30  s30 ON s30.user_id = ou.id
        LEFT JOIN streak_max sm  ON sm.user_id  = ou.id
        LEFT JOIN test_avg   ta  ON ta.user_id  = ou.id
    )
    SELECT jsonb_build_object(
        'olympiad_id',   p_olympiad_id,
        'generated_at',  NOW(),
        'total_users',   (SELECT COUNT(*) FROM olympiad_users),
        'entries', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'rank',              rank,
                    'user_id',           user_id,
                    'name',              name,
                    'total_minutes_30',  total_minutes_30,
                    'active_days_30',    active_days_30,
                    'best_streak',       best_streak,
                    'avg_test_score',    avg_test_score,
                    'composite_score',   composite_score
                )
                ORDER BY rank
            ),
            '[]'::jsonb
        )
    ) INTO result
    FROM ranked
    WHERE rank <= p_limit;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_analytics(UUID, DATE, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_olympiad_leaderboard(TEXT, DATE, INT) TO authenticated;