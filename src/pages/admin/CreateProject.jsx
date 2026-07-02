import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '../../api/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { Button } from '../../components/ui/Button'
import { ImageCropModal } from '../../components/shared/ImageCropModal'
import { ArrowLeft, Building2 } from 'lucide-react'
import { AddClientModal } from '../../components/admin/projects/AddClientModal'
import { ProjectBasicDetailsSection } from '../../components/admin/projects/ProjectBasicDetailsSection'
import { ProjectImageUploadSection } from '../../components/admin/projects/ProjectImageUploadSection'

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

        <ProjectImageUploadSection 
          imagePreview={imagePreview}
          onClearImage={clearImage}
          onFileInputClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onImageChange={handleImageChange}
        />
        
        <ProjectBasicDetailsSection 
          form={form}
          onChange={handleInputChange}
          clients={clients}
          loadingClients={loadingClients}
          onOpenClientModal={() => setIsClientModalOpen(true)}
        />

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
