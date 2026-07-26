import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { PageLoader } from './Loading';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!user) {
                setIsAdmin(false);
                setChecking(false);
                return;
            }
            try {
                // Use RLS-protected query
                const { data, error } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();
                if (error || !data) {
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data.is_admin);
                }
            } catch {
                setIsAdmin(false);
            } finally {
                setChecking(false);
            }
        };
        verifyAdmin();
    }, [user]);

    if (isLoading || checking) return <PageLoader />;
    if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};