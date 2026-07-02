import { User, Phone, Mail, BadgeCheck } from 'lucide-react'
import { Badge } from '../../../components/shared/Badge'

export function PersonalInfoSection({ form, user, isEditing, onChange }) {
  const displayUser = user || form

  const regDate = displayUser.createdAt ? new Date(displayUser.createdAt.seconds * 1000).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Unknown'

  return (
    <div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Personal Info</h2>
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        
        {/* Avatar Row */}
        <div className="flex items-center gap-5">
          <div className="relative group flex-shrink-0">
            {form.photoUrl || displayUser.photoUrl ? (
              <img src={form.photoUrl || displayUser.photoUrl} alt={form.fullName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
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
                    value={form.fullName || ''}
                    onChange={(e) => onChange('fullName', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-kala-dark truncate">{displayUser.fullName}</h2>
                  <Badge status={displayUser.active !== false ? 'active' : 'inactive'} />
                </div>
                <p className="text-sm text-gray-500 font-medium">Joined {regDate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-kala-red">*</span></label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone size={18} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={form.phone || ''}
                  onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                  required
                  inputMode="numeric"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                <Phone size={16} className="text-gray-400" /> {displayUser.phone}
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
                  placeholder="Optional"
                  value={form.email || ''}
                  onChange={(e) => onChange('email', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
                <Mail size={16} className="text-gray-400" /> {displayUser.email || '—'}
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
                title="Auto-generated ID cannot be edited"
                className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-500 font-medium cursor-not-allowed"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-kala-dark font-medium px-1 py-1.5">
              <BadgeCheck size={16} className="text-gray-400" /> {displayUser.employeeId || '—'}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
