import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kala-border sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-kala-dark">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
