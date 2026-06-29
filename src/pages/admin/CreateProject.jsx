import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage, uploadFile } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Building2, MapPin, IndianRupee, ImagePlus, X, FileText, Plus, Upload, CheckCircle2 } from 'lucide-react'

// Simple modal for adding a client inline
function AddClientModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        name: name.trim(),
        createdAt: serverTimestamp()
      })
      onSave({ id: docRef.id, name: name.trim() })
      setName('')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to add client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-kala-dark mb-4">Add New Client</h3>
        <Input 
          label="Client Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Developers"
          autoFocus
        />
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Add Client</Button>
        </div>
      </div>
    </div>
  )
}

export default function CreateProject() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  const [form, setForm] = useState({
    name: '',
    clientId: '',
    location: '',
    projectValue: ''
  })

  // Cover image
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef()

  // Site files
  const [siteFiles, setSiteFiles] = useState([])

  useEffect(() => {
    async function fetchClients() {
      try {
        const snap = await getDocs(collection(db, 'clients'))
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setClients(list.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addSiteFile = () => {
    setSiteFiles(prev => [...prev, { id: Date.now().toString(), name: '', file: null }])
  }

  const removeSiteFile = (id) => {
    setSiteFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleSiteFileChange = (id, file) => {
    if (!file) return
    setSiteFiles(prev => prev.map(f => f.id === id ? { ...f, file } : f))
  }

  const handleSiteFileNameChange = (id, name) => {
    setSiteFiles(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return alert('Project Name is required')

    setSaving(true)
    try {
      let imageUrl = null

      if (imageFile) {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }
        const compressedFile = await imageCompression(imageFile, options)
        const storageRef = ref(storage, `projects/${Date.now()}_${compressedFile.name}`)
        await uploadBytes(storageRef, compressedFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      // Upload site files
      const uploadedSiteFiles = []
      for (const sf of siteFiles) {
        if (sf.file) {
          const url = await uploadFile(`project_files/${Date.now()}_${sf.file.name}`, sf.file)
          uploadedSiteFiles.push({
            name: sf.name || sf.file.name,
            url,
            type: sf.file.type,
            size: sf.file.size
          })
        }
      }

      const newProject = {
        ...form,
        status: 'active',
        imageUrl,
        siteFiles: uploadedSiteFiles,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'projects'), newProject)
      navigate('/admin/projects')
    } catch (err) {
      console.error(err)
      alert('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-kala-dark">Create New Site</h1>
            <p className="text-sm text-gray-500">Add a new project site, client, subsites and specifications.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Basic Details */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Site Basic Details</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
            
            <div className="max-w-2xl">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Site / Project Name <span className="text-kala-red">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter site or project name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="max-w-2xl">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client</label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={form.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                  disabled={loadingClients}
                >
                  <option value="">Select client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-kala-red border-kala-red hover:bg-red-50 w-full sm:w-auto"
                  onClick={() => setIsClientModalOpen(true)}
                >
                  <Plus size={16} className="mr-1" /> Add Client
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location of Project</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter project location"
                    value={form.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Value</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <IndianRupee size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Value in Cr"
                    value={form.projectValue}
                    onChange={(e) => handleInputChange('projectValue', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                    Cr
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Site Files */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Site Files</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-8">
            
            {/* Documents Related to Site */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-kala-dark">Documents Related to Site</h3>
                <Button type="button" size="sm" variant="outline" onClick={addSiteFile} className="h-8 px-3 text-xs">
                  <Plus size={14} className="mr-1" /> Add Document
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {siteFiles.map((sf, index) => (
                  <div key={sf.id} className="relative p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3 group">
                    <button 
                      type="button" 
                      onClick={() => removeSiteFile(sf.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-kala-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleSiteFileChange(sf.id, e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`flex flex-col items-center justify-center py-4 text-center ${sf.file ? 'text-green-600' : 'text-gray-500 hover:text-kala-red transition-colors'}`}>
                        {sf.file ? <CheckCircle2 size={24} className="mb-2" /> : <FileText size={24} className="mb-2" />}
                        <span className="text-sm font-semibold">{sf.file ? 'File Selected' : 'Upload Document'}</span>
                        <span className="text-[10px] text-gray-400 mt-1 truncate w-full px-4">{sf.file ? sf.file.name : 'PDF, DOC, JPG (Max 10MB)'}</span>
                      </div>
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Document Name (e.g. BOQ)"
                      value={sf.name}
                      onChange={(e) => handleSiteFileNameChange(sf.id, e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-kala-red"
                    />
                  </div>
                ))}
                {siteFiles.length === 0 && (
                  <div className="col-span-full p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 font-medium flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-kala-red/30 transition-all" onClick={addSiteFile}>
                    <Plus size={20} /> Click "Add Document" to upload site files
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Logo Pictures / Cover Image */}
            <div>
              <h3 className="text-sm font-bold text-kala-dark mb-4">Logo Pictures (Cover Photo)</h3>
              <div className="max-w-[240px]">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden h-40 bg-gray-100 border border-gray-200 shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-kala-red/40 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <ImagePlus size={24} className="text-gray-400" />
                    <div className="text-center">
                      <span className="block text-sm font-semibold text-gray-600">Upload Image</span>
                      <span className="block text-xs text-gray-400 mt-0.5">JPG, PNG (Max 5MB)</span>
                    </div>
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
            </div>

          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:justify-end">
          <Button type="button" variant="outline" className="py-3.5 sm:py-2.5 sm:w-32 text-base sm:text-sm border-gray-200 order-2 sm:order-1" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="py-3.5 sm:py-2.5 sm:w-40 text-base sm:text-sm shadow-md order-1 sm:order-2">
            <Building2 size={18} className="mr-2 hidden sm:block" /> Create Site
          </Button>
        </div>

      </form>

      <AddClientModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSave={(newClient) => {
          setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
          setForm(prev => ({ ...prev, clientId: newClient.id }))
        }}
      />
    </div>
  )
}
