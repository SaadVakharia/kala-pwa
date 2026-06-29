import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_LABELS } from '../../store/authStore'
import { useAdminStats } from '../../hooks/useStats'
import { useProjects } from '../../hooks/useProjects'
import { ProjectCard } from '../../components/shared/ProjectCard'
import { Input } from '../../components/ui/Input'
import { greeting } from '../../utils/helpers'
import {
  FolderOpen, Users, AlertCircle, CheckCircle2,
  ClipboardList, ArrowRight, MapPin, Plus, Search
} from 'lucide-react'

const QUICK_ACTIONS = [
  { label: 'Labour Report', icon: ClipboardList, path: '/admin/reports/labour', color: 'text-blue-600 bg-blue-50' },
  { label: 'RSP Issue', icon: AlertCircle, path: '/admin/rsp-issues', color: 'text-red-600 bg-red-50' },
  { label: 'Site Progress', icon: CheckCircle2, path: '/admin/site-progress', color: 'text-green-600 bg-green-50' },
  { label: 'Documents', icon: FolderOpen, path: '/admin/documents', color: 'text-orange-600 bg-orange-50' },
  { label: 'New Project', icon: Plus, path: '/admin/projects', color: 'text-kala-red bg-red-50' },
  { label: 'Manage Team', icon: Users, path: '/admin/users', color: 'text-purple-600 bg-purple-50' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, role, fullName } = useAuthStore()
  const stats = useAdminStats()
  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')

  const name = fullName || user?.displayName || user?.phoneNumber || 'Admin'

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
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <MapPin size={14} className="text-kala-red" />
            <span className="text-xs text-white font-medium">{stats.totalProjects} Projects</span>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Users size={14} className="text-kala-red" />
            <span className="text-xs text-white font-medium">{stats.totalUsers} Members</span>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-kala-red" />
            <span className="text-xs text-white font-medium">{stats.openIssues} Issues</span>
          </div>
        </div>
      </div>

      {/* Quick Actions — 4-col icon grid like employee */}
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

      {/* Recent Projects with search */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-kala-dark">My Projects</p>
          <button
            onClick={() => navigate('/admin/projects')}
            className="flex items-center gap-1 text-xs text-kala-red font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

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
                {search ? 'No projects match your search' : 'No projects yet'}
              </p>
              {!search && (
                <button
                  onClick={() => navigate('/admin/projects')}
                  className="text-kala-red text-sm font-medium mt-1 hover:underline"
                >
                  Add your first project
                </button>
              )}
            </div>
          ) : (
            filtered.slice(0, 5).map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/admin/projects/${p.id}`)}
              />
            ))
          )}
        </div>
      </div>

    </div>
  )
}