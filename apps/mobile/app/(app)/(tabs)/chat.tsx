import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MessageSquare } from 'lucide-react-native'
import { COLORS, FONT_SIZE, SPACING } from '../../../constants/theme'

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <MessageSquare size={48} color={COLORS.textMuted} />
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>
          Open the web app to access full chat. Mobile chat coming in the next update.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
})