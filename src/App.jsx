import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, ROLE_HOME, ROLES } from './store/authStore'
import { ProtectedRoute } from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import UnauthorizedPage from './pages/shared/UnauthorizedPage'
import ProjectDetails from './pages/shared/ProjectDetails'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminProjects from './pages/admin/Projects'
import CreateProject from './pages/admin/CreateProject'
import AdminUsers from './pages/admin/Users'
import CreateUser from './pages/admin/CreateUser'
import UserDetails from './pages/admin/UserDetails'
import AdminReports from './pages/admin/Reports'

// Employee — shares admin pages
import EmployeeDashboard from './pages/employee/Dashboard'

// Other roles
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

const ALL_ROLES = Object.values(ROLES)
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER]
const CLIENT_ROLES = [ROLES.CLIENT]
const EMPLOYEE_ROLES = ALL_ROLES.filter(r => !ADMIN_ROLES.includes(r) && !CLIENT_ROLES.includes(r))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<RoleRedirect />} />

      <Route element={
        <Guard roles={ALL_ROLES}>
          <AppLayout />
        </Guard>
      }>
        {/* Admin */}
        <Route path="/admin" element={<Guard roles={ADMIN_ROLES}><AdminDashboard /></Guard>} />
        <Route path="/admin/projects" element={<Guard roles={ADMIN_ROLES}><AdminProjects /></Guard>} />
        <Route path="/admin/projects/new" element={<Guard roles={ADMIN_ROLES}><CreateProject /></Guard>} />
        <Route path="/admin/projects/:id" element={<Guard roles={ADMIN_ROLES}><ProjectDetails /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={ADMIN_ROLES}><AdminUsers /></Guard>} />
        <Route path="/admin/users/create" element={<Guard roles={ADMIN_ROLES}><CreateUser /></Guard>} />
        <Route path="/admin/users/:id" element={<Guard roles={ADMIN_ROLES}><UserDetails /></Guard>} />
        <Route path="/admin/reports" element={<Guard roles={ADMIN_ROLES}><AdminReports /></Guard>} />

        {/* Employee */}
        <Route path="/employee" element={<Guard roles={EMPLOYEE_ROLES}><EmployeeDashboard /></Guard>} />
        <Route path="/employee/projects" element={<Guard roles={EMPLOYEE_ROLES}><AdminProjects /></Guard>} />
        <Route path="/employee/projects/:id" element={<Guard roles={EMPLOYEE_ROLES}><ProjectDetails /></Guard>} />
        <Route path="/employee/reports" element={<Guard roles={EMPLOYEE_ROLES}><AdminReports /></Guard>} />
        <Route path="/employee/users" element={<Guard roles={EMPLOYEE_ROLES}><AdminUsers /></Guard>} />

        {/* Client */}
        <Route path="/client" element={<Guard roles={CLIENT_ROLES}><ClientDashboard /></Guard>} />
        <Route path="/client/projects" element={<Guard roles={CLIENT_ROLES}><AdminProjects /></Guard>} />
        <Route path="/client/projects/:id" element={<Guard roles={CLIENT_ROLES}><ProjectDetails /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}