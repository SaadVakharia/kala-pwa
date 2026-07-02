import { Building2, MapPin, IndianRupee, Plus } from 'lucide-react'
import { Button } from '../../ui/Button'

export function ProjectBasicDetailsSection({ form, onChange, clients, loadingClients, onOpenClientModal }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Site Basic Details</h2>
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        
        <div className="max-w-2xl">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Site / Project Name <span className="text-kala-red">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Building2 size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Enter site or project name"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div className="max-w-2xl">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client</label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <select
              value={form.clientId}
              onChange={(e) => onChange('clientId', e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-kala-dark focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent appearance-none cursor-pointer"
              disabled={loadingClients}
            >
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Button 
              type="button" 
              variant="outline" 
              className="text-kala-red border-kala-red hover:bg-red-50 w-full sm:w-auto"
              onClick={onOpenClientModal}
            >
              <Plus size={16} className="mr-1" /> Add Client
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location of Project</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MapPin size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Enter project location"
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Value</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <IndianRupee size={18} className="text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="Value in Cr"
                value={form.projectValue}
                onChange={(e) => onChange('projectValue', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                Cr
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
