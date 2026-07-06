// ============================================================
// FILE: src/components/common/AdminRoute.tsx (COMPLETE)
// ============================================================
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from './Loading'

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (!user || !user.is_admin) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}