import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { formatError } from '../utils/error-handler';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string | null;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

type SessionCreate = {
    title?: string;
    messages?: ChatMessage[];
};

type SessionUpdate = {
    title?: string;
    messages?: ChatMessage[];
};

export const useChatSessions = (userId: string | null) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    // Fetch all sessions for the user (excluding soft-deleted)
    const fetchSessions = useCallback(async (force = false) => {
        if (!userId) return;
        if (loading && !force) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: err } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('deleted_at', null)
                .order('updated_at', { ascending: false });

            if (err) throw err;
            if (mountedRef.current) setSessions(data || []);
        } catch (err) {
            const msg = formatError(err);
            setError(msg);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        mountedRef.current = true;
        fetchSessions();
        return () => { mountedRef.current = false; };
    }, [fetchSessions]);

    // Create a new session
    const createSession = useCallback(async (data: SessionCreate = {}): Promise<ChatSession | null> => {
        if (!userId) return null;
        try {
            const newSession = {
                user_id: userId,
                title: data.title || null,
                messages: data.messages || [],
            };
            const { data: created, error: err } = await supabase
                .from('chat_sessions')
                .insert(newSession)
                .select()
                .single();

            if (err) throw err;
            await fetchSessions(true);
            return created;
        } catch (err) {
            setError(formatError(err));
            return null;
        }
    }, [userId, fetchSessions]);

    // Update an existing session
    const updateSession = useCallback(async (id: string, updates: SessionUpdate): Promise<ChatSession | null> => {
        if (!userId) return null;
        try {
            const payload: any = { ...updates, updated_at: new Date().toISOString() };
            const { data: updated, error: err } = await supabase
                .from('chat_sessions')
                .update(payload)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();

            if (err) throw err;
            await fetchSessions(true);
            return updated;
        } catch (err) {
            setError(formatError(err));
            return null;
        }
    }, [userId, fetchSessions]);

    // Soft-delete a session
    const deleteSession = useCallback(async (id: string): Promise<boolean> => {
        if (!userId) return false;
        try {
            const { error: err } = await supabase
                .from('chat_sessions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', userId);

            if (err) throw err;
            await fetchSessions(true);
            return true;
        } catch (err) {
            setError(formatError(err));
            return false;
        }
    }, [userId, fetchSessions]);

    // Helper: add messages to an existing session (appends to messages array)
    const appendMessages = useCallback(async (id: string, newMessages: ChatMessage[]) => {
        if (!userId) return null;
        try {
            // First, fetch the current session to get its messages array
            const { data: current, error: fetchErr } = await supabase
                .from('chat_sessions')
                .select('messages')
                .eq('id', id)
                .single();

            if (fetchErr) throw fetchErr;

            const existingMessages = (current?.messages || []) as ChatMessage[];
            const merged = [...existingMessages, ...newMessages];

            // Update the session with the merged messages
            return await updateSession(id, { messages: merged });
        } catch (err) {
            setError(formatError(err));
            return null;
        }
    }, [userId, updateSession]);

    return {
        sessions,
        loading,
        error,
        refetch: fetchSessions,
        createSession,
        updateSession,
        deleteSession,
        appendMessages,
    };
};