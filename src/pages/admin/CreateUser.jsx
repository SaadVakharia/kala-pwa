import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { setDoc, doc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { useAuthStore, ROLE_LABELS, ROLES } from '../../store/authStore'
import {
  ArrowLeft, User, Phone, Mail, BadgeCheck, Briefcase,
  Building, MapPin, UserSquare, ShieldCheck, CheckCircle2,
  CreditCard, FileText
} from 'lucide-react'
import { AssignProjectsModal } from '../../components/shared/AssignProjectsModal'

// ROLE_PERMISSIONS removed as summary is no longer needed

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
    employeeId: '', // Fetched sequentially
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
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleProjectToggle = (projectId) => {
    setForm(prev => {
      const current = prev.assignProjects || []
      if (current.includes(projectId)) {
        return { ...prev, assignProjects: current.filter(id => id !== projectId) }
      } else {
        return { ...prev, assignProjects: [...current, projectId] }
      }
    })
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
        {/* Inputs section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 space-y-1">
          <div className="flex items-center px-4 py-1">
            <User size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="text"
              placeholder="Full Name *"
              value={form.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none placeholder:text-gray-400"
              required
            />
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1">
            <Phone size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="tel"
              placeholder="Mobile Number *"
              value={form.phone}
              onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="flex-1 py-3 text-sm focus:outline-none placeholder:text-gray-400"
              required
              inputMode="numeric"
            />
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1">
            <Mail size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="email"
              placeholder="Email Address (Optional)"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1">
            <BadgeCheck size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="text"
              placeholder="Auto-generated EMP ID"
              value={form.employeeId}
              readOnly
              className="flex-1 py-3 text-sm focus:outline-none text-gray-500 bg-transparent font-medium"
            />
          </div>
          <hr className="border-gray-100" />
          <div className="px-4 py-2 flex flex-col gap-2">
            <div className="flex items-center">
              <FileText size={18} className="text-gray-400 w-8 flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter Aadhar Card Number (Optional)"
                value={form.aadhar}
                onChange={(e) => handleInputChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                maxLength={12}
                className="flex-1 py-1 text-sm focus:outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center pl-8">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAadharFile(e.target.files[0])}
                className="text-xs text-gray-500 w-full file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>
          <hr className="border-gray-100" />
          <div className="px-4 py-2 flex flex-col gap-2">
            <div className="flex items-center">
              <CreditCard size={18} className="text-gray-400 w-8 flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter PAN Card Number (Optional)"
                value={form.pan}
                onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                maxLength={10}
                className="flex-1 py-1 text-sm focus:outline-none placeholder:text-gray-400 uppercase"
              />
            </div>
            <div className="flex items-center pl-8">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPanFile(e.target.files[0])}
                className="text-xs text-gray-500 w-full file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Access section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 space-y-1">
          <div className="flex items-center px-4 py-1 relative">
            <ShieldCheck size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <select
              value={form.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none appearance-none bg-transparent relative z-10 cursor-pointer font-medium text-kala-dark"
              required
            >
              {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1 relative">
            <Building size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <select
              value={form.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none appearance-none bg-transparent relative z-10 cursor-pointer"
            >
              <option value="Projects">Projects</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Management">Management</option>
            </select>
          </div>
          <hr className="border-gray-100" />
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-kala-dark font-medium">Assign Projects</span>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsProjectsModalOpen(true)}>
                Manage Projects
              </Button>
            </div>
            
            <div className="pl-8">
              {form.assignProjects?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm font-semibold text-kala-red bg-red-50 px-2 py-1 rounded-md">
                    {form.assignProjects.length} Project{form.assignProjects.length > 1 ? 's' : ''} Assigned
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">No projects assigned.</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects Modal */}
        <AssignProjectsModal 
          open={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          projects={projects}
          initialAssignedIds={form.assignProjects || []}
          onSave={(ids) => handleInputChange('assignProjects', ids)}
        />

        {/* Toggles */}
        <div className="flex flex-col gap-4 px-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-10 h-5 rounded-full flex items-center transition-colors px-0.5 ${form.activeAccount ? 'bg-green-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.activeAccount ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <input type="checkbox" checked={form.activeAccount} onChange={(e) => handleInputChange('activeAccount', e.target.checked)} className="hidden" />
            <div>
              <p className="text-sm font-semibold text-kala-dark group-hover:text-kala-red transition-colors">Active Account</p>
              <p className="text-xs text-gray-500 mt-0.5">User will be able to login and access the system.</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-4">
          <Button type="submit" loading={saving} fullWidth className="py-3.5 text-base shadow-md">
            <User size={18} className="mr-2" /> Create User
          </Button>
          <Button type="button" variant="outline" fullWidth className="py-3.5 text-base border-gray-200" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
