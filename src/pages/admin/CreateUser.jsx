import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { useAuthStore, ROLE_LABELS, ROLES } from '../../store/authStore'
import {
  ArrowLeft, User, Phone, Mail, BadgeCheck, Briefcase,
  Building, MapPin, UserSquare, ShieldCheck, CheckCircle2,
  CreditCard, FileText
} from 'lucide-react'

const ROLE_PERMISSIONS = {
  admin: ['Full System Access', 'User Management', 'Audit Logs', 'System Settings', 'Manage All Projects'],
  general_manager: ['View Projects', 'User Management', 'Create Reports', 'Audit Logs', 'Manage Issues', 'System Settings', 'Material Entry', '+ 8 more permissions'],
  hr_manager: ['User Management', 'Audit Logs', 'System Settings'],
  project_manager: ['View Projects', 'Create Reports', 'Material Entry', 'Manage Issues'],
  senior_technician: ['View Projects', 'Manage Issues', 'Update Status', 'Material Entry'],
  site_supervisor: ['View Projects', 'Manage Issues', 'Material Entry', 'Create Reports'],
  client: ['View Projects', 'View Reports', 'Track Progress'],
  // Default for others
  default: ['View Projects', 'View Assignments']
}

export default function CreateUser() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    employeeId: `KALA-${Math.floor(1000 + Math.random() * 9000)}`,
    aadhar: '',
    pan: '',
    userType: 'Internal',
    role: ROLES.JUNIOR_TECHNICIAN,
    department: 'Projects',
    assignProject: 'all',
    reportingTo: '',
    activeAccount: true,
    sendInvite: true
  })

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
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

      let photoUrl = null
      if (photo) {
        photoUrl = await uploadFile(`profiles/${phoneFormatted}-${Date.now()}`, photo)
      }

      await setDoc(doc(db, 'profiles', phoneFormatted), {
        fullName: form.fullName,
        phone: phoneFormatted,
        email: form.email || null,
        employeeId: form.employeeId,
        aadhar: form.aadhar || null,
        pan: form.pan || null,
        userType: form.userType,
        role: form.role,
        department: form.department || null,
        assignProject: form.assignProject || null,
        reportingTo: form.reportingTo || null,
        active: form.activeAccount,
        photoUrl,
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

  const permissions = ROLE_PERMISSIONS[form.role] || ROLE_PERMISSIONS.default

  return (
    <div className="max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-kala-dark leading-tight">Create New User</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new user and assign access.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200">
          <div className="relative group cursor-pointer mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-kala-red group-hover:text-kala-red transition-colors">
                <User size={28} />
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-kala-dark">Profile Photo (Optional)</p>
          <p className="text-xs text-gray-500">Tap to upload image</p>
        </div>

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
          <div className="flex items-center px-4 py-1">
            <FileText size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter Aadhar Card Number (Optional)"
              value={form.aadhar}
              onChange={(e) => handleInputChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
              maxLength={12}
              className="flex-1 py-3 text-sm focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1">
            <CreditCard size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter PAN Card Number (Optional)"
              value={form.pan}
              onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))}
              maxLength={10}
              className="flex-1 py-3 text-sm focus:outline-none placeholder:text-gray-400 uppercase"
            />
          </div>
        </div>

        {/* Access section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 space-y-1">
          <div className="flex items-center px-4 py-1 relative">
            <Briefcase size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <select
              value={form.userType}
              onChange={(e) => handleInputChange('userType', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none appearance-none bg-transparent relative z-10 cursor-pointer"
            >
              <option value="Internal">Internal (Employee)</option>
              <option value="External">External (Client/RSP)</option>
            </select>
          </div>
          <hr className="border-gray-100" />
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
          <div className="flex items-center px-4 py-1 relative">
            <MapPin size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <select
              value={form.assignProject}
              onChange={(e) => handleInputChange('assignProject', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none appearance-none bg-transparent relative z-10 cursor-pointer"
            >
              <option value="all">All Projects</option>
              <option value="Project A">Project A</option>
              <option value="Project B">Project B</option>
              <option value="Project C">Project C</option>
            </select>
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center px-4 py-1 relative">
            <UserSquare size={18} className="text-gray-400 w-8 flex-shrink-0" />
            <select
              value={form.reportingTo}
              onChange={(e) => handleInputChange('reportingTo', e.target.value)}
              className="flex-1 py-3 text-sm focus:outline-none appearance-none bg-transparent relative z-10 cursor-pointer"
            >
              <option value="">Select reporting manager (optional)</option>
              <option value="Manager A">Manager A</option>
              <option value="Manager B">Manager B</option>
            </select>
          </div>
        </div>

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

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${form.sendInvite ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
              {form.sendInvite && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <input type="checkbox" checked={form.sendInvite} onChange={(e) => handleInputChange('sendInvite', e.target.checked)} className="hidden" />
            <div>
              <p className="text-sm font-semibold text-kala-dark group-hover:text-blue-600 transition-colors">Send login invite immediately</p>
              <p className="text-xs text-gray-500 mt-0.5">An email/SMS with login instructions will be sent to the user.</p>
            </div>
          </label>
        </div>

        {/* Quick Access Summary */}
        <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-5 mt-2">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-kala-dark">Quick Access Summary</h3>
              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-xs text-gray-500">Role</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                  {ROLE_LABELS[form.role]}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions Preview</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-purple-600" />
                      <span className="text-xs text-gray-600">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
