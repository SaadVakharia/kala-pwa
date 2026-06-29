export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8 sm:mb-10">
      <div>
        <h1 className="text-2xl font-bold text-kala-dark">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}
