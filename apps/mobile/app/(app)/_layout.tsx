import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useAuthStore } from '../../store/auth'
import { COLORS } from '../../constants/theme'

export default function AppLayout() {
  const { session } = useAuthStore()
  if (!session) return <Redirect href="/(auth)/login" />

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: COLORS.surface, width: 280 },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home', title: 'WorkPulse' }} />
    </Drawer>
  )
}