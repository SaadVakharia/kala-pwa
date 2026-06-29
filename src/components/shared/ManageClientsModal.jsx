import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '../../api/firebase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { X, Plus, Edit2, Trash2, Check, AlertTriangle, Users } from 'lucide-react'

export function ManageClientsModal({ open, onClose }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [newClientName, setNewClientName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteWarning, setDeleteWarning] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    if (open) {
      fetchClients()
      resetState()
    }
  }, [open])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'clients'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setClients(list.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setNewClientName('')
    setEditingId(null)
    setDeletingId(null)
    setDeleteWarning(null)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newClientName.trim()) return
    setAdding(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        name: newClientName.trim(),
        createdAt: serverTimestamp()
      })
      setClients(prev => [...prev, { id: docRef.id, name: newClientName.trim() }].sort((a, b) => a.name.localeCompare(b.name)))
      setNewClientName('')
    } catch (err) {
      console.error(err)
      alert('Failed to add client')
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (client) => {
    setEditingId(client.id)
    setEditName(client.name)
    setDeletingId(null)
    setDeleteWarning(null)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return
    setSavingEdit(true)
    try {
      await updateDoc(doc(db, 'clients', editingId), {
        name: editName.trim(),
        updatedAt: serverTimestamp()
      })
      setClients(prev => prev.map(c => c.id === editingId ? { ...c, name: editName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to rename client')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleStartDelete = async (client) => {
    setEditingId(null)
    setDeletingId(client.id)
    setDeleting(true)
    try {
      // Check for attached projects
      const q = query(collection(db, 'projects'), where('clientId', '==', client.id))
      const snap = await getDocs(q)
      
      if (snap.size > 0) {
        setDeleteWarning({
          count: snap.size,
          clientName: client.name
        })
      } else {
        setDeleteWarning({ count: 0, clientName: client.name })
      }
    } catch (err) {
      console.error(err)
      alert('Failed to check project attachments')
      setDeletingId(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'clients', deletingId))
      setClients(prev => prev.filter(c => c.id !== deletingId))
      setDeletingId(null)
      setDeleteWarning(null)
    } catch (err) {
      console.error(err)
      alert('Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kala-red/10 flex items-center justify-center text-kala-red">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-kala-dark">Manage Clients</h2>
              <p className="text-xs text-gray-500">Add, rename, or remove clients</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* Add Client Form */}
          <form onSubmit={handleAdd} className="flex items-end gap-3 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Client Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              />
            </div>
            <Button type="submit" loading={adding} disabled={!newClientName.trim()} className="py-2.5 px-4 h-[42px]">
              <Plus size={16} className="mr-1.5" /> Add
            </Button>
          </form>

          {/* Client List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Existing Clients ({clients.length})</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-kala-red border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-white rounded-2xl border border-gray-100">
                No clients found. Add one above.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {clients.map(client => (
                  <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Main Row */}
                    <div className="flex items-center justify-between gap-3">
                      
                      {editingId === client.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 bg-white border border-kala-red rounded-lg py-1.5 px-3 text-sm font-semibold text-kala-dark focus:outline-none"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        />
                      ) : (
                        <div className="flex-1 font-semibold text-kala-dark text-sm truncate px-1">
                          {client.name}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {editingId === client.id ? (
                          <>
                            <button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Save">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel">
                              <X size={16} />
                            </button>
                          </>
                        ) : deletingId === client.id ? null : (
                          <>
                            <button onClick={() => handleStartEdit(client)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Rename">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleStartDelete(client)} className="p-1.5 text-kala-red hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete Warning / Confirmation area */}
                    {deletingId === client.id && deleteWarning && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100 flex flex-col gap-3">
                        {deleteWarning.count > 0 ? (
                          <div className="flex gap-2 text-kala-red">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p className="text-xs font-medium leading-relaxed">
                              This client is currently attached to <strong>{deleteWarning.count} project(s)</strong>. 
                              Deleting it will remove the client reference from those projects.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 font-medium">Are you sure you want to delete this client?</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} className="h-7 text-xs border-red-200 text-gray-600 bg-white">Cancel</Button>
                          <Button size="sm" onClick={handleConfirmDelete} loading={deleting} className="h-7 text-xs bg-kala-red hover:bg-red-700 text-white">Confirm Delete</Button>
                        </div>
                      </div>
                    )}
                    
                    {deletingId === client.id && !deleteWarning && deleting && (
                       <div className="text-xs text-gray-500 italic py-1 px-1">Checking projects...</div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        
      </div>
    </div>
  )
}
