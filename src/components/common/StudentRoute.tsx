// ============================================================
// FILE: src/components/common/StudentRoute.tsx (COMPLETE)
// ============================================================
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from './Loading'

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (user?.is_admin) {
        return <Navigate to="/admin" replace />
    }

    return <>{children}</>
}