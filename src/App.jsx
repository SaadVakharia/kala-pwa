import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, ROLE_HOME } from './store/authStore'
import { ProtectedRoute } from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import UnauthorizedPage from './pages/shared/UnauthorizedPage'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminProjects from './pages/admin/Projects'
import AdminUsers from './pages/admin/Users'
import AdminReports from './pages/admin/Reports'

// Employee (same as admin minus users)
import EmployeeDashboard from './pages/admin/Dashboard'
import EmployeeProjects from './pages/admin/Projects'
import EmployeeReports from './pages/admin/Reports'

// Placeholders for other roles
import RspDashboard from './pages/rsp/Dashboard'
import ClientDashboard from './pages/client/Dashboard'
import RspIssueDashboard from './pages/rsp/IssueDashboard'

function RoleRedirect() {
  const { user, role } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[role] || '/login'} replace />
}

const Guard = ({ roles, children }) => (
  <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<RoleRedirect />} />

      <Route element={
        <Guard roles={['admin','employee','rsp_technician','rsp_issue','client']}>
          <AppLayout />
        </Guard>
      }>
        {/* Admin */}
        <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/projects" element={<Guard roles={['admin']}><AdminProjects /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={['admin']}><AdminUsers /></Guard>} />
        <Route path="/admin/reports" element={<Guard roles={['admin','employee']}><AdminReports /></Guard>} />

        {/* Employee (shared components, no /users) */}
        <Route path="/employee" element={<Guard roles={['employee']}><EmployeeDashboard /></Guard>} />
        <Route path="/employee/sites" element={<Guard roles={['employee']}><EmployeeProjects /></Guard>} />
        <Route path="/employee/reports" element={<Guard roles={['employee']}><EmployeeReports /></Guard>} />

        {/* RSP */}
        <Route path="/rsp" element={<Guard roles={['rsp_technician']}><RspDashboard /></Guard>} />

        {/* RSP Issue */}
        <Route path="/rsp-issue" element={<Guard roles={['rsp_issue']}><RspIssueDashboard /></Guard>} />

        {/* Client */}
        <Route path="/client" element={<Guard roles={['client']}><ClientDashboard /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
