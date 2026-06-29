import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { ProjectCard } from './ProjectCard'

export function AssignProjectsModal({ open, onClose, projects, initialAssignedIds, onSave }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    if (open) {
      setSelectedIds(initialAssignedIds || [])
      setSearch('')
      setStatusFilter('All')
    }
  }, [open, initialAssignedIds])

  const filteredProjects = projects.filter(p => {
    const matchesSearch = (p.name || p.id).toLowerCase().includes(search.toLowerCase())

    let matchesStatus = true
    if (statusFilter !== 'All') {
      const pStatus = (p.status || 'active').toLowerCase()
      if (statusFilter === 'Active') matchesStatus = pStatus === 'active'
      else if (statusFilter === 'On Hold') matchesStatus = ['on_hold', 'on hold', 'on-hold', 'onhold'].includes(pStatus)
      else if (statusFilter === 'Completed') matchesStatus = pStatus === 'completed'
    }

    return matchesSearch && matchesStatus
  })

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
        {/* Search & Filter */}
        <div className="flex gap-2 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kala-red text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-kala-red bg-white cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
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
              <span className="text-sm font-semibold text-kala-dark">Select All Projects</span>
            </label>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 pr-2">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No projects found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProjects.map(proj => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  selectable={true}
                  selected={selectedIds.includes(proj.id)}
                  onToggle={() => handleToggle(proj.id)}
                />
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
