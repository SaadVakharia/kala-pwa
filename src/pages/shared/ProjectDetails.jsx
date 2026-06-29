import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { useAuthStore, ROLES } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/shared/Badge'
import { 
  ArrowLeft, Building2, MapPin, Edit2, Save, X, ImagePlus, User, Calendar
} from 'lucide-react'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { role } = useAuthStore()
  const isAdmin = role === ROLES.ADMIN
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    async function fetchProject() {
      try {
        const snap = await getDoc(doc(db, 'projects', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setProject(data)
          setForm(data)
          setImagePreview(data.imageUrl || null)
        } else {
          setProject(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  const handleBack = () => {
    // Go up one directory level
    const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
    navigate(basePath)
  }

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
    setForm(prev => ({ ...prev, imageUrl: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let imageUrl = form.imageUrl

      if (imageFile) {
        setUploadProgress(true)

        const options = {
          maxSizeMB: 0.2, // ~200KB max
          maxWidthOrHeight: 800,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(imageFile, options)

        const storageRef = ref(storage, `projects/${Date.now()}_${compressedFile.name}`)
        await uploadBytes(storageRef, compressedFile)
        imageUrl = await getDownloadURL(storageRef)
        setUploadProgress(false)
      }

      const updatedData = {
        ...form,
        imageUrl: imageUrl || null,
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'projects', id), updatedData, { merge: true })
      
      setProject({ ...updatedData, id })
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update project:', err)
    } finally {
      setSaving(false)
      setUploadProgress(false)
    }
  }

  const handleCancel = () => {
    setForm(project)
    setImagePreview(project?.imageUrl || null)
    setImageFile(null)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-kala-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 size={48} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Project Not Found</h2>
        <Button variant="outline" onClick={handleBack}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-kala-dark">Project Details</h1>
            <p className="text-xs text-gray-500">{project.id}</p>
          </div>
        </div>

        {isAdmin && !isEditing && (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline"
            className="gap-2"
          >
            <Edit2 size={16} /> Edit Details
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Project Cover Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Project Cover</h2>
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm h-56 relative">
            {imagePreview ? (
              <img src={imagePreview} alt="Project" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-kala-red/10 to-kala-red/5 flex items-center justify-center">
                <Building2 size={48} className="text-kala-red/40" />
              </div>
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col gap-3 backdrop-blur-[2px] transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-kala-dark px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all border border-gray-200"
                  >
                    <ImagePlus size={18} /> {imagePreview ? 'Change Photo' : 'Add Photo'}
                  </button>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="bg-red-50 text-kala-red p-2 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Details Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Basic Details</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Name <span className="text-kala-red">*</span></label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Green Heights Tower"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Building2 size={16} className="text-gray-400" /> {project.name || 'Unnamed Project'}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={form.location || ''}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <MapPin size={16} className="text-gray-400" /> {project.location || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Developers"
                      value={form.client || ''}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <User size={16} className="text-gray-400" /> {project.client || 'Not specified'}
                  </div>
                )}
              </div>
              
              {/* Status */}
              <div className="sm:col-span-2 mt-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                {isEditing ? (
                  <select
                    className="w-full max-w-sm px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all cursor-pointer appearance-none"
                    value={form.status || 'active'}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                ) : (
                  <div className="mt-1 px-1">
                    <Badge status={project.status || 'active'} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Timeline</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={form.startDate || ''}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Calendar size={16} className="text-gray-400" /> {project.startDate || 'Not specified'}
                  </div>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={form.endDate || ''}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Calendar size={16} className="text-gray-400" /> {project.endDate || 'Not specified'}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Action Bar */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:justify-end">
          <Button type="button" variant="outline" className="py-3.5 sm:py-2.5 sm:w-32 text-base sm:text-sm border-gray-200 order-2 sm:order-1" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving || uploadProgress} loadingLabel={uploadProgress ? "Uploading photo..." : "Saving..."} className="py-3.5 sm:py-2.5 sm:w-40 text-base sm:text-sm shadow-md order-1 sm:order-2">
            <Save size={18} className="mr-2 hidden sm:block" /> Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
