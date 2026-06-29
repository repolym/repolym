import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DashboardProvider } from './context/DashboardContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { ToastContainer } from './components/common/Toast'

import AdminDashboard from './components/admin/AdminDashboard'
import { AdminRoute } from './components/common/AdminRoute'
import { LoginPage } from './components/auth/LoginForm'
import { RegisterPage } from './components/auth/RegisterForm'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { SessionsPage } from './components/sessions/SessionsPage'
import { GoalsPage } from './components/goals/GoalsPage'
import { TestsPage } from './components/tests/TestsPage'
import { SubjectsPage } from './components/subjects/SubjectsPage'
import PublicStudyPage from './components/public/PublicStudyPage'

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  </ProtectedRoute>
)

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <DashboardProvider>
                    <AppShell>
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </AppShell>
                  </DashboardProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={<ProtectedLayout><DashboardPage /></ProtectedLayout>}
            />
            <Route
              path="/sessions"
              element={<ProtectedLayout><SessionsPage /></ProtectedLayout>}
            />
            <Route
              path="/goals"
              element={<ProtectedLayout><GoalsPage /></ProtectedLayout>}
            />
            <Route
              path="/tests"
              element={<ProtectedLayout><TestsPage /></ProtectedLayout>}
            />
            <Route
              path="/subjects"
              element={<ProtectedLayout><SubjectsPage /></ProtectedLayout>}
            />

            {/* مسیر عمومی ساعات مطالعه */}
            <Route path="/public/:userId" element={<PublicStudyPage />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App