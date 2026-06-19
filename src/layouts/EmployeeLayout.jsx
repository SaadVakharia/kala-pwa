import { Routes, Route } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import DashboardStub from '@/pages/shared/DashboardStub'

const NAV = [
  { to: '/employee', end: true, icon: '🏠', label: 'Home' },
  { to: '/employee/sites', icon: '🏗️', label: 'Sites' },
  { to: '/employee/labour', icon: '📋', label: 'Labour' },
  { to: '/employee/progress', icon: '📈', label: 'Progress' },
  { to: '/employee/profile', icon: '👤', label: 'Profile' },
]

export default function EmployeeLayout() {
  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route index element={<DashboardStub role="Employee" />} />
          <Route path="sites" element={<DashboardStub role="Employee — Sites" />} />
          <Route path="labour" element={<DashboardStub role="Employee — Labour Report" />} />
          <Route path="progress" element={<DashboardStub role="Employee — Site Progress" />} />
          <Route path="profile" element={<DashboardStub role="Employee — Profile" />} />
        </Routes>
      </main>
      <BottomNav items={NAV} />
    </div>
  )
}
