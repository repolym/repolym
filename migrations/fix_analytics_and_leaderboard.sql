-- ============================================================
-- FIX ANALYTICS AND LEADERBOARD RPC FUNCTIONS
-- This migration corrects casting errors and ensures both
-- functions are created with the correct signatures.
-- ============================================================

-- ============================================================
-- 1. FIX get_analytics FUNCTION
-- The error "cannot cast type record to double precision"
-- occurs when a CTE returns a row type instead of a scalar.
-- We rewrite the function to avoid ambiguous casts and ensure
-- all subqueries return scalar values.
-- ============================================================

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
    active_days_30 AS (
        SELECT COUNT(DISTINCT date) AS count FROM sessions_last_30
    ),
    total_minutes_30 AS (
        SELECT COALESCE(SUM(duration_minutes), 0) AS sum FROM sessions_last_30
    ),
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
    longest_streak_val AS (
        SELECT COALESCE(MAX(len), 0) AS val FROM streak_lengths
    ),
    current_streak_val AS (
        SELECT COALESCE(
            (SELECT len FROM streak_lengths WHERE grp = (SELECT MAX(grp) FROM streak_groups)),
            0
        ) AS val
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
    total_subject_minutes AS (
        SELECT COALESCE(SUM(minutes), 0) AS sum FROM subject_dist
    ),
    subject_dist_percent AS (
        SELECT subject_id, name, color, minutes,
               CASE WHEN (SELECT sum FROM total_subject_minutes) > 0
                    THEN (minutes::NUMERIC / (SELECT sum FROM total_subject_minutes)) * 100
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
        SELECT COALESCE(AVG(minutes), 0) AS avg_minutes,
               COALESCE(COUNT(*), 0) AS days
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
        SELECT COALESCE(AVG(minutes), 0) AS avg_minutes
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
    consistency_score AS (
        SELECT COALESCE((SELECT count FROM active_days_30)::FLOAT / 30 * 100, 0) AS score
    ),
    goal_completion_score AS (
        SELECT COALESCE(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END), 0) AS score
        FROM goals
        WHERE user_id = p_user_id AND start_date >= (p_today - INTERVAL '30 days')::DATE
    ),
    test_performance_score AS (
        SELECT COALESCE(AVG((score::FLOAT / max_score) * 100), 0) AS score
        FROM tests
        WHERE user_id = p_user_id AND date >= (p_today - INTERVAL '30 days')::DATE
          AND max_score > 0
    ),
    effective_study_time_score AS (
        SELECT COALESCE(AVG(duration_minutes), 0) / 120 * 100 AS score
        FROM sessions_last_30
    ),
    productivity_score_calc AS (
        SELECT (0.3 * (SELECT score FROM consistency_score) +
                0.2 * (SELECT score FROM goal_completion_score) +
                0.3 * (SELECT score FROM test_performance_score) +
                0.2 * (SELECT score FROM effective_study_time_score)) AS score
    ),
    sleep_consistency_score AS (
        SELECT CASE WHEN (SELECT avg_sleep FROM sleep_stats) IS NOT NULL
                    THEN (1 - ((SELECT max_sleep FROM sleep_stats) - (SELECT min_sleep FROM sleep_stats)) / 24) * 100
                    ELSE 0 END AS score
    ),
    gap_recovery_score AS (
        SELECT 0 AS score
    ),
    phone_usage_impact_score AS (
        SELECT CASE WHEN (SELECT avg_phone FROM phone_stats) IS NOT NULL
                    THEN (1 - (SELECT avg_phone FROM phone_stats) / 1440) * 100
                    ELSE 0 END AS score
    ),
    recovery_score_calc AS (
        SELECT (0.4 * (SELECT score FROM sleep_consistency_score) +
                0.3 * (SELECT score FROM gap_recovery_score) +
                0.3 * (SELECT score FROM phone_usage_impact_score)) AS score
    ),
    progress_direction AS (
        SELECT
            CASE
                WHEN (SELECT avg_minutes FROM current_week_avg) = 0 OR (SELECT avg_minutes FROM baseline_stats) = 0 THEN 'insufficient_data'::TEXT
                WHEN (SELECT avg_minutes FROM current_week_avg) > (SELECT avg_minutes FROM baseline_stats) * 1.1 THEN 'improving'
                WHEN (SELECT avg_minutes FROM current_week_avg) < (SELECT avg_minutes FROM baseline_stats) * 0.9 THEN 'declining'
                ELSE 'stable'
            END AS direction,
            CASE
                WHEN (SELECT avg_minutes FROM baseline_stats) > 0
                THEN ((SELECT avg_minutes FROM current_week_avg) - (SELECT avg_minutes FROM baseline_stats)) / (SELECT avg_minutes FROM baseline_stats) * 100
                ELSE NULL
            END AS percent_change
    ),
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
    difficulty_total AS (
        SELECT COALESCE(SUM(sessions_count), 0) AS total FROM difficulty_agg
    ),
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
                'consistency', (SELECT score FROM consistency_score),
                'goal_completion', (SELECT score FROM goal_completion_score),
                'test_performance', (SELECT score FROM test_performance_score),
                'effective_study_time', (SELECT score FROM effective_study_time_score)
            )
        ),
        'recovery_score', jsonb_build_object(
            'recovery_score', (SELECT score FROM recovery_score_calc),
            'components', jsonb_build_object(
                'sleep_consistency', (SELECT score FROM sleep_consistency_score),
                'gap_recovery', (SELECT score FROM gap_recovery_score),
                'phone_usage_impact', (SELECT score FROM phone_usage_impact_score)
            )
        ),
        'study_streak', jsonb_build_object(
            'current_streak', (SELECT val FROM current_streak_val),
            'longest_streak', (SELECT val FROM longest_streak_val),
            'last_study_date', (SELECT MAX(date) FROM all_sessions)
        ),
        'study_consistency', jsonb_build_object(
            'consistency_score', (SELECT COALESCE((SELECT count FROM active_days_30)::FLOAT / 30 * 100, 0)),
            'active_days', (SELECT count FROM active_days_30),
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
        'subject_distribution', (SELECT jsonb_agg(jsonb_build_object('subject_id', subject_id, 'subject_name', name, 'color', color, 'minutes', minutes, 'percent', ROUND(percent::NUMERIC, 1))) FROM subject_dist_percent),
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
            'baseline_avg_minutes', (SELECT avg_minutes FROM baseline_stats),
            'baseline_avg_minutes_active_days', (SELECT avg_minutes FROM baseline_stats),
            'baseline_days', (SELECT days FROM baseline_stats)
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
        'subject_test_stats', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'subject_id', subject_id,
                'subject_name', name,
                'color', color,
                'tests_count', tests_count,
                'avg_accuracy_percent', ROUND(COALESCE(avg_accuracy_percent, 0)::NUMERIC, 1)
            )) FROM subject_test_stats_calc),
            '[]'::jsonb
        ),
        'difficulty_distribution', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'difficulty', difficulty,
                'sessions_count', sessions_count,
                'minutes', minutes,
                'percent', CASE WHEN (SELECT total FROM difficulty_total) > 0
                                THEN ROUND((sessions_count::NUMERIC / (SELECT total FROM difficulty_total)) * 100, 1)
                                ELSE 0 END
            )) FROM difficulty_agg),
            '[]'::jsonb
        ),
        'weekly_trend', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'week_start', week_start,
                'minutes', minutes,
                'tests_count', tests_count,
                'avg_accuracy_percent', ROUND(avg_accuracy_percent::NUMERIC, 1)
            )) FROM weekly_trend_data),
            '[]'::jsonb
        ),
        'monthly_trend', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'month', month_start,
                'minutes', minutes,
                'tests_count', tests_count,
                'avg_accuracy_percent', ROUND(avg_accuracy_percent::NUMERIC, 1)
            )) FROM monthly_trend_data),
            '[]'::jsonb
        ),
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

-- ============================================================
-- 2. FIX get_olympiad_leaderboard FUNCTION
-- Ensure it exists and has correct signature.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_olympiad_leaderboard(
    p_olympiad_id TEXT,
    p_today DATE,
    p_limit INTEGER DEFAULT 50,
    p_window_type TEXT DEFAULT 'month',
    p_metric TEXT DEFAULT 'smart'
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
        SELECT user_id, (score::FLOAT / max_score) * 100 AS pct_score
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
ON FUNCTION public.get_olympiad_leaderboard(text, date, integer, text, text)
TO authenticated;