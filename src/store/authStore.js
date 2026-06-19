import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../api/firebase'

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  RSP_TECHNICIAN: 'rsp_technician',
  RSP_ISSUE: 'rsp_issue',
  CLIENT: 'client',
  GUEST: 'guest',
}

export const ROLE_HOME = {
  admin: '/admin',
  employee: '/employee',
  rsp_technician: '/rsp',
  rsp_issue: '/rsp-issue',
  client: '/client',
  guest: '/guest',
}

// Fetch role — auto-create profile doc if first login
async function fetchOrCreateUserRole(uid, phone) {
  const ref = doc(db, 'profiles', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data().role || 'guest'
  // First login — create profile with guest role
  await setDoc(ref, {
    uid,
    phone: phone || null,
    role: 'guest',
    createdAt: serverTimestamp(),
  })
  return 'guest'
}

let _confirmationResult = null
let _pendingPhone = null

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: false,
      error: null,

      sendOtp: async (phoneNumber) => {
        set({ loading: true, error: null })
        try {
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
              auth,
              'recaptcha-container',
              { size: 'invisible' }
            )
          }
          _pendingPhone = phoneNumber
          _confirmationResult = await signInWithPhoneNumber(
            auth,
            phoneNumber,
            window.recaptchaVerifier
          )
          set({ loading: false })
          return { success: true }
        } catch (err) {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear()
            window.recaptchaVerifier = null
          }
          _confirmationResult = null
          _pendingPhone = null
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      verifyOtp: async (otp) => {
        set({ loading: true, error: null })
        try {
          if (!_confirmationResult) throw new Error('No OTP session. Please resend.')
          const result = await _confirmationResult.confirm(otp)
          const role = await fetchOrCreateUserRole(result.user.uid, _pendingPhone)
          _confirmationResult = null
          _pendingPhone = null
          set({ user: result.user, role, loading: false })
          return { success: true, role }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      loginWithPassword: async (phone, password) => {
        set({ loading: true, error: null })
        try {
          const email = `${phone.replace('+', '')}@kalafield.app`
          const result = await signInWithEmailAndPassword(auth, email, password)
          const role = await fetchOrCreateUserRole(result.user.uid, phone)
          set({ user: result.user, role, loading: false })
          return { success: true, role }
        } catch (err) {
          set({ error: 'Invalid phone number or password.', loading: false })
          return { success: false, error: err.message }
        }
      },

      logout: async () => {
        await signOut(auth)
        _confirmationResult = null
        _pendingPhone = null
        set({ user: null, role: null, error: null })
      },

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'kalafield-auth',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
)