import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../api/supabase'

// Roles: admin | employee | rsp_technician | client | rsp_issue
export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  RSP_TECHNICIAN: 'rsp_technician',
  CLIENT: 'client',
  RSP_ISSUE: 'rsp_issue',
}

export const ROLE_HOME = {
  admin: '/admin',
  employee: '/employee',
  rsp_technician: '/rsp',
  client: '/client',
  rsp_issue: '/rsp-issue',
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error

          // Role stored in user_metadata or profiles table
          const role = data.user?.user_metadata?.role || 'employee'
          set({ user: data.user, role, loading: false })
          return { success: true, role }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, role: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'kalafield-auth',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
)
