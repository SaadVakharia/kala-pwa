import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, ClipboardList, MapPin, Users, FileText, LogOut, Bell
} from 'lucide-react'

const NAV_CONFIG = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/sites', label: 'Sites', icon: MapPin },
    { path: '/admin/employees', label: 'Team', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ],
  employee: [
    { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/sites', label: 'Sites', icon: MapPin },
    { path: '/employee/reports', label: 'Reports', icon: ClipboardList },
  ],
  rsp_technician: [
    { path: '/rsp', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/rsp/issues', label: 'Issues', icon: ClipboardList },
    { path: '/rsp/sites', label: 'Sites', icon: MapPin },
  ],
  rsp_issue: [
    { path: '/rsp-issue', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/rsp-issue/issues', label: 'Issues', icon: ClipboardList },
  ],
  client: [
    { path: '/client', label: 'Overview', icon: LayoutDashboard },
    { path: '/client/sites', label: 'My Sites', icon: MapPin },
    { path: '/client/reports', label: 'Reports', icon: FileText },
  ],
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, user, logout } = useAuthStore()

  const navItems = NAV_CONFIG[role] || []

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen bg-kala-gray safe-top">
      {/* Top Header */}
      <header className="bg-white border-b border-kala-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <img src="/logo.png" alt="KALA" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell size={20} className="text-kala-dark" />
          </button>
          <div className="w-8 h-8 rounded-full bg-kala-red flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-kala-border shadow-nav flex-shrink-0 safe-bottom">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors
                  ${active ? 'text-kala-red' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-kala-red mt-0.5" />}
              </button>
            )
          })}
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
