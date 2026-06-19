import { useAuthStore } from '../../store/authStore'
import { useAdminStats } from '../../hooks/useStats'
import { useProjects } from '../../hooks/useProjects'
import { StatCard } from '../../components/shared/StatCard'
import { Badge } from '../../components/shared/Badge'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Users, AlertCircle, CheckCircle2,
  ClipboardList, ArrowRight, MapPin, Plus
} from 'lucide-react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const stats = useAdminStats()
  const { projects, loading } = useProjects()
  const navigate = useNavigate()

  const name = user?.displayName || user?.phoneNumber || 'Admin'

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting */}
      <div className="bg-kala-dark rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-kala-red/20 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-kala-red/10 rounded-full" />
        <p className="text-gray-400 text-sm mb-1">{greeting()},</p>
        <p className="text-xl font-bold truncate">{name}</p>
        <p className="text-gray-400 text-xs mt-1 capitalize">Administrator</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => navigate('/admin/projects/new')}
            className="flex items-center gap-1.5 bg-kala-red text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-kala-red-dark transition-all"
          >
            <Plus size={14} /> New Project
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all"
          >
            <Users size={14} /> Manage Users
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Projects" value={stats.totalProjects} icon={FolderOpen} color="red" />
        <StatCard label="Active Sites" value={stats.activeProjects} icon={MapPin} color="green" />
        <StatCard label="Team Members" value={stats.totalUsers} icon={Users} color="blue" />
        <StatCard label="Open Issues" value={stats.openIssues} icon={AlertCircle} color="orange" />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-sm font-semibold text-kala-dark mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Labour Report', icon: ClipboardList, path: '/admin/reports/labour', color: 'text-blue-600 bg-blue-50' },
            { label: 'RSP Issue', icon: AlertCircle, path: '/admin/rsp-issues', color: 'text-red-600 bg-red-50' },
            { label: 'Site Progress', icon: CheckCircle2, path: '/admin/site-progress', color: 'text-green-600 bg-green-50' },
            { label: 'Documents', icon: FolderOpen, path: '/admin/documents', color: 'text-orange-600 bg-orange-50' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="bg-white rounded-2xl p-4 shadow-card border border-kala-border flex flex-col items-start gap-2 hover:shadow-md transition-all active:scale-95"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon size={18} />
              </div>
              <span className="text-sm font-medium text-kala-dark">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-kala-dark">Recent Projects</p>
          <button
            onClick={() => navigate('/admin/projects')}
            className="flex items-center gap-1 text-xs text-kala-red font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-kala-border" />
            ))
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-kala-border">
              <p className="text-sm text-gray-400">No projects yet</p>
              <button
                onClick={() => navigate('/admin/projects/new')}
                className="text-kala-red text-sm font-medium mt-1 hover:underline"
              >
                Add your first project
              </button>
            </div>
          ) : (
            projects.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/admin/projects/${p.id}`)}
                className="bg-white rounded-2xl p-4 shadow-card border border-kala-border flex items-center gap-3 hover:shadow-md transition-all text-left w-full"
              >
                <div className="w-10 h-10 bg-kala-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-kala-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kala-dark truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.location || 'No location set'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge status={p.status || 'active'} />
                  <ArrowRight size={14} className="text-gray-400" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
