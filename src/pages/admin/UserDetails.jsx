import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Edit2, Save, Trash2 } from 'lucide-react'
import { AssignProjectsModal } from '../../components/shared/AssignProjectsModal'
import { PersonalInfoSection } from '../../components/admin/users/PersonalInfoSection'
import { DocumentationSection } from '../../components/admin/users/DocumentationSection'
import { AccessRoleSection } from '../../components/admin/users/AccessRoleSection'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})

  const [aadharFile, setAadharFile] = useState(null)
  const [panFile, setPanFile] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectManagers, setProjectManagers] = useState([])
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, 'profiles', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setUser(data)
          setForm(data)
        } else {
          setUser(null)
        }

        const projSnap = await getDocs(collection(db, 'projects'))
        const projs = projSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProjects(projs)

        const pmQuery = query(collection(db, 'profiles'), where('role', '==', 'project_manager'))
        const pmSnap = await getDocs(pmQuery)
        const pms = pmSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProjectManagers(pms)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDocFileChange = (target, file) => {
    if (!file) return
    if (target === 'aadhar') setAadharFile(file)
    else setPanFile(file)
  }

  const handleSave = async () => {
    if (form.aadhar && !/^\d{12}$/.test(form.aadhar)) {
      return alert('Aadhar card must be exactly 12 digits.')
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) {
      return alert('Invalid PAN card format. Expected format: ABCDE1234F')
    }

    setSaving(true)
    try {
      let aadharUrl = form.aadharUrl !== undefined ? form.aadharUrl : null
      if (aadharFile) {
        aadharUrl = await uploadFile(`documents/${id}-aadhar-${Date.now()}`, aadharFile)
      }

      let panUrl = form.panUrl !== undefined ? form.panUrl : null
      if (panFile) {
        panUrl = await uploadFile(`documents/${id}-pan-${Date.now()}`, panFile)
      }

      const updatedData = {
        ...form,
        aadharUrl,
        panUrl,
        updatedAt: serverTimestamp()
      }

      // Remove undefined values to prevent Firestore errors
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
          delete updatedData[key]
        }
      })

      await setDoc(doc(db, 'profiles', id), updatedData, { merge: true })

      // Note: the original code called `deleteFile` but it was not imported/defined.
      // If needed, deleteFile logic should be added here.

      setUser(updatedData)
      setIsEditing(false)
      setAadharFile(null)
      setPanFile(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update user: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      setSaving(true)
      try {
        await deleteDoc(doc(db, 'profiles', id))
        navigate('/admin/users')
      } catch (err) {
        console.error(err)
        alert('Failed to delete user: ' + err.message)
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-kala-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-500">User not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-kala-dark leading-tight">User Details</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review and edit user information.</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
            <Edit2 size={16} /> Edit Details
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <PersonalInfoSection 
          form={form} 
          user={user}
          isEditing={isEditing} 
          onChange={handleInputChange} 
        />

        <DocumentationSection 
          form={form} 
          user={user}
          isEditing={isEditing} 
          onChange={handleInputChange} 
          onFileChange={handleDocFileChange} 
          files={{ aadharFile, panFile }} 
        />

        <AccessRoleSection 
          form={form} 
          user={user}
          isEditing={isEditing} 
          onChange={handleInputChange} 
          onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
          projects={projects}
          projectManagers={projectManagers}
        />
      </div>

      {/* Projects Modal */}
      <AssignProjectsModal
        open={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        initialAssignedIds={form.assignProjects || []}
        onSave={(ids) => handleInputChange('assignProjects', ids)}
      />

      {/* Action Bar */}
      {isEditing ? (
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:justify-end">
          <Button type="button" variant="outline" className="py-3.5 sm:py-2.5 sm:w-32 text-base sm:text-sm border-gray-200 order-2 sm:order-1" onClick={() => { setIsEditing(false); setForm(user); setAadharFile(null); setPanFile(null); }} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} className="py-3.5 sm:py-2.5 sm:w-40 text-base sm:text-sm shadow-md order-1 sm:order-2">
            <Save size={18} className="mr-2 hidden sm:block" /> Save Changes
          </Button>
        </div>
      ) : (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-4 gap-4">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors px-4 py-3 sm:py-2 rounded-xl w-full sm:w-auto"
          >
            <Trash2 size={18} /> Delete User
          </button>
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto py-3.5 sm:py-2.5 shadow-md">
            Edit Details
          </Button>
        </div>
      )}

    </div>
  )
}
