import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore'
import { auth, db } from '../api/firebase'

export const ROLES = {
  ADMIN: 'admin',
  SENIOR_TECHNICIAN: 'senior_technician',
  CLIENT: 'client',
  SITE_SUPERVISOR: 'site_supervisor',
  PROJECT_COORDINATOR: 'project_coordinator',
  PROJECT_MANAGER: 'project_manager',
  SAFETY_SUPERVISOR: 'safety_supervisor',
  QUALITY_SUPERVISOR: 'quality_supervisor',
  JUNIOR_TECHNICIAN: 'junior_technician',
  ACCOUNTS_MANAGER: 'accounts_manager',
  BILLING_ENGINEER: 'billing_engineer',
  SR_PURCHASE_MGR: 'sr_purchase_mgr',
  JR_PURCHASE_MGR: 'jr_purchase_mgr',
  HR_MANAGER: 'hr_manager',
  PROJECT_SALES_OFFICER: 'project_sales_officer',
  GENERAL_MANAGER: 'general_manager',
  PLANNING_ENGINEER: 'planning_engineer'
}

export const ROLE_HOME = {
  admin: '/admin',
  general_manager: '/admin',
  hr_manager: '/admin',
  client: '/client'
}

export const ROLE_LABELS = {
  admin: 'System Administrator',
  senior_technician: 'Senior Technician',
  client: 'Client',
  site_supervisor: 'Site Supervisor',
  project_coordinator: 'Project Coordinator',
  project_manager: 'Project Manager',
  safety_supervisor: 'Safety Supervisor',
  quality_supervisor: 'Quality Supervisor',
  junior_technician: 'Junior Technician',
  accounts_manager: 'Accounts Manager',
  billing_engineer: 'Billing Engineer',
  sr_purchase_mgr: 'Sr. Purchase Mgr',
  jr_purchase_mgr: 'Jr Purchase Mgr',
  hr_manager: 'HR Manager',
  project_sales_officer: 'Project Sales Officer (PSO)',
  general_manager: 'General Manager (GM)',
  planning_engineer: 'Planning Engineer'
}

// Fetch role — creates profile if first login
async function getOrCreateProfile(user) {
  try {
    const ref = doc(db, 'profiles', user.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      return snap.data().role || 'junior_technician'
    }

    // --- INITIAL USER BOOTSTRAP ---
    // If the profiles collection is completely empty, make the first person to log in the System Admin.
    try {
      const allProfilesQuery = query(collection(db, 'profiles'), limit(1))
      const allProfilesSnap = await getDocs(allProfilesQuery)
      
      if (allProfilesSnap.empty) {
        const adminData = {
          phone: user.phoneNumber,
          fullName: 'System Admin',
          role: ROLES.ADMIN,
          userType: 'Internal',
          createdAt: serverTimestamp(),
        }
        await setDoc(ref, adminData)
        return ROLES.ADMIN
      }
    } catch (e) {
      console.warn("Could not check if profiles are empty:", e)
    }

    // First login for a user created by admin
    if (user.phoneNumber) {
      try {
        const q = query(collection(db, 'profiles'), where('phone', '==', user.phoneNumber))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const adminProfileDoc = querySnapshot.docs[0]
          const adminProfileData = adminProfileDoc.data()
          
          await setDoc(ref, {
            ...adminProfileData,
            updatedAt: serverTimestamp(),
          })
          
          await deleteDoc(adminProfileDoc.ref)
          
          return adminProfileData.role || 'junior_technician'
        }
      } catch (e) {
        console.warn("Could not query profiles. Rules might be restricting this:", e)
      }
    }

    throw new Error('This account is not registered. Please contact your administrator.')
  } catch (err) {
    throw err
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
      sendOtp: async (phoneNumber, verifier) => {
        set({ loading: true, error: null })
        try {
          const appVerifier = verifier || window.recaptchaVerifier
          if (!appVerifier) throw new Error("reCAPTCHA not initialized")
          
          const confirmation = await signInWithPhoneNumber(
            auth,
            phoneNumber,
            appVerifier
          )
          set({ confirmationResult: confirmation, loading: false })
          return { success: true }
        } catch (err) {
          console.error("OTP Error:", err)
          // DO NOT clear the verifier here. Reusing it prevents the "already rendered" and "invalid-app-credential" errors.
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
              role: snap.exists() ? (snap.data().role || 'junior_technician') : 'junior_technician',
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