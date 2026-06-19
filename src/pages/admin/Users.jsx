import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/shared/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { updateDocument } from '../../api/firestore'
import { Users, Search, Shield } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent'

const ROLES = ['admin', 'employee', 'rsp_technician', 'rsp_issue', 'client']
const ROLE_LABELS = {
  admin: 'Administrator', employee: 'Employee',
  rsp_technician: 'RSP Technician', rsp_issue: 'RSP Issue', client: 'Client'
}

export default function AdminUsers() {
  const { users, loading } = useUsers()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const filtered = users.filter(u => {
    const matchSearch =
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const handleRoleChange = async (newRole) => {
    if (!selected || newRole === selected.role) return
    setSaving(true)
    await updateDocument('profiles', selected.id, { role: newRole })
    setSaving(false)
    setSelected(s => ({ ...s, role: newRole }))
  }

  return (
    <div>
      <PageHeader
        title="Team Members"
        subtitle={`${users.length} registered users`}
      />

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
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
              onClick={() => setSelected(u)}
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

      {/* Role Edit Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Change Role"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-kala-red flex items-center justify-center">
                <span className="text-white font-bold">
                  {(selected.fullName || selected.phone || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-kala-dark">{selected.fullName || 'Unnamed User'}</p>
                <p className="text-sm text-gray-500">{selected.phone}</p>
              </div>
            </div>

            <p className="text-sm font-medium text-kala-dark">Select Role</p>
            <div className="flex flex-col gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  disabled={saving}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left
                    ${selected.role === r
                      ? 'border-kala-red bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div>
                    <p className="text-sm font-medium text-kala-dark">{ROLE_LABELS[r]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r === 'admin' && 'Full access + user management'}
                      {r === 'employee' && 'Submit reports, view sites'}
                      {r === 'rsp_technician' && 'RSP issues and site work'}
                      {r === 'rsp_issue' && 'Raise and track RSP issues'}
                      {r === 'client' && 'View progress and reports'}
                    </p>
                  </div>
                  {selected.role === r && (
                    <div className="w-5 h-5 rounded-full bg-kala-red flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {saving && <p className="text-sm text-center text-gray-500">Updating role...</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
