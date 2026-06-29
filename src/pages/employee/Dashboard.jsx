import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_LABELS } from '../../store/authStore'
import { useProjects } from '../../hooks/useProjects'
import { ProjectCard } from '../../components/shared/ProjectCard'
import { Input } from '../../components/ui/Input'
import { greeting } from '../../utils/helpers'
import {
  ClipboardList, Package, PackageCheck, AlertTriangle,
  FileText, ShieldAlert, ArrowRight, Search, MapPin
} from 'lucide-react'

const QUICK_ACTIONS = [
  { label: 'Labour Report', desc: 'Daily attendance & work', icon: ClipboardList, color: 'text-blue-600 bg-blue-50', path: '/employee/reports/labour' },
  { label: 'Material Receipt', desc: 'Log incoming materials', icon: Package, color: 'text-green-600 bg-green-50', path: '/employee/reports/material-receipt' },
  { label: 'RSP Issue', desc: 'Report site problems', icon: AlertTriangle, color: 'text-red-600 bg-red-50', path: '/employee/reports/rsp-issue' },
  { label: 'Site Progress', desc: 'Update work progress', icon: ClipboardList, color: 'text-orange-600 bg-orange-50', path: '/employee/reports/site-progress' },
  { label: 'Material Stock', desc: 'Current site stock', icon: PackageCheck, color: 'text-purple-600 bg-purple-50', path: '/employee/reports/material-stock' },
  { label: 'Safety Violation', desc: 'Vendor non-compliance', icon: ShieldAlert, color: 'text-red-700 bg-red-50', path: '/employee/reports/safety-violation' },
  { label: 'Material Sent', desc: 'Dispatched materials', icon: PackageCheck, color: 'text-indigo-600 bg-indigo-50', path: '/employee/reports/material-sent' },
  { label: 'Documents', desc: 'Site related files', icon: FileText, color: 'text-gray-600 bg-gray-100', path: '/employee/documents' },
]

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const { user, role, fullName } = useAuthStore()
  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')

  const name = fullName || user?.displayName || user?.phoneNumber || 'Employee'

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting Banner */}
      <div className="bg-kala-dark rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-kala-red/20 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-kala-red/10 rounded-full" />
        <p className="text-gray-400 text-sm mb-1">{greeting()},</p>
        <p className="text-xl font-bold truncate">{name}</p>
        <p className="text-gray-400 text-xs mt-1">{ROLE_LABELS[role]}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <MapPin size={14} className="text-kala-red" />
            <span className="text-xs text-white font-medium">{projects.length} Active Sites</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <p className="text-sm font-semibold text-kala-dark mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="bg-white rounded-2xl p-3 shadow-card border border-kala-border flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon size={18} />
              </div>
              <span className="text-[10px] font-medium text-kala-dark leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-kala-dark">My Projects</p>
          <button
            onClick={() => navigate('/employee/projects')}
            className="flex items-center gap-1 text-xs text-kala-red font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={Search}
          containerClassName="mb-3"
        />

        <div className="flex flex-col gap-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-kala-border" />
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-kala-border">
              <MapPin size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {search ? 'No projects match your search' : 'No projects assigned yet'}
              </p>
            </div>
          ) : (
            filtered.slice(0, 5).map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/employee/projects/${p.id}`)}
              />
            ))
          )}
        </div>
      </div>

    </div>
  )
}