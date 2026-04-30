import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceUser {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  roleLevel: number
  roleName: string
  workspaceId: string
  workspaceName: string
  workspaceLogo: string | null
  primaryColor: string
  plan: string
}

interface WorkspaceStore {
  user: WorkspaceUser | null
  setUser: (user: WorkspaceUser) => void
  clearUser: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'workpulse-workspace' }
  )
)