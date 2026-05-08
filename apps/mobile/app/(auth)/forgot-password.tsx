import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../constants/theme'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    if (!email.trim()) { setError('Enter your email address'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (authError) { setError(authError.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
        <Text style={styles.heading}>Check your inbox</Text>
        <Text style={styles.subheading}>Reset link sent to {email}</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.button}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: SPACING.lg }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.sm }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Reset your password</Text>
        <Text style={styles.subheading}>We'll send a reset link to your email</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={{ color: COLORS.danger, fontSize: FONT_SIZE.sm }}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleReset}
          returnKeyType="send"
        />

        <TouchableOpacity
          onPress={handleReset}
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send reset link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  heading: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subheading: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14, color: COLORS.text, fontSize: FONT_SIZE.base, marginBottom: SPACING.md },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: FONT_SIZE.base, fontWeight: '600' },
})