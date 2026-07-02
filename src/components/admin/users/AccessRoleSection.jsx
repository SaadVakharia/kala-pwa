import { ShieldCheck, Building, UserSquare, Briefcase, MapPin, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { ROLE_LABELS, ROLES } from '../../../store/authStore'

export function AccessRoleSection({ form, user, isEditing, onChange, onOpenProjectsModal, projects, projectManagers }) {
  const displayUser = user || form

  return (
    <div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Access & Role</h2>
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">System Role <span className="text-kala-red">*</span></label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <ShieldCheck size={18} className="text-gray-400" />
                </div>
                <select
                  value={form.role || ROLES.JUNIOR_TECHNICIAN}
                  onChange={(e) => onChange('role', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                  required
                >
                  {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                <ShieldCheck size={16} className="text-gray-400" /> {ROLE_LABELS[displayUser.role]}
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
                  onChange={(e) => onChange('department', e.target.value)}
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
                <Building size={16} className="text-gray-400" /> {displayUser.department || '—'}
              </div>
            )}
          </div>

          {/* User Type & Reporting To - usually for user details view/edit, sometimes for create if needed */}
          {(!isEditing || (isEditing && projectManagers)) && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">User Type</label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserSquare size={18} className="text-gray-400" />
                    </div>
                    <select
                      value={form.userType || 'Internal'}
                      onChange={(e) => onChange('userType', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <UserSquare size={16} className="text-gray-400" /> {displayUser.userType || 'Internal'}
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
                      onChange={(e) => onChange('reportingTo', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="">None</option>
                      {projectManagers?.map(pm => (
                        <option key={pm.id} value={pm.fullName}>{pm.fullName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                    <Briefcase size={16} className="text-gray-400" /> {displayUser.reportingTo || 'None'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-500" />
              <span className="text-sm text-kala-dark font-medium">Assigned Projects</span>
            </div>
            {isEditing && (
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs px-3" onClick={onOpenProjectsModal}>
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
                {(!displayUser.assignProjects || displayUser.assignProjects.length === 0) ? (
                  <span className="text-xs text-gray-500">No projects assigned</span>
                ) : (
                  displayUser.assignProjects.map(projId => {
                    const proj = projects?.find(p => p.id === projId)
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
              <input type="checkbox" checked={form.active !== false} onChange={(e) => onChange('active', e.target.checked)} className="hidden" />
              <div>
                <p className="text-sm font-semibold text-kala-dark group-hover:text-kala-red transition-colors">Active Account</p>
                <p className="text-xs text-gray-500 mt-0.5">User will be able to login and access the system.</p>
              </div>
            </label>
          </div>
        )}

      </div>
    </div>
  )
}
