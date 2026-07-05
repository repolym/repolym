import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { DashboardProvider } from './context/DashboardContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { StudentRoute } from './components/common/StudentRoute'
import { AdminRoute } from './components/common/AdminRoute'
import { ToastContainer } from './components/common/Toast'
import { PageLoader } from './components/common/Loading'
import { useAuth } from './context/AuthContext'

import AdminDashboard from './components/admin/AdminDashboard'
import { LoginPage } from './components/auth/LoginForm'
import { RegisterPage } from './components/auth/RegisterForm'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { StudySessionsPage } from './components/study/StudySessionsPage'  // new name
import { GoalsPage } from './components/goals/GoalsPage'
import { TestsPage } from './components/tests/TestsPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { PlanningPage } from './components/plans/PlanningPage'
import { TodosPage } from './components/todos/TodosPage'
import FocusMode from './components/focus/FocusMode'
import PublicStudyPage from './components/public/PublicStudyPage'
import BaselineSurvey from './components/survey/BaselineSurvey'

// ---------- Redirect Based on Onboarding & Baseline ----------
const RedirectBasedOnBaseline: React.FC = () => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  // If onboarding not completed, send to profile to set olympiad
  if (!user.onboarding_completed) {
    return <Navigate to="/profile" replace />
  }

  // If baseline survey not completed, send to survey
  if (!user.has_completed_baseline_survey) {
    return <Navigate to="/baseline" replace />
  }

  return <Navigate to="/dashboard" replace />
}

// ---------- Guard for all Student Routes (except /baseline) ----------
const StudentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  // If onboarding not completed, redirect to profile
  if (!user.onboarding_completed) {
    return <Navigate to="/profile" replace />
  }

  // If baseline survey not completed, redirect to survey
  if (!user.has_completed_baseline_survey) {
    return <Navigate to="/baseline" replace />
  }

  return <>{children}</>
}

// ---------- Layouts ----------
const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <StudentRoute>
      <StudentGuard>
        <DashboardProvider>
          <AppShell>{children}</AppShell>
        </DashboardProvider>
      </StudentGuard>
    </StudentRoute>
  </ProtectedRoute>
)

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <AdminRoute>
      <DashboardProvider>
        <AppShell>{children}</AppShell>
      </DashboardProvider>
    </AdminRoute>
  </ProtectedRoute>
)

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />

              {/* Baseline Survey – full page, no AppShell, NO StudentGuard */}
              <Route
                path="/baseline"
                element={
                  <ProtectedRoute>
                    <BaselineSurvey />
                  </ProtectedRoute>
                }
              />

              <Route path="/dashboard" element={<StudentLayout><DashboardPage /></StudentLayout>} />
              <Route path="/study" element={<StudentLayout><StudySessionsPage /></StudentLayout>} />
              <Route path="/goals" element={<StudentLayout><GoalsPage /></StudentLayout>} />
              <Route path="/tests" element={<StudentLayout><TestsPage /></StudentLayout>} />
              <Route path="/profile" element={<StudentLayout><ProfilePage /></StudentLayout>} />
              <Route path="/planning" element={<StudentLayout><PlanningPage /></StudentLayout>} />
              <Route path="/todos" element={<StudentLayout><TodosPage /></StudentLayout>} />

              <Route
                path="/focus"
                element={
                  <ProtectedRoute>
                    <StudentGuard>
                      <motion.div
                        key="focus"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <FocusMode />
                      </motion.div>
                    </StudentGuard>
                  </ProtectedRoute>
                }
              />

              <Route path="/public/:userId" element={<PublicStudyPage />} />

              {/* Root – check both onboarding and baseline */}
              <Route path="/" element={<RedirectBasedOnBaseline />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App