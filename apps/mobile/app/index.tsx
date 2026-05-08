import { Redirect } from 'expo-router'
import { useAuthStore } from '../store/auth'

export default function IndexPage() {
  const { session } = useAuthStore()
  return <Redirect href={session ? '/(app)/(tabs)/dashboard' : '/(auth)/login'} />
}