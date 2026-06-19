import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, MapPin, Users, FileText,
  ClipboardList, Bell, LogOut, X, ChevronRight
} from 'lucide-react'

const NAV_CONFIG = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/projects', label: 'Projects', icon: MapPin },
    { path: '/admin/users', label: 'Team', icon: Users },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ],
  employee: [
    { path: '/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/employee/sites', label: 'Sites', icon: MapPin },
    { path: '/employee/reports', label: 'Reports', icon: ClipboardList },
  ],
  rsp_technician: [
    { path: '/rsp', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/rsp/issues', label: 'Issues', icon: ClipboardList },
    { path: '/rsp/sites', label: 'Sites', icon: MapPin },
  ],
  rsp_issue: [
    { path: '/rsp-issue', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/rsp-issue/issues', label: 'Issues', icon: ClipboardList },
  ],
  client: [
    { path: '/client', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/client/sites', label: 'My Sites', icon: MapPin },
    { path: '/client/reports', label: 'Reports', icon: FileText },
  ],
}

const ROLE_LABELS = {
  admin: 'Administrator',
  employee: 'Employee',
  rsp_technician: 'RSP Technician',
  rsp_issue: 'RSP Issue',
  client: 'Client',
}

function isActive(item, pathname) {
  if (item.exact) return pathname === item.path
  return pathname === item.path || pathname.startsWith(item.path + '/')
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = NAV_CONFIG[role] || []
  const initials = user?.email?.[0]?.toUpperCase() || 'U'

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNav = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const NavItems = ({ vertical = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item, location.pathname)

        if (vertical) {
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              title={item.label}
              className={`
                group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                transition-all duration-150 text-left
                ${active
                  ? 'bg-kala-red text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              <span className="text-sm font-medium hidden xl:block">{item.label}</span>
              <span className="
                xl:hidden absolute left-full ml-3 px-2 py-1 text-xs font-medium
                bg-gray-900 text-white rounded-md whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity z-50
              ">
                {item.label}
              </span>
            </button>
          )
        }

        return (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors
              ${active ? 'text-kala-red' : 'text-gray-400'}`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-kala-red" />}
          </button>
        )
      })}
    </>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-kala-gray">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="
        hidden md:flex flex-col
        bg-kala-dark
        w-16 xl:w-56
        flex-shrink-0 h-full
        transition-all duration-200
      ">
        <div className="flex items-center justify-center xl:justify-start px-3 xl:px-4 py-4 border-b border-white/10 h-16 flex-shrink-0">
          <img src="/logo.png" alt="KALA" className="h-7 object-contain brightness-0 invert hidden xl:block" />
          <div className="xl:hidden w-8 h-8 bg-kala-red rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black">K</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1">
          <NavItems vertical />
        </nav>

        <div className="border-t border-white/10 p-2 xl:p-3 flex-shrink-0">
          <div className="flex items-center gap-2 xl:gap-3 mb-2 xl:mb-3 px-1">
            <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-kala-red flex-shrink-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden xl:block min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.email}</p>
              <p className="text-gray-400 text-[10px] truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="group relative flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-red-400 transition-all"
          >
            <LogOut size={18} strokeWidth={1.8} className="flex-shrink-0" />
            <span className="text-sm font-medium hidden xl:block">Logout</span>
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-kala-border px-4 h-16 flex items-center justify-between flex-shrink-0 z-10">

          {/* Mobile: logo left */}
          <div className="md:hidden">
            <img src="/logo.png" alt="KALA" className="h-8 object-contain" />
          </div>

          {/* Desktop: role label */}
          <div className="hidden md:block">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {ROLE_LABELS[role]}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Bell — always */}
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} className="text-kala-dark" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-kala-red rounded-full" />
            </button>
            {/* Initials — mobile only */}
            <div className="md:hidden w-8 h-8 rounded-full bg-kala-red flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 w-full">
            <Outlet />
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="md:hidden bg-white border-t border-kala-border flex-shrink-0 safe-bottom">
          <div className="flex">
            <NavItems />
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium leading-tight">Logout</span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  )
}
