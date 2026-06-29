import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db, storage, uploadFile } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { useAuthStore, ROLES } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/shared/Badge'
import { 
  ArrowLeft, Building2, MapPin, Edit2, Save, X, ImagePlus, User, Calendar, IndianRupee, FileText, CheckCircle2, Plus, Trash2, Download
} from 'lucide-react'

const STATUS_OPTS = ['active', 'on_hold', 'completed']

export default function ProjectDetails() {
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

  const [siteFiles, setSiteFiles] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, 'projects', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setProject(data)
          setForm(data)
          setImagePreview(data.imageUrl || null)
          setSiteFiles(data.siteFiles || [])
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

  const addSiteFile = () => {
    setSiteFiles(prev => [...prev, { id: Date.now().toString(), name: '', file: null, isNew: true }])
  }

  const removeSiteFile = (index) => {
    setSiteFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSiteFileChange = (index, file) => {
    if (!file) return
    setSiteFiles(prev => prev.map((f, i) => i === index ? { ...f, file } : f))
  }

  const handleSiteFileNameChange = (index, name) => {
    setSiteFiles(prev => prev.map((f, i) => i === index ? { ...f, name } : f))
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

      const finalSiteFiles = []
      for (const sf of siteFiles) {
        if (sf.isNew && sf.file) {
          const url = await uploadFile(`project_files/${Date.now()}_${sf.file.name}`, sf.file)
          finalSiteFiles.push({
            name: sf.name || sf.file.name,
            url,
            type: sf.file.type,
            size: sf.file.size
          })
        } else if (!sf.isNew) {
          finalSiteFiles.push({ ...sf })
        }
      }

      const updatedData = {
        ...form,
        imageUrl: imageUrl || null,
        siteFiles: finalSiteFiles,
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'projects', id), updatedData, { merge: true })
      
      setProject({ ...updatedData, id })
      setIsEditing(false)
      setSiteFiles(finalSiteFiles)
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
    setSiteFiles(project?.siteFiles || [])
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

      <div className="flex flex-col gap-6">

        {/* Logo Pictures / Cover Image */}
        <div className="flex justify-center mb-2">
          <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
            {imagePreview ? (
              <div className="relative rounded-[2rem] overflow-hidden w-full h-full bg-gray-100 border-4 border-white shadow-xl">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
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

        {/* Site Files Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Site Files</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-8">
            
            {/* Documents Related to Site */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-kala-dark">Documents Related to Site</h3>
                {isEditing && (
                  <Button type="button" size="sm" variant="outline" onClick={addSiteFile} className="h-8 px-3 text-xs">
                    <Plus size={14} className="mr-1" /> Add Document
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {siteFiles.map((sf, index) => (
                  <div key={index} className="relative p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3 group">
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => removeSiteFile(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-kala-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={12} />
                      </button>
                    )}
                    
                    {sf.isNew ? (
                      <div className="relative">
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleSiteFileChange(index, e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`flex flex-col items-center justify-center py-4 text-center ${sf.file ? 'text-green-600' : 'text-gray-500 hover:text-kala-red transition-colors'}`}>
                          {sf.file ? <CheckCircle2 size={24} className="mb-2" /> : <FileText size={24} className="mb-2" />}
                          <span className="text-sm font-semibold">{sf.file ? 'File Selected' : 'Upload Document'}</span>
                          <span className="text-[10px] text-gray-400 mt-1 truncate w-full px-4">{sf.file ? sf.file.name : 'PDF, DOC, JPG '}</span>
                        </div>
                      </div>
                    ) : (
                      <a href={sf.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center py-4 text-center text-kala-dark hover:text-kala-red transition-colors">
                        <FileText size={32} className="mb-2 text-gray-400 group-hover:text-kala-red transition-colors" />
                        <span className="text-sm font-semibold">{sf.name}</span>
                        <span className="text-[10px] text-gray-400 mt-1">Click to view</span>
                      </a>
                    )}
                    
                    {isEditing && (
                      <input 
                        type="text" 
                        placeholder="Document Name"
                        value={sf.name}
                        onChange={(e) => handleSiteFileNameChange(index, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-kala-red"
                      />
                    )}
                  </div>
                ))}
                {siteFiles.length === 0 && !isEditing && (
                  <div className="col-span-full py-8 text-center text-gray-400 text-sm">No site documents attached.</div>
                )}
                {siteFiles.length === 0 && isEditing && (
                  <div className="col-span-full p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 font-medium flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-kala-red/30 transition-all" onClick={addSiteFile}>
                    <Plus size={20} /> Click "Add Document" to upload site files
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

          </div>
        </div>

      </div>

      {/* Action Bar */}
      {isEditing && (
        <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 mt-8 -mx-5 px-5 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
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
