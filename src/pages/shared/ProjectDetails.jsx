import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
        const storageRef = ref(storage, `projects/${Date.now()}_${imageFile.name}`)
        await uploadBytes(storageRef, imageFile)
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
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
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
            <Edit2 size={16} /> Edit
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-kala-border overflow-hidden">
        {/* Cover / Image Area */}
        <div className="h-48 bg-gray-100 relative border-b border-gray-100">
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
                  className="bg-white text-kala-dark px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-all"
                >
                  <ImagePlus size={18} /> {imagePreview ? 'Change Photo' : 'Add Photo'}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="max-w-md mb-2">
                  <Input 
                    label="Project Name" 
                    value={form.name || ''} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-kala-dark truncate mb-1">
                  {project.name || 'Unnamed Project'}
                </h2>
              )}
              
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <Badge status={project.status || 'active'} />
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="w-40">
                <label className="text-sm font-medium text-kala-dark mb-1.5 block">Status</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  value={form.status || 'active'}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Location */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Location</p>
                {isEditing ? (
                  <Input 
                    value={form.location || ''} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    placeholder="Enter location"
                  />
                ) : (
                  <p className="text-kala-dark font-medium">{project.location || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Client Name</p>
                {isEditing ? (
                  <Input 
                    value={form.client || ''} 
                    onChange={e => setForm({ ...form, client: e.target.value })} 
                    placeholder="Enter client name"
                  />
                ) : (
                  <p className="text-kala-dark font-medium">{project.client || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">Start Date</p>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={form.startDate || ''} 
                    onChange={e => setForm({ ...form, startDate: e.target.value })} 
                  />
                ) : (
                  <p className="text-kala-dark font-medium">{project.startDate || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* End Date */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-1">End Date</p>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={form.endDate || ''} 
                    onChange={e => setForm({ ...form, endDate: e.target.value })} 
                  />
                ) : (
                  <p className="text-kala-dark font-medium">{project.endDate || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {isEditing && (
          <div className="bg-gray-50 p-4 border-t border-kala-border flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              loading={saving || uploadProgress}
              loadingLabel={uploadProgress ? "Uploading photo..." : "Saving..."}
              className="gap-2"
            >
              <Save size={16} /> Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
