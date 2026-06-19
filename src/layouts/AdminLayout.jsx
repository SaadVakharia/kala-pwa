import { Routes, Route } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import DashboardStub from '@/pages/shared/DashboardStub'

const NAV = [
  { to: '/admin', end: true, icon: '🏠', label: 'Home' },
  { to: '/admin/sites', icon: '🏗️', label: 'Sites' },
  { to: '/admin/employees', icon: '👥', label: 'Employees' },
  { to: '/admin/reports', icon: '📊', label: 'Reports' },
  { to: '/admin/docs', icon: '📁', label: 'Docs' },
]

export default function AdminLayout() {
  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route index element={<DashboardStub role="Admin" />} />
          <Route path="sites" element={<DashboardStub role="Admin — Sites" />} />
          <Route path="employees" element={<DashboardStub role="Admin — Employees" />} />
          <Route path="reports" element={<DashboardStub role="Admin — Reports" />} />
          <Route path="docs" element={<DashboardStub role="Admin — Documents" />} />
        </Routes>
      </main>
      <BottomNav items={NAV} />
    </div>
  )
}
