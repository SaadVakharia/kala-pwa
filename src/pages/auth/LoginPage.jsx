import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, ROLE_HOME } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'

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
    <div className="min-h-screen bg-white flex flex-col safe-top">
      {/* Top red band */}
      <div className="bg-kala-red h-2 w-full" />

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src="/logo.png"
            alt="KALA"
            className="h-14 object-contain"
          />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-kala-dark">Welcome back</h1>
          <p className="text-kala-gray-mid mt-1 text-sm">Sign in to KalaField</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@kalagroup.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-kala-dark">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg border border-kala-border bg-white text-kala-dark placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
            className="mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-xs text-gray-400">
            Kala Group · Field Operations Platform
          </p>
          <p className="text-xs text-gray-300 mt-1">v0.1.0</p>
        </div>
      </div>

      {/* Bottom red accent */}
      <div className="bg-kala-red h-1 w-full safe-bottom" />
    </div>
  )
}
