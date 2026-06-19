import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/logo.png'

export default function TopBar({ title, showBack = false }) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-kala-red text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded active:bg-red-700 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <img src={logo} alt="KALA" className="h-7 object-contain brightness-0 invert" />
        )}
        {title && <span className="font-semibold text-sm">{title}</span>}
      </div>

      <button
        onClick={handleLogout}
        className="text-xs font-medium opacity-90 active:opacity-100 px-2 py-1 rounded"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </header>
  )
}
