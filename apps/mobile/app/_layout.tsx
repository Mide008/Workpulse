import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

export default function RootLayout() {
  const { setSession, setProfile, clear } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          clear()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select(`
        id, full_name, email, avatar_url, job_title, workspace_id,
        role:roles(name, level),
        workspace:workspaces(name, primary_color, plan)
      `)
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      const role = data.role as { name: string; level: number } | null
      const workspace = data.workspace as { name: string; primary_color: string; plan: string } | null
      setProfile({
        id: (data as any).id,
        fullName: (data as any).full_name,
        email: (data as any).email,
        avatarUrl: (data as any).avatar_url,
        jobTitle: (data as any).job_title,
        roleLevel: role?.level ?? 4,
        roleName: role?.name ?? 'Staff',
        workspaceId: (data as any).workspace_id,
        workspaceName: workspace?.name ?? '',
        primaryColor: workspace?.primary_color ?? '#6366F1',
        plan: workspace?.plan ?? 'free',
      })
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#020617' } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  )
}