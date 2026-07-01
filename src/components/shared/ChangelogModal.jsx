import { Modal } from './Modal'
import changelogRaw from '../../../CHANGELOG.md?raw'

export function ChangelogModal({ open, onClose }) {
  // A simple markdown renderer for the specific changelog format we have
  const renderLine = (line, i) => {
    const trimmed = line.trim()
    if (trimmed === '') return null
    if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-kala-dark">{trimmed.replace('# ', '')}</h1>
    if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-kala-red border-b border-gray-100 pb-2">{trimmed.replace('## ', '')}</h2>
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-md font-bold mt-4 mb-2 text-gray-800">{trimmed.replace('### ', '')}</h3>
    
    if (trimmed.startsWith('- **')) {
      const parts = trimmed.substring(2).split('**')
      if (parts.length >= 3) {
        return (
          <li key={i} className="ml-5 mb-2.5 text-sm text-gray-600 list-disc pl-1 leading-relaxed">
            <strong className="text-gray-900">{parts[1]}</strong>
            {parts.slice(2).join('**')}
          </li>
        )
      }
    }
    
    if (trimmed.startsWith('- ')) {
       return <li key={i} className="ml-5 mb-2.5 text-sm text-gray-600 list-disc pl-1 leading-relaxed">{trimmed.replace('- ', '')}</li>
    }
    
    if (trimmed === '---') return <hr key={i} className="my-6 border-gray-100" />
    
    return <p key={i} className="mb-2 text-sm text-gray-600 leading-relaxed">{trimmed}</p>
  }

  return (
    <Modal open={open} onClose={onClose} title="What's New in Kala" maxWidth="max-w-2xl">
      <div className="max-h-[60vh] overflow-y-auto px-2 pb-4 pt-2 custom-scrollbar">
        {changelogRaw.split('\n').map(renderLine)}
      </div>
    </Modal>
  )
}
