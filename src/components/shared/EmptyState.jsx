export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-kala-dark mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-4 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  )
}
