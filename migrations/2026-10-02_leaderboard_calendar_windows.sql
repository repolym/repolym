-- ============================================================
-- REPOLYM: Leaderboard calendar windows
--   * week      -> from Saturday (Iran week start) up to today
--   * month     -> from day 1 of the current Jalali month up to today
--   * yesterday -> new window (only yesterday)
-- The client sends p_window_start / p_window_end (computed with
-- jalaali-js). If they are NULL the function falls back to its own
-- calculation, so old cached frontends keep working.
-- Everything else (ranking, scores, columns) is unchanged from
-- migrations/fix_leaderboard_sleep_phone.sql
-- ============================================================

BEGIN;

-- The signature changes (2 new params), so the old one must go first.
DROP FUNCTION IF EXISTS public.get_olympiad_leaderboard(TEXT, DATE, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_olympiad_leaderboard(
    p_olympiad_id TEXT,
    p_today DATE,
    p_limit INTEGER DEFAULT 50,
    p_window_type TEXT DEFAULT 'month',
    p_metric TEXT DEFAULT 'smart',
    p_window_start DATE DEFAULT NULL,
    p_window_end DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    window_start DATE;
    window_end DATE;
BEGIN
    IF p_window_start IS NOT NULL THEN
        -- Explicit window sent by the app
        window_start := p_window_start;
        window_end := COALESCE(p_window_end, p_today);
    ELSE
        -- Fallback (old clients / direct calls)
        window_end := p_today;
        IF p_window_type = 'today' THEN
            window_start := p_today;
        ELSIF p_window_type = 'yesterday' THEN
            window_start := p_today - 1;
            window_end := p_today - 1;
        ELSIF p_window_type = 'week' THEN
            -- DOW: Sunday=0 ... Saturday=6  ->  days since Saturday
            window_start := p_today - ((EXTRACT(DOW FROM p_today)::INTEGER + 1) % 7);
        ELSIF p_window_type = 'month' THEN
            window_start := p_today - 30;
        ELSE
            window_start := '2000-01-01'::DATE;
        END IF;
    END IF;

    WITH
    users_in_olympiad AS (
        SELECT id, name, preferences->>'avatar_url' AS avatar_url
        FROM users
        WHERE (p_olympiad_id IS NULL OR olympiad_id = p_olympiad_id)
          AND is_admin = false
    ),
    sessions_window AS (
        SELECT user_id, duration_minutes, date
        FROM study_sessions
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
          AND date >= window_start
          AND date <= window_end
    ),
    user_study AS (
        SELECT user_id,
               COALESCE(SUM(duration_minutes), 0) AS total_minutes,
               COUNT(DISTINCT date) AS active_days
        FROM sessions_window
        GROUP BY user_id
    ),
    tests_window AS (
        SELECT user_id, (score::FLOAT / max_score) * 100 AS pct_score
        FROM tests
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
          AND date >= window_start
          AND date <= window_end
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
    metrics_window AS (
        SELECT user_id, sleep_hours, phone_usage_minutes
        FROM daily_metrics
        WHERE user_id IN (SELECT id FROM users_in_olympiad)
          AND date >= window_start
          AND date <= window_end
    ),
    user_metrics AS (
        SELECT user_id,
               COALESCE(AVG(sleep_hours), 0) AS avg_sleep_hours,
               COALESCE(AVG(phone_usage_minutes), 0) AS avg_phone_minutes
        FROM metrics_window
        WHERE sleep_hours IS NOT NULL OR phone_usage_minutes IS NOT NULL
        GROUP BY user_id
    ),
    combined AS (
        SELECT u.id AS user_id,
               u.name,
               u.avatar_url,
               COALESCE(us.total_minutes, 0) AS total_minutes_30,
               COALESCE(us.active_days, 0) AS active_days_30,
               COALESCE(ubs.best_streak, 0) AS best_streak,
               COALESCE(ut.avg_test_score, 0) AS avg_test_score,
               COALESCE(um.avg_sleep_hours, 0) AS avg_sleep_hours,
               COALESCE(um.avg_phone_minutes, 0) AS avg_phone_minutes
        FROM users_in_olympiad u
        LEFT JOIN user_study us ON u.id = us.user_id
        LEFT JOIN user_tests ut ON u.id = ut.user_id
        LEFT JOIN user_best_streak ubs ON u.id = ubs.user_id
        LEFT JOIN user_metrics um ON u.id = um.user_id
    ),
    max_minutes AS (SELECT MAX(total_minutes_30) AS max_val FROM combined WHERE total_minutes_30 > 0),
    max_active_days AS (SELECT MAX(active_days_30) AS max_val FROM combined WHERE active_days_30 > 0),
    scored AS (
        SELECT user_id, name, avatar_url, total_minutes_30, active_days_30, best_streak, avg_test_score,
               avg_sleep_hours, avg_phone_minutes,
               (0.3 * (CASE WHEN (SELECT max_val FROM max_minutes) > 0 THEN total_minutes_30::FLOAT / (SELECT max_val FROM max_minutes) ELSE 0 END)
                + 0.3 * (CASE WHEN (SELECT max_val FROM max_active_days) > 0 THEN active_days_30::FLOAT / (SELECT max_val FROM max_active_days) ELSE 0 END)
                + 0.4 * (avg_test_score / 100)
               ) * 100 AS composite_score
        FROM combined
    ),
    ranked AS (
        SELECT user_id, name, avatar_url, total_minutes_30, active_days_30, best_streak, avg_test_score,
               avg_sleep_hours, avg_phone_minutes, composite_score,
               ROW_NUMBER() OVER (
                   ORDER BY
                       CASE
                           WHEN p_metric = 'study' THEN total_minutes_30
                           WHEN p_metric = 'consistency' THEN active_days_30 * 0.6 + best_streak * 0.4
                           WHEN p_metric = 'sleep' THEN avg_sleep_hours
                           WHEN p_metric = 'phone' THEN -avg_phone_minutes  -- negative for ascending order
                           ELSE composite_score
                       END DESC
               ) AS rank
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
      'avatar_url', avatar_url,
      'total_minutes_30', total_minutes_30,
      'active_days_30', active_days_30,
      'best_streak', best_streak,
      'avg_test_score', avg_test_score,
      'avg_sleep_hours', ROUND(avg_sleep_hours::NUMERIC, 1),
      'avg_phone_minutes', ROUND(avg_phone_minutes::NUMERIC, 0),
      'composite_score', ROUND(composite_score::NUMERIC, 2),
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
ON FUNCTION public.get_olympiad_leaderboard(TEXT, DATE, INTEGER, TEXT, TEXT, DATE, DATE)
TO authenticated;

COMMIT;

-- Make PostgREST (Supabase API) pick up the new signature immediately
NOTIFY pgrst, 'reload schema';
