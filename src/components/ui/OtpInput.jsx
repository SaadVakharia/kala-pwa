import { useRef } from 'react'

/**
 * OtpInput component for 6-digit OTP verification.
 * Automatically handles forward focus, backward backspace focus, and pasted OTP validation.
 * 
 * @param {object} props
 * @param {string[]} props.value Array of 6 character digits
 * @param {function} props.onChange Callback with updated 6-digit array
 * @param {string} [props.error] Optional validation error message
 */
export function OtpInput({ value = ['', '', '', '', '', ''], onChange, error }) {
  const inputsRef = useRef([])

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const next = [...value]
    next[idx] = val.slice(-1)
    onChange(next)
    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      onChange(pasted.split(''))
      inputsRef.current[5]?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
        {value.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, idx)}
            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
            className={`
              w-10 h-10 text-center text-lg font-bold rounded-xl border-2
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
      {error && <span className="text-xs text-red-500 text-center">{error}</span>}
    </div>
  )
}
