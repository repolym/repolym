-- ========================================================
-- Migration: add avatar_url to get_olympiad_leaderboard()
-- ========================================================
-- Run this in the Supabase SQL editor. It replaces the function body
-- to also select each user's preferences->>'avatar_url' and thread it
-- through to the JSON 'entries' the frontend renders (leaderboard
-- podium/list, admin olympiad leaderboard).
--
-- IMPORTANT: match the parameter list below to whatever your current
-- live function actually has. This repo's schema file shows a
-- 4-parameter version (no p_metric), but the frontend calls it with a
-- 5th "p_metric" argument — if your deployed function already has
-- p_metric, add it back to the signature and DECLARE section here
-- before running.

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
               u.avatar_url,
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
        SELECT user_id, name, avatar_url, total_minutes_30, active_days_30, best_streak, avg_test_score,
               (0.3 * (CASE WHEN (SELECT max_val FROM max_minutes) > 0 THEN total_minutes_30::FLOAT / (SELECT max_val FROM max_minutes) ELSE 0 END)
                + 0.3 * (CASE WHEN (SELECT max_val FROM max_active_days) > 0 THEN active_days_30::FLOAT / (SELECT max_val FROM max_active_days) ELSE 0 END)
                + 0.4 * (avg_test_score / 100)
               ) * 100 AS composite_score
        FROM combined
    ),
    ranked AS (
        SELECT user_id, name, avatar_url, total_minutes_30, active_days_30, best_streak, avg_test_score, composite_score,
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
      'avatar_url', avatar_url,
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
ON FUNCTION public.get_olympiad_leaderboard(text, date, integer, text)
TO authenticated;
