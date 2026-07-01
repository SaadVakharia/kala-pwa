import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, uploadFile, deleteFile } from '../../api/firebase'
import { Button } from '../ui/Button'
import {
  FolderOpen, ArrowLeft, Upload, FileText, Trash2, Plus,
  X, File, Image, ChevronRight, FolderPlus, ExternalLink
} from 'lucide-react'

// ── Predefined folders ──
const PREDEFINED_FOLDERS = [
  { slug: 'work_orders', label: 'Work Orders', color: 'bg-blue-50 text-blue-600' },
  { slug: 'product_data_sheets', label: 'Product Data Sheets', color: 'bg-purple-50 text-purple-600' },
  { slug: 'method_statements', label: 'Method Statements', color: 'bg-emerald-50 text-emerald-600' },
  { slug: 'permits', label: 'Permits', color: 'bg-amber-50 text-amber-600' },
  { slug: 'drawings', label: 'Drawings', color: 'bg-cyan-50 text-cyan-600' },
  { slug: 'other', label: 'Other Documents', color: 'bg-gray-100 text-gray-600' },
]

// ── Helpers ──
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type) {
  if (!type) return <File size={20} />
  if (type.startsWith('image/')) return <Image size={20} />
  return <FileText size={20} />
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * DocumentCenter — folder-based document management for a project.
 *
 * Props:
 *   projectId  – Firestore project document ID
 *   isAdmin    – boolean, can upload/delete
 *   customFolders – string[] of custom folder slugs from project doc
 *   onCustomFoldersChange – (updatedSlugs[]) => void – called when custom folders change
 */
export function DocumentCenter({ projectId, isAdmin, customFolders = [], onCustomFoldersChange }) {
  const [activeFolder, setActiveFolder] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const fileInputRef = useRef(null)

  // New folder modal state
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Build full folder list
  const allFolders = [
    ...PREDEFINED_FOLDERS,
    ...customFolders.map(slug => ({
      slug,
      label: slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      color: 'bg-rose-50 text-rose-600',
      isCustom: true,
    }))
  ]

  // Fetch documents for active folder
  useEffect(() => {
    if (!activeFolder) return
    let cancelled = false

    async function fetchDocs() {
      setLoadingDocs(true)
      try {
        const snap = await getDocs(collection(db, 'projects', projectId, 'documents'))
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(d => d.folder === activeFolder)
          .sort((a, b) => {
            const ta = a.uploadedAt?.seconds || 0
            const tb = b.uploadedAt?.seconds || 0
            return tb - ta
          })
        if (!cancelled) setDocuments(docs)
      } catch (err) {
        console.error('Failed to load documents:', err)
      } finally {
        if (!cancelled) setLoadingDocs(false)
      }
    }
    fetchDocs()
    return () => { cancelled = true }
  }, [activeFolder, projectId])

  // Count documents per folder (fetch all once for grid view)
  const [folderCounts, setFolderCounts] = useState({})
  useEffect(() => {
    async function fetchCounts() {
      try {
        const snap = await getDocs(collection(db, 'projects', projectId, 'documents'))
        const counts = {}
        snap.docs.forEach(d => {
          const folder = d.data().folder
          counts[folder] = (counts[folder] || 0) + 1
        })
        setFolderCounts(counts)
      } catch (err) {
        console.error('Failed to count documents:', err)
      }
    }
    if (!activeFolder) fetchCounts()
  }, [activeFolder, projectId])

  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !activeFolder) return

    setUploading(true)
    try {
      const storagePath = `project_docs/${projectId}/${activeFolder}/${Date.now()}_${file.name}`
      const url = await uploadFile(storagePath, file)

      await addDoc(collection(db, 'projects', projectId, 'documents'), {
        name: file.name,
        folder: activeFolder,
        url,
        type: file.type,
        size: file.size,
        storagePath,
        uploadedAt: serverTimestamp()
      })

      // Refresh docs
      const snap = await getDocs(collection(db, 'projects', projectId, 'documents'))
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.folder === activeFolder)
        .sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0))
      setDocuments(docs)

      // Update folder counts
      const counts = {}
      snap.docs.forEach(d => {
        const folder = d.data().folder
        counts[folder] = (counts[folder] || 0) + 1
      })
      setFolderCounts(counts)
    } catch (err) {
      console.error('Failed to upload:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Delete handler
  const handleDelete = async (docItem) => {
    if (!window.confirm(`Delete "${docItem.name}"? This cannot be undone.`)) return
    setDeleting(docItem.id)
    try {
      // Delete from storage
      if (docItem.url) await deleteFile(docItem.url)
      // Delete Firestore doc
      await deleteDoc(doc(db, 'projects', projectId, 'documents', docItem.id))
      setDocuments(prev => prev.filter(d => d.id !== docItem.id))
      setFolderCounts(prev => ({
        ...prev,
        [activeFolder]: Math.max(0, (prev[activeFolder] || 1) - 1)
      }))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  // Create custom folder
  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return

    const slug = slugify(name)
    if (!slug) return

    // Check for duplicates
    const allSlugs = allFolders.map(f => f.slug)
    if (allSlugs.includes(slug)) {
      alert('A folder with this name already exists.')
      return
    }

    setCreatingFolder(true)
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        customFolders: arrayUnion(slug)
      })
      if (onCustomFoldersChange) {
        onCustomFoldersChange([...customFolders, slug])
      }
      setNewFolderName('')
      setShowNewFolder(false)
    } catch (err) {
      console.error('Failed to create folder:', err)
      alert('Failed to create folder.')
    } finally {
      setCreatingFolder(false)
    }
  }

  // ── FOLDER DETAIL VIEW ──
  if (activeFolder) {
    const folderInfo = allFolders.find(f => f.slug === activeFolder) || {
      label: activeFolder, color: 'bg-gray-100 text-gray-600'
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFolder(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-kala-dark transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Document Center</span>
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-bold text-kala-dark">{folderInfo.label}</span>
        </div>

        {/* Upload bar (admin only) */}
        {isAdmin && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.dxf"
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-4 text-sm font-medium transition-all ${
                uploading
                  ? 'border-kala-red/30 bg-red-50/50 text-kala-red'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-kala-red/40 hover:text-kala-dark'
              }`}>
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-kala-red border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Click to Upload Document
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document list */}
        {loadingDocs ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">No documents yet</h3>
            <p className="text-xs text-gray-400">
              {isAdmin ? 'Upload your first document to this folder.' : 'No documents have been uploaded to this folder.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map(docItem => (
              <div
                key={docItem.id}
                className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 group hover:shadow-md hover:border-gray-300 transition-all"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${folderInfo.color}`}>
                  {getFileIcon(docItem.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kala-dark truncate">{docItem.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                    {docItem.size && <span>{formatBytes(docItem.size)}</span>}
                    {docItem.size && docItem.uploadedAt && <span>·</span>}
                    {docItem.uploadedAt && <span>{formatDate(docItem.uploadedAt)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={docItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-kala-dark hover:bg-gray-100 transition-all"
                    title="Open document"
                  >
                    <ExternalLink size={16} />
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(docItem)}
                      disabled={deleting === docItem.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-kala-red hover:bg-red-50 transition-all disabled:opacity-50"
                      title="Delete document"
                    >
                      {deleting === docItem.id ? (
                        <div className="w-4 h-4 border-2 border-kala-red border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── FOLDER GRID VIEW ──
  return (
    <div className="flex flex-col gap-4">
      {/* Folder grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {allFolders.map(folder => (
          <button
            key={folder.slug}
            onClick={() => setActiveFolder(folder.slug)}
            className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-left group flex flex-col gap-3"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${folder.color} group-hover:scale-105 transition-transform`}>
              <FolderOpen size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-kala-dark leading-tight">{folder.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                {folderCounts[folder.slug] || 0} document{(folderCounts[folder.slug] || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </button>
        ))}

        {/* Create New Folder button (admin only) */}
        {isAdmin && (
          <button
            onClick={() => setShowNewFolder(true)}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-kala-red/40 hover:bg-red-50/30 transition-all text-left group flex flex-col items-center justify-center gap-2 min-h-[120px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400 group-hover:text-kala-red group-hover:bg-red-50 transition-colors">
              <FolderPlus size={22} />
            </div>
            <p className="text-xs font-semibold text-gray-400 group-hover:text-kala-red transition-colors text-center">
              Create New Folder
            </p>
          </button>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-kala-dark">Create New Folder</h3>
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Client Approvals, Meeting Minutes"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={() => { setShowNewFolder(false); setNewFolderName('') }}
                disabled={creatingFolder}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                loading={creatingFolder}
                disabled={!newFolderName.trim()}
              >
                <FolderPlus size={16} className="mr-1.5" /> Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
