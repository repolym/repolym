// src/App.tsx (SIMPLIFIED)
import React, { Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardProvider } from './context/DashboardContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'
import { AuthGuard } from './components/common/AuthGuard'
import { AdminRoute } from './components/common/AdminRoute'
import { ToastContainer } from './components/common/Toast'
import { PageLoader } from './components/common/Loading'
import { ErrorBoundary } from './components/common/ErrorBoundary'

import AdminDashboard from './components/admin/AdminDashboard'
import { AdminProfile } from './components/admin/AdminProfile'
import { UserManagement } from './components/admin/UserManagement'
import { ActivityLog } from './components/admin/ActivityLog'
import { AdminManagement } from './components/admin/AdminManagement'
import { UserDetail } from './components/admin/UserDetail'
import { OlympiadManagement } from './components/admin/OlympiadManagement'
import { LoginPage } from './components/auth/LoginForm'
import { RegisterPage } from './components/auth/RegisterForm'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { StudySessionsPage } from './components/study/StudySessionsPage'
import { GoalsPage } from './components/goals/GoalsPage'
import { TestsPage } from './components/tests/TestsPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { PlanningPage } from './components/plans/PlanningPage'
import { TodosPage } from './components/todos/TodosPage'
import FocusMode from './components/focus/FocusMode'
import PublicStudyPage from './components/public/PublicStudyPage'
import BaselineSurvey from './components/survey/BaselineSurvey'
import OnboardingFlow from './components/onboarding/OnboardingFlow'

// ---------- Root handler ----------
const RootHandler: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (!user) return <Navigate to="/login" replace />

  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  if (!user.has_completed_baseline_survey) return <Navigate to="/baseline" replace />

  return <Navigate to="/dashboard" replace />
}

// ---------- Student Layout ----------
const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard>
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  </AuthGuard>
)

// ---------- Admin Layout ----------
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard>
    <AdminRoute>
      <DashboardProvider>
        <AppShell>{children}</AppShell>
      </DashboardProvider>
    </AdminRoute>
  </AuthGuard>
)

// ---------- App ----------
const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/public/:userId" element={<PublicStudyPage />} />

                {/* Admin */}
                <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/profile" element={<AdminLayout><AdminProfile /></AdminLayout>} />
                <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
                <Route path="/admin/users/:userId" element={<AdminLayout><UserDetail /></AdminLayout>} />
                <Route path="/admin/logs" element={<AdminLayout><ActivityLog /></AdminLayout>} />
                <Route path="/admin/admins" element={<AdminLayout><AdminManagement /></AdminLayout>} />
                <Route path="/admin/olympiads" element={<AdminLayout><OlympiadManagement /></AdminLayout>} />

                {/* Onboarding – no extra guards needed; AuthGuard will handle if user is already onboarded */}
                <Route
                  path="/onboarding"
                  element={
                    <AuthGuard requireBaseline={false}>
                      <Suspense fallback={<PageLoader />}>
                        <OnboardingFlow />
                      </Suspense>
                    </AuthGuard>
                  }
                />

                {/* Baseline Survey – AuthGuard will redirect if already done */}
                <Route
                  path="/baseline"
                  element={
                    <AuthGuard requireOnboarding={true}>
                      <Suspense fallback={<PageLoader />}>
                        <BaselineSurvey />
                      </Suspense>
                    </AuthGuard>
                  }
                />

                {/* Student routes */}
                <Route path="/dashboard" element={<StudentLayout><DashboardPage /></StudentLayout>} />
                <Route path="/study" element={<StudentLayout><StudySessionsPage /></StudentLayout>} />
                <Route path="/goals" element={<StudentLayout><GoalsPage /></StudentLayout>} />
                <Route path="/tests" element={<StudentLayout><TestsPage /></StudentLayout>} />
                <Route path="/profile" element={<StudentLayout><ProfilePage /></StudentLayout>} />
                <Route path="/planning" element={<StudentLayout><PlanningPage /></StudentLayout>} />
                <Route path="/todos" element={<StudentLayout><TodosPage /></StudentLayout>} />
                <Route path="/focus" element={<StudentLayout><FocusMode /></StudentLayout>} />

                {/* Root */}
                <Route path="/" element={<RootHandler />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </ErrorBoundary>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App