import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuthStore, ROLE_HOME } from '../../store/authStore'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  const { role } = useAuthStore()

  return (
    <div className="min-h-screen bg-kala-gray flex flex-col items-center justify-center px-6">
      <ShieldX size={56} className="text-kala-red mb-4" />
      <h1 className="text-xl font-bold text-kala-dark mb-2">Access Denied</h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        You don't have permission to view this page.
      </p>
      <Button onClick={() => navigate(ROLE_HOME[role] || '/login')}>
        Go to my dashboard
      </Button>
    </div>
  )
}
