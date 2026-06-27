import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/shared/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { updateDocument } from '../../api/firestore'
import { useAuthStore, ROLE_LABELS, ROLES } from '../../store/authStore'
import { Users, Search, Shield, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminUsers() {
  const navigate = useNavigate()
  const { users, loading } = useUsers()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const filtered = users.filter(u => {
    const matchSearch =
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div>
      <PageHeader
        title="Team Members"
        subtitle={`${users.length} registered users`}
        action={
          <Button onClick={() => navigate('/admin/users/create')} size="sm" className="gap-2 flex items-center">
            <Plus size={16} /> Add User
          </Button>
        }
      />

      {/* Search + Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={Search}
          containerClassName="flex-1"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
        >
          <option value="all">All Roles</option>
          {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-kala-border" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" subtitle="Users appear here after they log in for the first time" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => navigate(`/admin/users/${u.id}`)}
              className="bg-white rounded-2xl p-4 shadow-card border border-kala-border flex items-center gap-3 hover:shadow-md transition-all text-left w-full"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-kala-red flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(u.fullName || u.phone || '?')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kala-dark truncate">
                  {u.fullName || 'Unnamed User'}
                </p>
                <p className="text-xs text-gray-500">{u.phone || '—'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge status={u.role || 'employee'} />
                <Shield size={14} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}