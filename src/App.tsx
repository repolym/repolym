import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DashboardProvider } from './context/DashboardContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { StudentRoute } from './components/common/StudentRoute'
import { AdminRoute } from './components/common/AdminRoute'
import { ToastContainer } from './components/common/Toast'

import AdminDashboard from './components/admin/AdminDashboard'
import { LoginPage } from './components/auth/LoginForm'
import { RegisterPage } from './components/auth/RegisterForm'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { SessionsPage } from './components/sessions/SessionsPage'
import { GoalsPage } from './components/goals/GoalsPage'
import { TestsPage } from './components/tests/TestsPage'
import { SubjectsPage } from './components/subjects/SubjectsPage'
import PublicStudyPage from './components/public/PublicStudyPage'

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <StudentRoute>
      <DashboardProvider>
        <AppShell>{children}</AppShell>
      </DashboardProvider>
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />

            <Route path="/dashboard" element={<StudentLayout><DashboardPage /></StudentLayout>} />
            <Route path="/sessions" element={<StudentLayout><SessionsPage /></StudentLayout>} />
            <Route path="/goals" element={<StudentLayout><GoalsPage /></StudentLayout>} />
            <Route path="/tests" element={<StudentLayout><TestsPage /></StudentLayout>} />
            <Route path="/subjects" element={<StudentLayout><SubjectsPage /></StudentLayout>} />

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