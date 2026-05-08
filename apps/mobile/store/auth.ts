import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  clear: () => void
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  roleLevel: number
  roleName: string
  workspaceId: string
  workspaceName: string
  primaryColor: string
  plan: string
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  profile: null,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ user: null, session: null, profile: null }),
}))