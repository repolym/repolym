import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const useOlympiadList = () => {
    const [olympiads, setOlympiads] = useState<{ id: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOlympiads = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('olympiad_id')
                    .not('olympiad_id', 'is', null)
                    .limit(1000);
                if (error) throw error;
                const unique = [...new Set(data.map(u => u.olympiad_id))].filter(Boolean) as string[];
                setOlympiads(unique.map(id => ({ id, label: id })));
            } catch (error) {
                console.error('Failed to fetch olympiads:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOlympiads();
    }, []);

    return { olympiads, loading };
};