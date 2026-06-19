const variants = {
  active:      'bg-green-100 text-green-700',
  completed:   'bg-blue-100 text-blue-700',
  on_hold:     'bg-yellow-100 text-yellow-700',
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-orange-100 text-orange-700',
  resolved:    'bg-green-100 text-green-700',
  admin:       'bg-purple-100 text-purple-700',
  employee:    'bg-blue-100 text-blue-700',
  rsp_technician: 'bg-orange-100 text-orange-700',
  rsp_issue:   'bg-red-100 text-red-700',
  client:      'bg-gray-100 text-gray-700',
}

const labels = {
  active: 'Active', completed: 'Completed', on_hold: 'On Hold',
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved',
  admin: 'Admin', employee: 'Employee', rsp_technician: 'RSP Tech',
  rsp_issue: 'RSP Issue', client: 'Client',
}

export function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}
