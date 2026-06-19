import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, ROLE_HOME } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Eye, EyeOff, Building2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const result = await login(email, password)
    if (result.success) {
      const from = location.state?.from?.pathname
      navigate(from || ROLE_HOME[result.role] || '/employee', { replace: true })
    }
  }

  return (
    <div className="min-h-screen w-screen flex bg-kala-gray">

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden md:flex flex-col justify-between w-[45%] bg-kala-dark p-12">
        <img src="/logo.png" alt="KALA" className="h-10 object-contain self-start brightness-0 invert" />

        <div>
          <div className="w-12 h-1 bg-kala-red mb-6 rounded-full" />
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Field Operations<br />Management
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Manage sites, track progress, and coordinate teams — all in one place.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Site Progress Tracking' },
            { label: 'RSP Issue Management' },
            { label: 'Multi-role Access Control' },
            { label: 'Real-time Reporting' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-kala-red flex-shrink-0" />
              <span className="text-gray-400 text-sm">{f.label}</span>
            </div>
          ))}
          <p className="text-gray-600 text-xs mt-4">© {new Date().getFullYear()} Kala Group · KalaField v0.1.0</p>
        </div>
      </div>

      {/* ── RIGHT PANEL / full mobile ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 safe-top safe-bottom">

        {/* Mobile logo */}
        <div className="md:hidden mb-10">
          <img src="/logo.png" alt="KALA" className="h-12 object-contain" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-kala-dark">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your KalaField account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-kala-dark">Email</label>
              <input
                type="email"
                placeholder="you@kalagroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-kala-border bg-white text-kala-dark placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-kala-dark">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-kala-border bg-white text-kala-dark placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kala-red hover:bg-kala-red-dark text-white font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">
            Kala Group · Field Operations Platform
          </p>
        </div>
      </div>
    </div>
  )
}
