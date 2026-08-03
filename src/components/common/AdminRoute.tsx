// src/components/common/AdminRoute.tsx - UPDATED
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { PageLoader } from './Loading';

interface AdminRouteProps {
    children: React.ReactNode;
    allowConsultant?: boolean;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, allowConsultant = false }) => {
    const { user, isLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verifyAccess = async () => {
            if (!user) {
                setIsAuthorized(false);
                setChecking(false);
                return;
            }

            try {
                // Check if user is admin or consultant (if allowed)
                const { data, error } = await supabase
                    .from('users')
                    .select('is_admin, role')
                    .eq('id', user.id)
                    .single();

                if (error || !data) {
                    setIsAuthorized(false);
                } else {
                    const isAdmin = data.is_admin || data.role === 'admin';
                    const isConsultant = data.role === 'ai_olympiad_consultant';
                    const authorized = isAdmin || (allowConsultant && isConsultant);
                    setIsAuthorized(authorized);
                }
            } catch {
                setIsAuthorized(false);
            } finally {
                setChecking(false);
            }
        };

        verifyAccess();
    }, [user, allowConsultant]);

    if (isLoading || checking) return <PageLoader />;
    if (!user || !isAuthorized) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

export default AdminRoute;