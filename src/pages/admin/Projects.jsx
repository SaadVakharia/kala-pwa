import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { PageHeader } from '../../components/shared/PageHeader'
import { ProjectCard } from '../../components/shared/ProjectCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { useAuthStore, ROLES } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Plus, Search } from 'lucide-react'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function AdminProjects() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useAuthStore()
  const isAdmin = role === ROLES.ADMIN

  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        action={isAdmin && (
          <button
            onClick={() => navigate('/admin/projects/new')}
            className="flex items-center gap-1.5 bg-kala-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-kala-red-dark transition-all"
          >
            <Plus size={16} /> Add Project
          </button>
        )}
      />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={Search}
          containerClassName="flex-1"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all sm:w-auto w-full"
        >
          <option value="all">All</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-kala-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="building"
          title="No projects found"
          message={search ? "Try adjusting your search or filters." : "Get started by adding a new project."}
        />
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`${location.pathname}/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
