import { useState } from 'react'
import { MapPin, ArrowRight, Building2, IndianRupee } from 'lucide-react'
import { Badge } from './Badge'

export function ProjectCard({ project, onClick, selectable, selected, onToggle }) {
  const [imageLoading, setImageLoading] = useState(true)
  const isSelected = selectable ? selected : false;

  const handleClick = (e) => {
    if (selectable && onToggle) {
      e.preventDefault();
      onToggle(project.id);
    } else if (onClick) {
      onClick(e);
    }
  }

  const content = (
    <>
      {/* Thumbnail */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 relative rounded-xl overflow-hidden shadow-sm">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kala-red/10 to-kala-red/5 flex items-center justify-center">
            <Building2 size={24} className="text-kala-red/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1 text-left flex flex-col justify-center">
        <p className="text-base font-bold text-kala-dark truncate">{project.name || project.id}</p>
        
        <div className="flex items-center gap-3 mt-1">
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-500 truncate">{project.location}</p>
            </div>
          )}
          {project.projectValue && (
            <div className="flex items-center gap-1">
              <IndianRupee size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-500 truncate">{project.projectValue} Cr</p>
            </div>
          )}
        </div>
        
        {project.client && (
          <p className="text-xs font-medium text-gray-400 truncate mt-1">{project.client}</p>
        )}
        
        <div className="mt-2">
          <Badge status={project.status || 'active'} />
        </div>
      </div>

      {selectable ? (
        <div className="pr-3 flex-shrink-0">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle && onToggle(project.id)}
            className="w-5 h-5 rounded border-gray-300 text-kala-red focus:ring-kala-red"
          />
        </div>
      ) : (
        <div className="pr-1 flex-shrink-0">
          <ArrowRight size={16} className="text-gray-300" />
        </div>
      )}
    </>
  )

  const className = `bg-white rounded-2xl sm:rounded-3xl shadow-sm border ${isSelected ? 'border-kala-red ring-1 ring-kala-red' : 'border-kala-border hover:shadow-md hover:border-gray-300'} transition-all w-full flex items-center p-4 sm:p-5 gap-4 cursor-pointer ${!selectable ? 'active:scale-[0.99]' : ''}`

  if (selectable) {
    return (
      <label className={className}>
        {content}
      </label>
    )
  }

  return (
    <button onClick={handleClick} className={className}>
      {content}
    </button>
  )
}