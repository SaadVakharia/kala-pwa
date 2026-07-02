import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../api/firebase'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'

export function AddClientModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        name: name.trim(),
        createdAt: serverTimestamp()
      })
      onSave({ id: docRef.id, name: name.trim() })
      setName('')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to add client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-kala-dark mb-4">Add New Client</h3>
        <Input 
          label="Client Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Developers"
          autoFocus
        />
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Add Client</Button>
        </div>
      </div>
    </div>
  )
}
