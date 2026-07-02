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
  CreditCard, FileText, Upload, Plus
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

        {/* Personal Info Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Personal Info</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-kala-red">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-kala-red">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    required
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="Optional"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employee ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BadgeCheck size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.employeeId}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-500 font-medium cursor-not-allowed"
                    title="Auto-generated ID cannot be edited"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Documentation Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Documentation <span className="text-xs font-normal lowercase tracking-normal">(Optional)</span></h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Aadhar */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Aadhar Card</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="12-digit Aadhar Number"
                    value={form.aadhar}
                    onChange={(e) => handleInputChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    maxLength={12}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocFileChange('aadhar', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-medium transition-all ${aadharFile ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-kala-red/40'}`}>
                    {aadharFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    {aadharFile ? aadharFile.name : 'Upload Document'}
                  </div>
                </div>
              </div>

              {/* PAN */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PAN Card</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <CreditCard size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="10-digit PAN Number"
                    value={form.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocFileChange('pan', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-medium transition-all ${panFile ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-kala-red/40'}`}>
                    {panFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    {panFile ? panFile.name : 'Upload Document'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Access section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Access & Role</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">System Role <span className="text-kala-red">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ShieldCheck size={18} className="text-gray-400" />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    required
                  >
                    {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <select
                    value={form.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="Projects">Projects</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-500" />
                  <span className="text-sm text-kala-dark font-medium">Assigned Projects</span>
                </div>
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs px-3" onClick={() => setIsProjectsModalOpen(true)}>
                  <Plus size={14} className="mr-1" /> Manage
                </Button>
              </div>

              <div>
                {form.assignProjects?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-semibold text-kala-red bg-red-50 px-2.5 py-1 rounded-lg">
                      {form.assignProjects.length} Project{form.assignProjects.length > 1 ? 's' : ''} Assigned
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No projects currently assigned to this user.</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group w-fit">
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
