-- ============================================================
-- BULK RISK SCORES RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_risk_scores_bulk(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, score INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        rs.user_id,
        rs.score
    FROM risk_scores rs
    WHERE rs.user_id = ANY(p_user_ids)
    AND rs.created_at = (
        SELECT MAX(created_at) 
        FROM risk_scores 
        WHERE user_id = rs.user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_risk_scores_bulk(UUID[]) TO authenticated;