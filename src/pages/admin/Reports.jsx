import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/shared/PageHeader'
import {
  ClipboardList, Package, PackageCheck, AlertTriangle,
  FileText, ShieldAlert, ArrowRight
} from 'lucide-react'

const REPORT_TYPES = [
  {
    group: 'Site Reports',
    items: [
      { label: 'Labour Report', desc: 'Daily labour attendance & work done', icon: ClipboardList, color: 'bg-blue-50 text-blue-600', path: '/admin/reports/labour' },
      { label: 'Material Receipt', desc: 'Log incoming materials to site', icon: Package, color: 'bg-green-50 text-green-600', path: '/admin/reports/material-receipt' },
      { label: 'Material Stock Report', desc: 'Current stock status on site', icon: PackageCheck, color: 'bg-purple-50 text-purple-600', path: '/admin/reports/material-stock' },
      { label: 'Material Sent Out', desc: 'Materials dispatched from site', icon: PackageCheck, color: 'bg-orange-50 text-orange-600', path: '/admin/reports/material-sent' },
    ]
  },
  {
    group: 'Issue Reports',
    items: [
      { label: 'Report an Issue', desc: 'Log site problems or blockers', icon: AlertTriangle, color: 'bg-red-50 text-red-600', path: '/admin/reports/issue' },
      { label: 'Vendor Safety Violation', desc: 'Record safety non-compliance', icon: ShieldAlert, color: 'bg-red-50 text-red-700', path: '/admin/reports/safety-violation' },
    ]
  },
  {
    group: 'Documents',
    items: [
      { label: 'Site Related Documents', desc: 'Upload & manage site documents', icon: FileText, color: 'bg-gray-100 text-gray-600', path: '/admin/documents' },
    ]
  },
]

export default function AdminReports() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Reports & Actions" subtitle="Submit and manage site reports" />

      <div className="flex flex-col gap-6">
        {REPORT_TYPES.map(group => (
          <div key={group.group}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{group.group}</p>
            <div className="flex flex-col gap-3 sm:gap-4">
              {group.items.map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-kala-border flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all text-left w-full active:scale-[0.99]"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-kala-dark">{item.label}</p>
                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
