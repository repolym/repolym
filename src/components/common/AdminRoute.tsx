import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-text-tertiary">در حال بارگذاری...</p>
            </div>
        )
    }

    if (!user || !user.is_admin) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
