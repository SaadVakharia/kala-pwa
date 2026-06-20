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
}

export const ROLE_HOME = {
  admin: '/admin',
  employee: '/employee',
  rsp_technician: '/rsp',
  rsp_issue: '/rsp-issue',
  client: '/client',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  employee: 'Employee',
  rsp_technician: 'RSP Technician',
  rsp_issue: 'RSP Issue',
  client: 'Client',
}

// Fetch role — creates profile if first login
async function getOrCreateProfile(user) {
  try {
    const ref = doc(db, 'profiles', user.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      return snap.data().role || 'employee'
    }

    // First login — create profile with default role
    await setDoc(ref, {
      phone: user.phoneNumber || null,
      role: 'employee',
      fullName: '',
      createdAt: serverTimestamp(),
    })
    return 'employee'
  } catch {
    return 'employee'
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: false,
      error: null,
      confirmationResult: null,

      // ── STEP 1: Send OTP ──
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
          const confirmation = await signInWithPhoneNumber(
            auth,
            phoneNumber,
            window.recaptchaVerifier
          )
          set({ confirmationResult: confirmation, loading: false })
          return { success: true }
        } catch (err) {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear()
            window.recaptchaVerifier = null
          }
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      // ── STEP 2: Verify OTP ──
      // extraData is optional: { fullName, company, password } for registration
      verifyOtp: async (otp, extraData) => {
        set({ loading: true, error: null })
        try {
          const { confirmationResult } = get()
          if (!confirmationResult) throw new Error('No OTP session. Please resend.')
          const result = await confirmationResult.confirm(otp)

          // If registration data provided, update the profile
          if (extraData?.fullName) {
            const ref = doc(db, 'profiles', result.user.uid)
            const snap = await getDoc(ref)
            const profileData = {
              phone: result.user.phoneNumber || null,
              fullName: extraData.fullName,
              company: extraData.company || '',
              role: snap.exists() ? (snap.data().role || 'employee') : 'employee',
              ...(snap.exists() ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
            }
            await setDoc(ref, profileData, { merge: true })
            const role = profileData.role
            set({ user: result.user, role, confirmationResult: null, loading: false })
            return { success: true, role }
          }

          // Standard login flow — creates profile doc if first login
          const role = await getOrCreateProfile(result.user)
          set({ user: result.user, role, confirmationResult: null, loading: false })
          return { success: true, role }
        } catch (err) {
          set({ error: 'Invalid OTP. Please try again.', loading: false })
          return { success: false, error: err.message }
        }
      },

      // ── PASSWORD LOGIN ──
      loginWithPassword: async (phone, password) => {
        set({ loading: true, error: null })
        try {
          const email = `${phone.replace('+', '')}@kalafield.app`
          const result = await signInWithEmailAndPassword(auth, email, password)
          const role = await getOrCreateProfile(result.user)
          set({ user: result.user, role, loading: false })
          return { success: true, role }
        } catch (err) {
          set({ error: 'Invalid phone number or password.', loading: false })
          return { success: false, error: err.message }
        }
      },

      // ── LOGOUT ──
      logout: async () => {
        await signOut(auth)
        set({ user: null, role: null, error: null, confirmationResult: null })
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