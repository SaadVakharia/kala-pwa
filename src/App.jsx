import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, ROLE_HOME } from "./store/authStore";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import UnauthorizedPage from "./pages/shared/UnauthorizedPage";
import AdminDashboard from "./pages/admin/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";
import RspDashboard from "./pages/rsp/Dashboard";
import ClientDashboard from "./pages/client/Dashboard";
import GuestDashboard from "./pages/guest/Dashboard";
import RspIssueDashboard from "./pages/rsp/IssueDashboard";

function RoleRedirect() {
  const { user, role } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[role] || "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Role redirect from root */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Protected role routes */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "admin",
              "employee",
              "rsp_technician",
              "rsp_issue",
              "client",
              "guest",
            ]}
          >
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employee */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* RSP Technician */}
        <Route
          path="/rsp"
          element={
            <ProtectedRoute allowedRoles={["rsp_technician"]}>
              <RspDashboard />
            </ProtectedRoute>
          }
        />

        {/* RSP Issue */}
        <Route
          path="/rsp-issue"
          element={
            <ProtectedRoute allowedRoles={["rsp_issue"]}>
              <RspIssueDashboard />
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guest"
          element={
            <ProtectedRoute allowedRoles={["guest"]}>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
