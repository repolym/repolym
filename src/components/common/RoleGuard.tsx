// src/components/common/RoleGuard.tsx - NEW
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from './Loading';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: Array<'student' | 'admin' | 'ai_olympiad_consultant'>;
    requireAdmin?: boolean;
    requireConsultant?: boolean;
    fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
    children,
    allowedRoles = [],
    requireAdmin = false,
    requireConsultant = false,
    fallbackPath = '/dashboard',
}) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.role || 'student';

    // Check if the user's role is allowed
    const isAllowed = () => {
        if (requireAdmin && userRole === 'admin') return true;
        if (requireConsultant && userRole === 'ai_olympiad_consultant') return true;
        if (allowedRoles.length > 0 && allowedRoles.includes(userRole)) return true;
        return false;
    };

    if (!isAllowed()) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <>{children}</>;
};

export default RoleGuard;