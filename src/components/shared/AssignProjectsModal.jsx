import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Search, Building2, MapPin } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from './Badge'

export function AssignProjectsModal({ open, onClose, projects, initialAssignedIds, onSave }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setSelectedIds(initialAssignedIds || [])
      setSearch('')
    }
  }, [open, initialAssignedIds])

  const filteredProjects = projects.filter(p => 
    (p.name || p.id).toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(pid => pid !== id))
    } else {
      setSelectedIds(prev => [...prev, id])
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filteredIds = filteredProjects.map(p => p.id)
      const newSelected = new Set([...selectedIds, ...filteredIds])
      setSelectedIds(Array.from(newSelected))
    } else {
      const filteredIds = filteredProjects.map(p => p.id)
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)))
    }
  }

  const allFilteredSelected = filteredProjects.length > 0 && filteredProjects.every(p => selectedIds.includes(p.id))

  const handleSave = () => {
    onSave(selectedIds)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Projects">
      <div className="flex flex-col h-[60vh] md:h-auto md:max-h-[70vh]">
        {/* Search */}
        <div className="relative mb-4 shrink-0">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kala-red text-sm"
          />
        </div>

        {/* Select All */}
        {filteredProjects.length > 0 && (
          <div className="mb-3 pb-3 border-b border-gray-100 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer w-max">
              <input 
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-kala-red focus:ring-kala-red"
              />
              <span className="text-sm font-semibold text-kala-dark">Select All Filtered Projects</span>
            </label>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 pr-2">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No projects found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProjects.map(proj => {
                const isSelected = selectedIds.includes(proj.id);
                return (
                  <label 
                    key={proj.id} 
                    className={`bg-white rounded-2xl shadow-sm border ${isSelected ? 'border-kala-red ring-1 ring-kala-red' : 'border-kala-border hover:shadow-md'} transition-all text-left w-full overflow-hidden flex items-center gap-0 cursor-pointer`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                      {proj.imageUrl ? (
                        <img
                          src={proj.imageUrl}
                          alt={proj.name}
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
                      <p className="text-sm font-semibold text-kala-dark truncate">{proj.name || proj.id}</p>
                      {proj.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate">{proj.location}</p>
                        </div>
                      )}
                      {proj.client && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{proj.client}</p>
                      )}
                      <div className="mt-1.5">
                        <Badge status={proj.status || 'active'} />
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="pr-5 flex-shrink-0">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(proj.id)}
                        className="w-5 h-5 rounded border-gray-300 text-kala-red focus:ring-kala-red"
                      />
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Assignments ({selectedIds.length})</Button>
        </div>
      </div>
    </Modal>
  )
}
