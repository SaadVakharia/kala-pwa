import { FileText, CreditCard, Upload, CheckCircle2 } from 'lucide-react'

export function DocumentationSection({ form, user, isEditing, onChange, onFileChange, files }) {
  const displayUser = user || form
  const { aadharFile, panFile } = files || {}

  return (
    <div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Documentation</h2>
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Aadhar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Aadhar Card</label>
              {(displayUser.aadharUrl || form.aadharUrl) && (
                <a href={displayUser.aadharUrl || form.aadharUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-kala-red hover:underline">View Document</a>
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
                    onChange={(e) => onChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    maxLength={12}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                    placeholder="12-digit Aadhar Number"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onFileChange('aadhar', e.target.files[0])}
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
                <FileText size={16} className="text-gray-400" /> {displayUser.aadhar || 'Not provided'}
              </div>
            )}
          </div>

          {/* PAN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN Card</label>
              {(displayUser.panUrl || form.panUrl) && (
                <a href={displayUser.panUrl || form.panUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-kala-red hover:underline">View Document</a>
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
                    onChange={(e) => onChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all uppercase"
                    placeholder="10-digit PAN Number"
                  />
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => onFileChange('pan', e.target.files[0])}
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
                <CreditCard size={16} className="text-gray-400" /> {displayUser.pan || 'Not provided'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
