import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { db, uploadFile } from '../../api/firebase'
import { useAuthStore, ROLE_LABELS, ROLES } from '../../store/authStore'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/shared/Badge'
import { 
  ArrowLeft, User, Phone, Mail, BadgeCheck, Briefcase, 
  Building, MapPin, UserSquare, ShieldCheck,
  Trash2, Edit2, Save, X, FileText, CreditCard, Upload, CheckCircle2, Plus
} from 'lucide-react'
import { AssignProjectsModal } from '../../components/shared/AssignProjectsModal'



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
    return <div className="p-8 text-center text-gray-500">Loading user details...</div>
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-500">User not found</div>
  }

  const regDate = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Unknown'

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
        {/* Personal Info Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Personal Info</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
            
            {/* Avatar Row */}
            <div className="flex items-center gap-5">
              <div className="relative group flex-shrink-0">
                {form.photoUrl || user.photoUrl ? (
                  <img src={form.photoUrl || user.photoUrl} alt={form.fullName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-kala-red flex items-center justify-center border-4 border-red-50 shadow-sm">
                    <span className="text-white text-3xl font-bold">{form.fullName?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="max-w-md">
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
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-kala-dark truncate">{user.fullName}</h2>
                      <Badge status={user.active !== false ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Joined {regDate}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number {isEditing && <span className="text-kala-red">*</span>}</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Phone size={16} className="text-gray-400" /> {user.phone}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Mail size={16} className="text-gray-400" /> {user.email || '—'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employee ID</label>
              {isEditing ? (
                <div className="relative max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BadgeCheck size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.employeeId || ''}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-500 font-medium cursor-not-allowed"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                  <BadgeCheck size={16} className="text-gray-400" /> {user.employeeId || '—'}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Documentation Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Documentation</h2>
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Aadhar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar Card</label>
                  {(user.aadharUrl || form.aadharUrl) && (
                    <a href={user.aadharUrl || form.aadharUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-kala-red hover:underline">View Document</a>
                  )}
                </div>
                {isEditing ? (
                  <>
                    <div className="relative mb-2">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FileText size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={form.aadhar || ''}
                        onChange={(e) => handleInputChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                        maxLength={12}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                        placeholder="12-digit Aadhar Number"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setAadharFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-medium transition-all ${aadharFile ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-kala-red/40'}`}>
                        {aadharFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                        {aadharFile ? aadharFile.name : 'Upload Document'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <FileText size={16} className="text-gray-400" /> {user.aadhar || 'Not provided'}
                  </div>
                )}
              </div>

              {/* PAN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN Card</label>
                  {(user.panUrl || form.panUrl) && (
                    <a href={user.panUrl || form.panUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-kala-red hover:underline">View Document</a>
                  )}
                </div>
                {isEditing ? (
                  <>
                    <div className="relative mb-2">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <CreditCard size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={form.pan || ''}
                        onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                        maxLength={10}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all uppercase"
                        placeholder="10-digit PAN Number"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPanFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-medium transition-all ${panFile ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-kala-red/40'}`}>
                        {panFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                        {panFile ? panFile.name : 'Upload Document'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <CreditCard size={16} className="text-gray-400" /> {user.pan || 'Not provided'}
                  </div>
                )}
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">System Role</label>
                {isEditing ? (
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
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <ShieldCheck size={16} className="text-gray-400" /> {ROLE_LABELS[user.role]}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building size={18} className="text-gray-400" />
                    </div>
                    <select
                      value={form.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="Projects">Projects</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Building size={16} className="text-gray-400" /> {user.department || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">User Type</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserSquare size={18} className="text-gray-400" />
                    </div>
                    <select
                      value={form.userType || 'Internal'}
                      onChange={(e) => handleInputChange('userType', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <UserSquare size={16} className="text-gray-400" /> {user.userType || 'Internal'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reporting To</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Briefcase size={18} className="text-gray-400" />
                    </div>
                    <select
                      value={form.reportingTo || ''}
                      onChange={(e) => handleInputChange('reportingTo', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="">None</option>
                      {projectManagers.map(pm => (
                        <option key={pm.id} value={pm.fullName}>{pm.fullName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Briefcase size={16} className="text-gray-400" /> {user.reportingTo || 'None'}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-500" />
                  <span className="text-sm text-kala-dark font-medium">Assigned Projects</span>
                </div>
                {isEditing && (
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs px-3" onClick={() => setIsProjectsModalOpen(true)}>
                    <Plus size={14} className="mr-1" /> Manage
                  </Button>
                )}
              </div>
              
              <div>
                {isEditing ? (
                  form.assignProjects?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-semibold text-kala-red bg-red-50 px-2.5 py-1 rounded-lg">
                        {form.assignProjects.length} Project{form.assignProjects.length > 1 ? 's' : ''} Assigned
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No projects currently assigned to this user.</p>
                  )
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(!user.assignProjects || user.assignProjects.length === 0) ? (
                      <span className="text-xs text-gray-500">No projects assigned</span>
                    ) : (
                      user.assignProjects.map(projId => {
                        const proj = projects.find(p => p.id === projId)
                        return (
                          <div key={projId} className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-medium text-kala-dark shadow-sm flex items-center gap-1.5">
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
            
            {isEditing && (
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group w-fit">
                  <div className={`mt-0.5 w-10 h-5 rounded-full flex items-center transition-colors px-0.5 ${form.active !== false ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.active !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" checked={form.active !== false} onChange={(e) => handleInputChange('active', e.target.checked)} className="hidden" />
                  <div>
                    <p className="text-sm font-semibold text-kala-dark group-hover:text-kala-red transition-colors">Active Account</p>
                    <p className="text-xs text-gray-500 mt-0.5">User will be able to login and access the system.</p>
                  </div>
                </label>
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
        <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 mt-8 -mx-5 px-5 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
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
