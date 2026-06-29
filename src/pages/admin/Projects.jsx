import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { PageHeader } from '../../components/shared/PageHeader'
import { ProjectCard } from '../../components/shared/ProjectCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { Modal } from '../../components/shared/Modal'
import { useAuthStore, ROLES } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { addDocument } from '../../api/firestore'
import { storage } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { MapPin, Plus, Search, ImagePlus, X } from 'lucide-react'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function AdminProjects() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useAuthStore()
  const isAdmin = role === ROLES.ADMIN

  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    name: '', location: '', client: '', status: 'active', startDate: '', endDate: ''
  })

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let imageUrl = null

      if (imageFile) {
        setUploadProgress(true)
        const storageRef = ref(storage, `projects/${Date.now()}_${imageFile.name}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
        setUploadProgress(false)
      }

      await addDocument('projects', { ...form, ...(imageUrl ? { imageUrl } : {}) })
      setModalOpen(false)
      setForm({ name: '', location: '', client: '', status: 'active', startDate: '', endDate: '' })
      clearImage()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
      setUploadProgress(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    clearImage()
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        action={isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-kala-red text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-kala-red-dark transition-all"
          >
            <Plus size={16} /> Add Project
          </button>
        )}
      />

      {/* Search + Filter */}
      <div className="flex items-center gap-2 mb-4">
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
          className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
        >
          <option value="all">All</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-kala-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No projects found"
          subtitle={search ? 'Try a different search term' : (isAdmin ? 'Add your first project to get started' : 'No projects available')}
          action={!search && isAdmin && (
            <button onClick={() => setModalOpen(true)} className="text-sm bg-kala-red text-white px-4 py-2 rounded-xl">
              Add Project
            </button>
          )}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => {
                const basePath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
                navigate(`${basePath}/${p.id}`)
              }}
            />
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="Add Project">
        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Image Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-kala-dark">
              Project Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-36 bg-gray-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-kala-red/40 transition-all flex flex-col items-center justify-center gap-1.5"
              >
                <ImagePlus size={22} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Tap to add photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {[
            { label: 'Project Name *', key: 'name', placeholder: 'e.g. Green Heights Tower', required: true },
            { label: 'Location', key: 'location', placeholder: 'e.g. Mumbai, Maharashtra' },
            { label: 'Client Name', key: 'client', placeholder: 'e.g. Rahul Developers' },
          ].map(f => (
            <Input
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              required={f.required}
            />
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-kala-dark">Status</label>
            <select
              className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            >
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Start Date', key: 'startDate' }, { label: 'End Date', key: 'endDate' }].map(f => (
              <Input
                key={f.key}
                label={f.label}
                type="date"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={saving}
            loading={saving || uploadProgress}
            loadingLabel={uploadProgress ? 'Uploading photo...' : 'Saving...'}
            fullWidth
            className="mt-1"
          >
            Add Project
          </Button>
        </form>
      </Modal>
    </div>
  )
}