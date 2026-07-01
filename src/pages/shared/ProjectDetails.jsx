import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db, storage, deleteFile } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { useAuthStore, ROLES } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { ImageCropModal } from '../../components/shared/ImageCropModal'
import { DocumentCenter } from '../../components/shared/DocumentCenter'
import { Badge } from '../../components/shared/Badge'
import { 
  ArrowLeft, Building2, MapPin, Edit2, Save, X, ImagePlus, User, Calendar, IndianRupee, FolderOpen
} from 'lucide-react'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function ProjectDetails() {
  const [imageLoading, setImageLoading] = useState(true)
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { role } = useAuthStore()
  const isAdmin = role === ROLES.ADMIN
  
  const [project, setProject] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const fileInputRef = useRef()

  // Tab state
  const [activeTab, setActiveTab] = useState('details')

  // Custom folders (from project doc)
  const [customFolders, setCustomFolders] = useState([])

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, 'projects', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setProject(data)
          setForm(data)
          setImagePreview(data.imageUrl || null)
          setCustomFolders(data.customFolders || [])
        } else {
          setProject(null)
        }
        
        const clientSnap = await getDocs(collection(db, 'clients'))
        const list = clientSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setClients(list.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleBack = () => {
    const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
    navigate(basePath)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Open crop modal instead of directly setting preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropImageSrc(ev.target.result)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = (croppedFile, previewUrl) => {
    setImageFile(croppedFile)
    setImagePreview(previewUrl)
    setCropModalOpen(false)
    setCropImageSrc(null)
  }

  const handleCropCancel = () => {
    setCropModalOpen(false)
    setCropImageSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }
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
      
      // Delete old cover image if it was changed
      if (project.imageUrl && imageUrl !== project.imageUrl) {
        await deleteFile(project.imageUrl);
      }

      setProject({ ...updatedData, id })
      setIsEditing(false)
      setImageFile(null)
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
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
            <h1 className="text-xl font-bold text-kala-dark">Site Details</h1>
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

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'details'
              ? 'bg-white text-kala-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 size={15} className="inline-block mr-1.5 -mt-0.5" />
          Details
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'documents'
              ? 'bg-white text-kala-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen size={15} className="inline-block mr-1.5 -mt-0.5" />
          Documents
        </button>
      </div>

      {activeTab === 'details' && (
      <div className="flex flex-col gap-6">

        {/* Logo Pictures / Cover Image */}
        <div className="flex justify-center mb-2">
          <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
            {imagePreview ? (
              <div className="relative rounded-[2rem] overflow-hidden w-full h-full bg-gray-100 border-4 border-white shadow-xl">
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} 
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              isEditing ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-[2rem] border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 hover:border-kala-red/40 transition-all flex flex-col items-center justify-center gap-3 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                    <ImagePlus size={28} className="text-gray-400" />
                  </div>
                  <div className="text-center px-4">
                    <span className="block text-sm font-bold text-gray-700">Upload Project Image</span>
                    <span className="block text-xs text-gray-400 mt-1">JPG, PNG</span>
                  </div>
                </button>
              ) : (
                <div className="w-full h-full rounded-[2rem] border-4 border-white shadow-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                   <Building2 size={32} className="text-gray-300" />
                   <span>No Image</span>
                </div>
              )
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        
        {/* Basic Details Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Site Basic Details</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Site / Project Name <span className="text-kala-red">*</span></label>
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

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name</label>
                {isEditing ? (
                  <select
                    value={form.clientId || ''}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Select client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <User size={16} className="text-gray-400" /> 
                    {clients.find(c => c.id === project.clientId)?.name || project.client || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                {isEditing ? (
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all cursor-pointer appearance-none"
                    value={form.status || 'active'}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                ) : (
                  <div className="mt-1 px-1 flex items-center">
                    <Badge status={project.status || 'active'} />
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

              {/* Project Value */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Value (Cr)</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <IndianRupee size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Value in Cr"
                      value={form.projectValue || ''}
                      onChange={(e) => setForm({ ...form, projectValue: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <IndianRupee size={16} className="text-gray-400" /> {project.projectValue ? `${project.projectValue} Cr` : 'Not specified'}
                  </div>
                )}
              </div>

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
      )}

      {/* Document Center Tab */}
      {activeTab === 'documents' && (
        <DocumentCenter
          projectId={id}
          isAdmin={isAdmin}
          customFolders={customFolders}
          onCustomFoldersChange={setCustomFolders}
        />
      )}

      {/* Action Bar */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-end">
          <Button type="button" variant="outline" className="py-3.5 sm:py-2.5 sm:w-32 text-base sm:text-sm border-gray-200 order-2 sm:order-1" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving || uploadProgress} loadingLabel={uploadProgress ? "Uploading photo..." : "Saving..."} className="py-3.5 sm:py-2.5 sm:w-40 text-base sm:text-sm shadow-md order-1 sm:order-2">
            <Save size={18} className="mr-2 hidden sm:block" /> Save Changes
          </Button>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        aspectRatio={1}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  )
}
