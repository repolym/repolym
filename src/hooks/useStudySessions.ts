import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import type { StudySession, SessionFormData } from '../types/database';
import { formatError } from '../utils/error-handler';
import { queryDeduplicator } from '../utils/query-deduplicator';
import { logger } from '../utils/logger';
import { validateSessionForm } from '../utils/validation';

interface UseStudySessionsParams {
  userId: string | null;
  dateFrom?: string;
  dateTo?: string;
  subjectId?: string | null;
}

const CACHE_TTL = 60_000;

export const useStudySessions = ({ userId, dateFrom, dateTo, subjectId }: UseStudySessionsParams) => {
  const [data, setData] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const cacheKey = `study_sessions|${userId}|${dateFrom}|${dateTo}|${subjectId || 'all'}`;

  const executeQuery = useCallback(
    async (userId: string, dateFrom?: string, dateTo?: string, subjectId?: string | null): Promise<StudySession[]> => {
      let query = supabase
        .from('study_sessions')
        .select('*, subjects(id, name, color)')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      if (subjectId) query = query.eq('subject_id', subjectId);

      const { data: rows, error: err } = await query;
      if (err) throw err;
      return (rows as StudySession[]) || [];
    },
    []
  );

  const fetch = useCallback(
    async (forceRefresh = false) => {
      if (!userId || !mountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const result = await queryDeduplicator.dedupedQuery(
          cacheKey,
          () => executeQuery(userId, dateFrom, dateTo, subjectId),
          forceRefresh ? 0 : CACHE_TTL
        );
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          const message = formatError(err);
          setError(message);
          setData([]);
          logger.error('Failed to fetch study sessions', err, { userId, dateFrom, dateTo, subjectId });
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [userId, dateFrom, dateTo, subjectId, cacheKey, executeQuery]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  const createSession = useCallback(
    async (formData: SessionFormData): Promise<boolean> => {
      if (!userId) return false;
      const validation = validateSessionForm({
        date: formData.date,
        duration_minutes: formData.duration_minutes,
      });
      if (!validation.allValid) {
        setError('داده‌های ورودی نامعتبر است');
        return false;
      }
      try {
        // ✅ اطمینان از اینکه subject_id به درستی در payload قرار می‌گیرد
        const payload = {
          user_id: userId,
          subject_id: formData.subject_id || null,
          date: formData.date,
          duration_minutes: formData.duration_minutes,
          activities: formData.activities || null,
          resource: formData.resource || null,
          question_count: formData.question_count || null,
          question_difficulty: formData.question_difficulty || null,
          estimated_difficulty: formData.estimated_difficulty || null,
          question_type: formData.question_type || null,
          todo_relation: formData.todo_relation || null,
          tags: formData.tags || null,
        };

        const { error: err } = await supabase.from('study_sessions').insert([payload]);
        if (err) throw err;
        queryDeduplicator.invalidate(cacheKey);
        await fetch(true);
        return true;
      } catch (err) {
        const message = formatError(err);
        setError(message);
        logger.error('Failed to create study session', err, { userId, formData });
        return false;
      }
    },
    [userId, cacheKey, fetch]
  );

  const updateSession = useCallback(
    async (id: string, formData: Partial<SessionFormData>): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { error: err } = await supabase
          .from('study_sessions')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId);
        if (err) throw err;
        queryDeduplicator.invalidate(cacheKey);
        await fetch(true);
        return true;
      } catch (err) {
        const message = formatError(err);
        setError(message);
        logger.error('Failed to update study session', err, { userId, id, formData });
        return false;
      }
    },
    [userId, cacheKey, fetch]
  );

  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { error: err } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (err) throw err;
        queryDeduplicator.invalidate(cacheKey);
        await fetch(true);
        return true;
      } catch (err) {
        const message = formatError(err);
        setError(message);
        logger.error('Failed to delete study session', err, { userId, id });
        return false;
      }
    },
    [userId, cacheKey, fetch]
  );

  return {
    data,
    loading,
    error,
    refetch: () => fetch(true),
    createSession,
    updateSession,
    deleteSession,
  };
};