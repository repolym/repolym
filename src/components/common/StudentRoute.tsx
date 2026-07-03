import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-text-tertiary">در حال بارگذاری...</p>
            </div>
        )
    }

    // اگر کاربر ادمین است، نباید به صفحات دانش‌آموزی دسترسی داشته باشد
    if (user?.is_admin) {
        return <Navigate to="/admin" replace />
    }

    // اگر اصلاً وارد نشده، ProtectedRoute قبلاً بررسی کرده
    return <>{children}</>
}
