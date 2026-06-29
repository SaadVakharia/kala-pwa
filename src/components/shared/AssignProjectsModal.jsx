import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'

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
        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No projects found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-2">
              {filteredProjects.map(proj => (
                <label key={proj.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors border border-transparent hover:border-gray-200">
                  <input 
                    type="checkbox"
                    checked={selectedIds.includes(proj.id)}
                    onChange={() => handleToggle(proj.id)}
                    className="rounded border-gray-300 text-kala-red focus:ring-kala-red flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 truncate" title={proj.name || proj.id}>{proj.name || proj.id}</span>
                </label>
              ))}
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
