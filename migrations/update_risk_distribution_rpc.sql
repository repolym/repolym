-- ============================================================
-- UPDATE RISK DISTRIBUTION RPC WITH OLYMPIAD FILTER
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_risk_distribution(p_olympiad_id TEXT DEFAULT NULL)
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
          AND (p_olympiad_id IS NULL OR u.olympiad_id = p_olympiad_id)
    ),
    risk_score AS (
        SELECT
            id,
            name,
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

GRANT EXECUTE ON FUNCTION public.get_risk_distribution(TEXT) TO authenticated;