import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ImageCropModal } from '../../components/shared/ImageCropModal'
import { ArrowLeft, Building2, MapPin, IndianRupee, ImagePlus, X, Plus } from 'lucide-react'

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

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)



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
    if (fileInputRef.current) fileInputRef.current.value = ''
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

      const newProject = {
        ...form,
        status: 'active',
        imageUrl,
        customFolders: [],
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

        {/* Logo Pictures / Cover Image */}
        <div className="flex justify-center mb-2">
          <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
            {imagePreview ? (
              <div className="relative rounded-[2rem] overflow-hidden w-full h-full bg-gray-100 border-4 border-white shadow-xl">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
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



        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-32 py-2.5 text-sm border-gray-200" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="w-full sm:w-40 py-2.5 text-sm shadow-md">
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
