// src/components/common/AuthGuard.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from './Loading'

interface AuthGuardProps {
    children: React.ReactNode
    requireOnboarding?: boolean
    requireBaseline?: boolean
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    requireOnboarding = true,
    requireBaseline = true,
}) => {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return <PageLoader />
    }

    // If not authenticated, go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // If we're on /onboarding, allow rendering even if onboarding is incomplete
    if (location.pathname === '/onboarding') {
        return <>{children}</>
    }

    // If we're on /baseline, allow rendering even if baseline is incomplete
    if (location.pathname === '/baseline') {
        return <>{children}</>
    }

    // Check onboarding
    if (requireOnboarding && !user.onboarding_completed) {
        return <Navigate to="/onboarding" replace />
    }

    // Check baseline survey
    if (requireBaseline && !user.has_completed_baseline_survey) {
        return <Navigate to="/baseline" replace />
    }

    // All good
    return <>{children}</>
}
