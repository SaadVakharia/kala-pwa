import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, ROLE_HOME } from '../../store/authStore'
import { ArrowLeft, Shield, User, Building2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

// ── Shared styles (mirroring LoginPage) ──
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

const SCREEN = {
  DETAILS: 'details',   // enter name, phone, company, password
  OTP: 'otp',           // verify OTP
  SUCCESS: 'success',   // registration complete
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { sendOtp, verifyOtp, loading, error, clearError } = useAuthStore()

  const [screen, setScreen] = useState(SCREEN.DETAILS)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [localError, setLocalError] = useState('')

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

  // ── Validate & send OTP ──
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    if (fullName.trim().length < 2) {
      setLocalError('Please enter your full name')
      return
    }
    if (phone.length < 10) {
      setLocalError('Please enter a valid 10-digit phone number')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    const formatted = formatPhone(phone)
    const result = await sendOtp(formatted)
    if (result.success) {
      setScreen(SCREEN.OTP)
      startCountdown()
    }
  }

  // ── Verify OTP & complete registration ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    clearError()
    const code = otp.join('')
    if (code.length < 6) return
    const result = await verifyOtp(code, { fullName: fullName.trim(), company: company.trim(), password })
    if (result.success) {
      setScreen(SCREEN.SUCCESS)
      setTimeout(() => {
        navigate(ROLE_HOME[result.role] || '/employee', { replace: true })
      }, 2000)
    }
  }

  // ── OTP input handlers ──
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) {
      document.getElementById(`reg-otp-${idx + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`reg-otp-${idx - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('reg-otp-5')?.focus()
    }
  }

  const handleResendOtp = async (e) => {
    e?.preventDefault()
    clearError()
    const formatted = formatPhone(phone)
    const result = await sendOtp(formatted)
    if (result.success) startCountdown()
  }

  const displayError = localError || error

  return (
    <div className="min-h-[100dvh] w-screen flex bg-kala-gray">

      {/* ── LEFT PANEL desktop ── */}
      <div className="hidden md:flex flex-col justify-between w-[45%] bg-kala-dark p-12">
        <img src="/logo.png" alt="KALA" className="h-10 object-contain self-start brightness-0 invert" />
        <div>
          <div className="w-12 h-1 bg-kala-red mb-6 rounded-full" />
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Join KalaField<br />Today
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Create your account to access field operations management tools.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {['Quick Phone Verification', 'Secure Password Setup', 'Instant Dashboard Access', 'Multi-role Support'].map((f) => (
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

          {/* ── SCREEN: REGISTRATION DETAILS ── */}
          {screen === SCREEN.DETAILS && (
            <form onSubmit={handleRegisterSubmit}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-kala-dark">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Fill in your details to get started
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-kala-dark">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className={`${inputCls} pl-10`}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Phone Number */}
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

                {/* Company / Organization (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-kala-dark">
                    Company / Organization
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Kala Group"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={`${inputCls} pl-10`}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-kala-dark">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputCls} pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            password.length >= 8
                              ? 'bg-green-500 w-full'
                              : password.length >= 6
                                ? 'bg-yellow-500 w-2/3'
                                : 'bg-red-400 w-1/3'
                          }`}
                          style={{ width: password.length >= 8 ? '100%' : password.length >= 6 ? '66%' : '33%' }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${
                        password.length >= 8 ? 'text-green-600' : password.length >= 6 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {password.length >= 8 ? 'Strong' : password.length >= 6 ? 'Good' : 'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                {displayError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {displayError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length < 10 || !fullName.trim() || password.length < 6}
                  className={btnCls}
                >
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-kala-red font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ── SCREEN: OTP VERIFY ── */}
          {screen === SCREEN.OTP && (
            <form onSubmit={handleVerifyOtp}>
              <button
                type="button"
                onClick={() => { setScreen(SCREEN.DETAILS); clearError(); setLocalError('') }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-kala-dark mb-6 -ml-1"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <Shield size={24} className="text-kala-red" />
                </div>
                <h2 className="text-2xl font-bold text-kala-dark">Verify Phone</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the OTP sent to <span className="font-medium text-kala-dark">+91 {phone}</span>
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`reg-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className={`
                      w-10 h-10 text-center text-lg font-bold rounded-lg border-2
                      focus:outline-none transition-all
                      ${
                        digit
                          ? "border-kala-red bg-red-50 text-kala-red"
                          : "border-gray-200 bg-white text-kala-dark focus:border-kala-red"
                      }
                    `}
                  />
                ))}
              </div>

              {(error || localError) && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
                  {error || localError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className={`${btnCls} mb-4`}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              {/* Resend */}
              <p className="text-center text-sm text-gray-500">
                Didn't receive it?{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-kala-red font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          )}

          {/* ── SCREEN: SUCCESS ── */}
          {screen === SCREEN.SUCCESS && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-kala-dark mb-2">Account Created!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Welcome to KalaField. Redirecting you to your dashboard...
              </p>
              <div className="w-8 h-8 border-2 border-kala-red border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

        </div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />
    </div>
  )
}
