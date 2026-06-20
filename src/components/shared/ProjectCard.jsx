import { MapPin, ArrowRight, Building2 } from 'lucide-react'
import { Badge } from './Badge'

export function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-card border border-kala-border hover:shadow-md transition-all text-left w-full overflow-hidden flex items-center gap-0 active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 relative overflow-hidden">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kala-red/10 to-kala-red/5 flex items-center justify-center">
            <Building2 size={28} className="text-kala-red/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-4 py-3">
        <p className="text-sm font-semibold text-kala-dark truncate">{project.name}</p>
        {project.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 truncate">{project.location}</p>
          </div>
        )}
        {project.client && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{project.client}</p>
        )}
        <div className="mt-1.5">
          <Badge status={project.status || 'active'} />
        </div>
      </div>

      <div className="pr-3 flex-shrink-0">
        <ArrowRight size={16} className="text-gray-300" />
      </div>
    </button>
  )
}