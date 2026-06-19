import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/shared/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { addDocument, updateDocument } from '../../api/firestore'
import { MapPin, Plus, Search, Filter } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function AdminProjects() {
  const navigate = useNavigate()
  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', client: '', status: 'active', startDate: '', endDate: '' })

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await addDocument('projects', form)
    setSaving(false)
    setModalOpen(false)
    setForm({ name: '', location: '', client: '', status: 'active', startDate: '', endDate: '' })
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-kala-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-kala-red-dark transition-all"
          >
            <Plus size={16} /> Add Project
          </button>
        }
      />

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red"
        >
          <option value="all">All</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-kala-border" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No projects found"
          subtitle={search ? 'Try a different search term' : 'Add your first project to get started'}
          action={!search && (
            <button onClick={() => setModalOpen(true)} className="text-sm bg-kala-red text-white px-4 py-2 rounded-xl">
              Add Project
            </button>
          )}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/projects/${p.id}`)}
              className="bg-white rounded-2xl p-4 shadow-card border border-kala-border flex items-center gap-3 hover:shadow-md transition-all text-left w-full"
            >
              <div className="w-12 h-12 bg-kala-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-kala-red" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kala-dark truncate">{p.name}</p>
                <p className="text-xs text-gray-500 truncate">{p.location || '—'}</p>
                {p.client && <p className="text-xs text-gray-400 truncate">Client: {p.client}</p>}
              </div>
              <div className="flex-shrink-0">
                <Badge status={p.status || 'active'} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Project">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {[
            { label: 'Project Name *', key: 'name', placeholder: 'e.g. Green Heights Tower', required: true },
            { label: 'Location', key: 'location', placeholder: 'e.g. Mumbai, Maharashtra' },
            { label: 'Client Name', key: 'client', placeholder: 'e.g. Rahul Developers' },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-kala-dark">{f.label}</label>
              <input
                className={inputCls}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required={f.required}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-kala-dark">Status</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            >
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Start Date', key: 'startDate' }, { label: 'End Date', key: 'endDate' }].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-kala-dark">{f.label}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-kala-red text-white font-semibold py-3 rounded-xl hover:bg-kala-red-dark transition-all disabled:opacity-50 mt-1"
          >
            {saving ? 'Saving...' : 'Add Project'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
