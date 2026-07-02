import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { setDoc, doc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { ROLES } from '../../store/authStore'
import { ArrowLeft, User } from 'lucide-react'
import { AssignProjectsModal } from '../../components/shared/AssignProjectsModal'
import { PersonalInfoSection } from '../../components/admin/users/PersonalInfoSection'
import { DocumentationSection } from '../../components/admin/users/DocumentationSection'
import { AccessRoleSection } from '../../components/admin/users/AccessRoleSection'

export default function CreateUser() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false)
  const [aadharFile, setAadharFile] = useState(null)
  const [panFile, setPanFile] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    employeeId: '',
    aadhar: '',
    pan: '',
    role: ROLES.JUNIOR_TECHNICIAN,
    department: 'Projects',
    assignProjects: [],
    activeAccount: true
  })

  useEffect(() => {
    async function loadData() {
      try {
        const projSnap = await getDocs(collection(db, 'projects'))
        const projs = projSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProjects(projs)

        const empQuery = query(collection(db, 'profiles'), orderBy('employeeId', 'desc'), limit(1))
        const empSnap = await getDocs(empQuery)
        let nextNumber = 1
        if (!empSnap.empty) {
          const lastId = empSnap.docs[0].data().employeeId
          if (lastId && lastId.startsWith('KALA-')) {
            const num = parseInt(lastId.replace('KALA-', ''), 10)
            if (!isNaN(num)) nextNumber = num + 1
          }
        }
        const nextId = `KALA-${String(nextNumber).padStart(4, '0')}`
        setForm(prev => ({ ...prev, employeeId: nextId }))
      } catch (err) {
        console.error("Failed to load initial data", err)
      }
    }
    loadData()
  }, [])

  const handleInputChange = (field, value) => {
    // Handling form.activeAccount mapping from active which is used in AccessRoleSection 
    if (field === 'active') field = 'activeAccount'
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDocFileChange = (target, file) => {
    if (!file) return
    if (target === 'aadhar') setAadharFile(file)
    else setPanFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.role) return

    if (form.aadhar && !/^\d{12}$/.test(form.aadhar)) {
      return alert('Aadhar card must be exactly 12 digits.')
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) {
      return alert('Invalid PAN card format. Expected format: ABCDE1234F')
    }

    setSaving(true)

    try {
      const phoneFormatted = form.phone.startsWith('+91')
        ? form.phone
        : `+91${form.phone.replace(/\D/g, '').slice(0, 10)}`

      let aadharUrl = null;
      let panUrl = null;

      if (aadharFile) {
        aadharUrl = await uploadFile(`documents/${phoneFormatted}-aadhar-${Date.now()}`, aadharFile);
      }
      if (panFile) {
        panUrl = await uploadFile(`documents/${phoneFormatted}-pan-${Date.now()}`, panFile);
      }

      await setDoc(doc(db, 'profiles', phoneFormatted), {
        fullName: form.fullName,
        phone: phoneFormatted,
        email: form.email || null,
        employeeId: form.employeeId,
        aadhar: form.aadhar || null,
        aadharUrl: aadharUrl || null,
        pan: form.pan || null,
        panUrl: panUrl || null,
        role: form.role,
        department: form.department || null,
        assignProjects: form.assignProjects || [],
        active: form.activeAccount,
        createdAt: serverTimestamp()
      })

      navigate(-1)
    } catch (err) {
      console.error(err)
      alert('Failed to create user: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-kala-dark leading-tight">Create New User</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new user and assign access.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <PersonalInfoSection 
          form={form} 
          isEditing={true} 
          onChange={handleInputChange} 
        />

        <DocumentationSection 
          form={form} 
          isEditing={true} 
          onChange={handleInputChange} 
          onFileChange={handleDocFileChange} 
          files={{ aadharFile, panFile }} 
        />

        <AccessRoleSection 
          form={{...form, active: form.activeAccount}} 
          isEditing={true} 
          onChange={handleInputChange} 
          onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
          projects={projects}
        />

        {/* Projects Modal */}
        <AssignProjectsModal
          open={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          projects={projects}
          initialAssignedIds={form.assignProjects || []}
          onSave={(ids) => handleInputChange('assignProjects', ids)}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:justify-end">
          <Button type="button" variant="outline" className="py-3.5 sm:py-2.5 sm:w-32 text-base sm:text-sm border-gray-200 order-2 sm:order-1" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="py-3.5 sm:py-2.5 sm:w-40 text-base sm:text-sm shadow-md order-1 sm:order-2">
            <User size={18} className="mr-2 hidden sm:block" /> Create User
          </Button>
        </div>
      </form>
    </div>
  )
}
