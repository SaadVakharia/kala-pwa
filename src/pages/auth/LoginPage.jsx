import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, ROLE_HOME } from '../../store/authStore'
import { Eye, EyeOff, Phone, ArrowLeft, Shield } from 'lucide-react'

// ── Shared input style ──
const inputCls = `
  w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
  text-kala-dark placeholder:text-gray-400 text-sm
  focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent
  transition-all
`

const btnCls = `
  w-full bg-kala-red hover:bg-kala-red-dark text-white font-semibold
  py-3 rounded-xl transition-all active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed text-sm
`

// ── Screens ──
const SCREEN = {
  PHONE: 'phone',       // enter phone number
  OTP: 'otp',           // enter OTP
  PASSWORD: 'password', // enter password
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendOtp, verifyOtp, loginWithPassword, loading, error, clearError } = useAuthStore()

  const [method, setMethod] = useState('otp') // 'otp' | 'password'
  const [screen, setScreen] = useState(SCREEN.PHONE)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const redirectAfterLogin = (role) => {
    const from = location.state?.from?.pathname
    navigate(from || ROLE_HOME[role] || '/employee', { replace: true })
  }

  // Format phone to E.164 (+91XXXXXXXXXX)
  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
    if (digits.length === 10) return `+91${digits}`
    return `+${digits}`
  }

  const startCountdown = () => {
    setCountdown(30)
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0 }
        return c - 1
      })
    }, 1000)
  }

  // ── Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault()
    clearError()
    const formatted = formatPhone(phone)
    const result = await sendOtp(formatted)
    if (result.success) {
      setScreen(SCREEN.OTP)
      startCountdown()
    }
  }

  // ── Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    clearError()
    const code = otp.join('')
    if (code.length < 6) return
    const result = await verifyOtp(code)
    if (result.success) redirectAfterLogin(result.role)
  }

  // ── Password login ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    clearError()
    const formatted = formatPhone(phone)
    const result = await loginWithPassword(formatted, password)
    if (result.success) redirectAfterLogin(result.role)
  }

  // ── OTP box input handler ──
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('otp-5')?.focus()
    }
  }

  const switchMethod = (m) => {
    setMethod(m)
    setScreen(SCREEN.PHONE)
    setOtp(['', '', '', '', '', ''])
    setPassword('')
    clearError()
  }

  return (
    <div className="min-h-screen w-screen flex bg-kala-gray">

      {/* ── LEFT PANEL desktop ── */}
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
          {['Site Progress Tracking', 'RSP Issue Management', 'Multi-role Access Control', 'Real-time Reporting'].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-kala-red flex-shrink-0" />
              <span className="text-gray-400 text-sm">{f}</span>
            </div>
          ))}
          <p className="text-gray-600 text-xs mt-4">© {new Date().getFullYear()} Kala Group · KalaField v0.1.0</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="md:hidden mb-10">
          <img src="/logo.png" alt="KALA" className="h-12 object-contain" />
        </div>

        <div className="w-full max-w-sm">

          {/* ── METHOD TABS ── */}
          {screen === SCREEN.PHONE && (
            <div className="flex bg-white rounded-xl p-1 mb-8 border border-gray-200">
              <button
                onClick={() => switchMethod('otp')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  method === 'otp'
                    ? 'bg-kala-red text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                OTP Login
              </button>
              <button
                onClick={() => switchMethod('password')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  method === 'password'
                    ? 'bg-kala-red text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Password Login
              </button>
            </div>
          )}

          {/* ── SCREEN: PHONE INPUT ── */}
          {screen === SCREEN.PHONE && (
            <form onSubmit={method === 'otp' ? handleSendOtp : (e) => { e.preventDefault(); setScreen(SCREEN.PASSWORD) }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-kala-dark">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {method === 'otp' ? 'We\'ll send an OTP to your mobile number' : 'Sign in with your password'}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-kala-dark">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 border-r border-gray-200 pr-3">
                      <span className="text-sm font-medium text-kala-dark">🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      className={`${inputCls} pl-24`}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || phone.length < 10} className={btnCls}>
                  {loading ? 'Please wait...' : method === 'otp' ? 'Send OTP' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {/* ── SCREEN: OTP VERIFY ── */}
          {screen === SCREEN.OTP && (
            <form onSubmit={handleVerifyOtp}>
              <button
                type="button"
                onClick={() => { setScreen(SCREEN.PHONE); clearError() }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-kala-dark mb-6 -ml-1"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <Shield size={24} className="text-kala-red" />
                </div>
                <h2 className="text-2xl font-bold text-kala-dark">Enter OTP</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sent to <span className="font-medium text-kala-dark">+91 {phone}</span>
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex justify-between gap-2 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    style={{ width: '44px', height: '52px' }}
                    className={`
                      text-center text-xl font-bold rounded-xl border-2
                      focus:outline-none transition-all shrink-0
                      ${digit
                        ? 'border-kala-red bg-red-50 text-kala-red'
                        : 'border-gray-200 bg-white text-kala-dark focus:border-kala-red'
                      }
                    `}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className={`${btnCls} mb-4`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Resend */}
              <p className="text-center text-sm text-gray-500">
                Didn't receive it?{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-kala-red font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          )}

          {/* ── SCREEN: PASSWORD ── */}
          {screen === SCREEN.PASSWORD && (
            <form onSubmit={handlePasswordLogin}>
              <button
                type="button"
                onClick={() => { setScreen(SCREEN.PHONE); clearError() }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-kala-dark mb-6 -ml-1"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-kala-dark">Enter Password</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Signing in as <span className="font-medium text-kala-dark">+91 {phone}</span>
                </p>
              </div>

              <div className="flex flex-col gap-4">
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
                      className={`${inputCls} pr-12`}
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

                <button type="submit" disabled={loading || !password} className={btnCls}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Invisible reCAPTCHA container (required by Firebase phone auth) */}
      <div id="recaptcha-container" />
    </div>
  )
}