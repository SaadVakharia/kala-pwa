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

// Check if user needs profile/password setup
async function checkProfile(user) {
  try {
    const ref = doc(db, 'profiles', user.uid)
    const snap = await getDoc(ref)

    // Check if user has email (meaning they have setup password)
    const hasPassword = !!user.email

    if (snap.exists()) {
      if (!hasPassword) {
         return { needsSetup: true, role: snap.data().role, isExisting: true }
      }
      return { needsSetup: false, role: snap.data().role || 'junior_technician' }
    }

    // --- INITIAL USER BOOTSTRAP ---
    // If the profiles collection is completely empty, make the first person to log in the System Admin.
    try {
      const allProfilesQuery = query(collection(db, 'profiles'), limit(1))
      const allProfilesSnap = await getDocs(allProfilesQuery)
      
      if (allProfilesSnap.empty) {
        return { needsSetup: true, role: ROLES.ADMIN, isFirstAdmin: true }
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
          
          return { needsSetup: true, role: adminProfileData.role || 'junior_technician', adminProfileData, oldDocId: adminProfileDoc.id }
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
      verifyOtp: async (otp) => {
        set({ loading: true, error: null })
        try {
          const { confirmationResult } = get()
          if (!confirmationResult) throw new Error('No OTP session. Please resend.')
          const result = await confirmationResult.confirm(otp)

          const profileCheck = await checkProfile(result.user)
          
          if (profileCheck.needsSetup) {
             set({ confirmationResult: null, loading: false })
             return { success: true, needsSetup: true, setupData: profileCheck }
          } else {
             set({ user: result.user, role: profileCheck.role, confirmationResult: null, loading: false })
             return { success: true, role: profileCheck.role }
          }
        } catch (err) {
          set({ error: 'Invalid OTP. Please try again.', loading: false })
          return { success: false, error: err.message }
        }
      },

      // ── STEP 3: Setup Profile ──
      setupProfile: async (fullName, password, setupData) => {
        set({ loading: true, error: null })
        try {
          const currentUser = auth.currentUser
          if (!currentUser) throw new Error('Authentication lost. Please try again.')

          // 1. Update Email and Password in Firebase Auth
          const email = `${currentUser.phoneNumber.replace('+', '')}@kalafield.app`
          const { updateEmail, updatePassword } = await import('firebase/auth')
          await updateEmail(currentUser, email)
          await updatePassword(currentUser, password)

          // 2. Write to Firestore
          const ref = doc(db, 'profiles', currentUser.uid)
          
          if (setupData.isFirstAdmin) {
            await setDoc(ref, {
              phone: currentUser.phoneNumber,
              fullName,
              role: ROLES.ADMIN,
              userType: 'Internal',
              createdAt: serverTimestamp(),
            })
          } else if (setupData.adminProfileData) {
            await setDoc(ref, {
              ...setupData.adminProfileData,
              fullName,
              updatedAt: serverTimestamp(),
            })
            if (setupData.oldDocId) {
              const oldRef = doc(db, 'profiles', setupData.oldDocId)
              await deleteDoc(oldRef)
            }
          } else if (setupData.isExisting) {
            await setDoc(ref, { fullName, updatedAt: serverTimestamp() }, { merge: true })
          } else {
            await setDoc(ref, {
              phone: currentUser.phoneNumber,
              fullName,
              role: setupData.role || 'junior_technician',
              createdAt: serverTimestamp(),
            })
          }

          // 3. Log them in completely
          set({ user: currentUser, role: setupData.role, loading: false })
          return { success: true, role: setupData.role }
        } catch (err) {
          console.error('Setup Error:', err)
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      // ── PASSWORD LOGIN ──
      loginWithPassword: async (phone, password) => {
        set({ loading: true, error: null })
        try {
          const email = `${phone.replace('+', '')}@kalafield.app`
          const result = await signInWithEmailAndPassword(auth, email, password)
          const role = await checkProfile(result.user).then(res => res.role)
          set({ user: result.user, role, loading: false })
          return { success: true, role }
        } catch (err) {
          console.error('Password Login Error:', err)
          set({ error: `Login failed: ${err.message}`, loading: false })
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