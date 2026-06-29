import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { useAuthStore, ROLE_LABELS, ROLES } from '../../store/authStore'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/shared/Badge'
import { 
  ArrowLeft, User, Phone, Mail, BadgeCheck, Briefcase, 
  Building, MapPin, UserSquare, ShieldCheck, CheckCircle2,
  Trash2, Edit2, Save, X, FileText, CreditCard
} from 'lucide-react'
import { AssignProjectsModal } from '../../components/shared/AssignProjectsModal'

const ROLE_PERMISSIONS = {
  admin: ['Full System Access', 'User Management', 'Audit Logs', 'System Settings', 'Manage All Projects'],
  general_manager: ['View Projects', 'User Management', 'Create Reports', 'Audit Logs', 'Manage Issues', 'System Settings', 'Material Entry', '+ 8 more permissions'],
  hr_manager: ['User Management', 'Audit Logs', 'System Settings'],
  project_manager: ['View Projects', 'Create Reports', 'Material Entry', 'Manage Issues'],
  senior_technician: ['View Projects', 'Manage Issues', 'Update Status', 'Material Entry'],
  site_supervisor: ['View Projects', 'Manage Issues', 'Material Entry', 'Create Reports'],
  client: ['View Projects', 'View Reports', 'Track Progress'],
  default: ['View Projects', 'View Assignments']
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [projects, setProjects] = useState([])
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
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

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

  const handleSave = async () => {
    if (form.aadhar && !/^\d{12}$/.test(form.aadhar)) {
      return alert('Aadhar card must be exactly 12 digits.')
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) {
      return alert('Invalid PAN card format. Expected format: ABCDE1234F')
    }

    setSaving(true)
    try {
      let photoUrl = form.photoUrl !== undefined ? form.photoUrl : null
      if (photo) {
        photoUrl = await uploadFile(`profiles/${id}-${Date.now()}`, photo)
      }

      const updatedData = {
        ...form,
        photoUrl,
        updatedAt: serverTimestamp()
      }

      // Remove undefined values to prevent Firestore errors
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] === undefined) {
          delete updatedData[key]
        }
      })
      
      await setDoc(doc(db, 'profiles', id), updatedData, { merge: true })
      
      setUser(updatedData)
      setIsEditing(false)
      setPhoto(null)
      setPhotoPreview(null)
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
    return <div className="p-8 text-center text-gray-500">Loading user details...</div>
  }

  if (!user) {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <h2 className="text-xl font-bold text-kala-dark">User Not Found</h2>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">Back to Team</Button>
      </div>
    )
  }

  const permissions = ROLE_PERMISSIONS[isEditing ? form.role : user.role] || ROLE_PERMISSIONS.default
  
  // Format Date
  const regDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  }) : 'Recently added'

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
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

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        
        {/* Top Info Section */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          
          <div className="relative group flex-shrink-0">
            {isEditing && (
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
            )}
            {photoPreview || form.photoUrl || user.photoUrl ? (
              <img src={photoPreview || form.photoUrl || user.photoUrl} alt={form.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-kala-red flex items-center justify-center border-4 border-red-50">
                <span className="text-white text-3xl font-bold">{form.fullName?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Edit2 size={20} className="text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={form.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                className="text-2xl font-bold text-kala-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 mb-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-kala-red"
              />
            ) : (
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-2xl font-bold text-kala-dark truncate">{user.fullName}</h2>
                <Badge status={user.active !== false ? 'active' : 'inactive'} />
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail size={16} />
                {isEditing ? (
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5 w-40 focus:outline-none focus:ring-1 focus:ring-kala-red"
                    placeholder="Email"
                  />
                ) : (
                  <span className="truncate">{user.email || 'No email provided'}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={16} />
                {isEditing ? (
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-kala-red"
                  />
                ) : (
                  <span>{user.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* Details Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1 */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-kala-dark mb-4">
              <User size={18} className="text-kala-red" /> 
              Professional Info
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Employee ID</p>
                {isEditing ? (
                  <input type="text" value={form.employeeId || ''} readOnly className="w-full text-sm bg-gray-100 text-gray-500 border border-gray-200 rounded-lg px-3 py-2 cursor-not-allowed" title="Auto-generated ID cannot be edited" />
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.employeeId || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Aadhar Card</p>
                {isEditing ? (
                  <input type="text" value={form.aadhar || ''} onChange={e => handleInputChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))} maxLength={12} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2" />
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.aadhar || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">PAN Card</p>
                {isEditing ? (
                  <input type="text" value={form.pan || ''} onChange={e => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))} maxLength={10} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 uppercase" />
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.pan || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Department</p>
                {isEditing ? (
                  <select value={form.department || ''} onChange={e => handleInputChange('department', e.target.value)} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <option value="Projects">Projects</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Management">Management</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.department || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">User Type</p>
                {isEditing ? (
                  <select value={form.userType || 'Internal'} onChange={e => handleInputChange('userType', e.target.value)} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.userType || 'Internal'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Reporting To</p>
                {isEditing ? (
                  <input type="text" value={form.reportingTo || ''} onChange={e => handleInputChange('reportingTo', e.target.value)} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2" />
                ) : (
                  <p className="text-sm font-semibold text-kala-dark">{user.reportingTo || '—'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-kala-dark mb-4">
              <ShieldCheck size={18} className="text-kala-red" /> 
              Access & Security
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-wider">System Role</p>
                  {isEditing ? (
                    <select value={form.role || ''} onChange={e => handleInputChange('role', e.target.value)} className="text-sm font-bold text-kala-dark bg-white border border-gray-200 rounded-lg px-2 py-1 mt-1">
                      {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-kala-dark">{ROLE_LABELS[user.role]}</p>
                  )}
                </div>
                {isEditing && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active !== false} onChange={e => handleInputChange('active', e.target.checked)} className="rounded text-kala-red focus:ring-kala-red" />
                    <span className="text-xs font-semibold text-kala-dark">Active</span>
                  </label>
                )}
              </div>
              
              <div className="h-px bg-gray-200 w-full mb-4" />
              
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Permissions Preview</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-gray-600 truncate">{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Registration Date</p>
              <p className="text-sm font-medium text-kala-dark flex items-center gap-2">
                {regDate}
              </p>
            </div>
            
            {/* Assign Projects Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} className="text-kala-red" /> Assigned Projects
                </h4>
                {isEditing && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsProjectsModalOpen(true)}>
                    Manage Projects
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div>
                  {form.assignProjects?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-semibold text-kala-red bg-red-50 px-2 py-1 rounded-md">
                        {form.assignProjects.length} Project{form.assignProjects.length > 1 ? 's' : ''} Assigned
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No projects assigned.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(!user.assignProjects || user.assignProjects.length === 0) ? (
                    <span className="text-xs text-gray-500">No projects assigned</span>
                  ) : (
                    user.assignProjects.map(projId => {
                      const proj = projects.find(p => p.id === projId)
                      return (
                        <div key={projId} className="bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-kala-red"></div>
                          {proj ? proj.name || proj.id : projId}
                        </div>
                      )
                    })
                  )}
                </div>
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

        {/* Action Bar */}
        {isEditing ? (
          <div className="bg-gray-50 border-t border-gray-200 p-4 sm:px-8 flex items-center justify-end gap-3">
            <Button onClick={() => { setIsEditing(false); setForm(user); setPhoto(null); setPhotoPreview(null); }} variant="outline" disabled={saving}>
              <X size={16} className="mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="bg-kala-red text-white hover:bg-red-700">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>
        ) : (
          <div className="bg-gray-50 border-t border-gray-200 p-4 sm:px-8 flex items-center justify-between">
            <button 
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={16} /> Delete User
            </button>
            <div className="flex gap-3">
              <Button onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
