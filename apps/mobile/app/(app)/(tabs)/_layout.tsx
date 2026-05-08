import { Tabs } from 'expo-router'
import { LayoutDashboard, CheckSquare, FolderKanban, BarChart3, MessageSquare } from 'lucide-react-native'
import { COLORS } from '../../../constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: 'Tasks', tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="projects"
        options={{ title: 'Projects', tabBarIcon: ({ color, size }) => <FolderKanban size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Analytics', tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} /> }}
      />
    </Tabs>
  )
}