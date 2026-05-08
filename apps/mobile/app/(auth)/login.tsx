import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.replace('/(app)/(tabs)/dashboard')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>W</Text>
          </View>
          <Text style={styles.logoText}>WorkPulse</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to your workspace</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
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
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={styles.signupRow}
        >
          <Text style={styles.signupText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.signupLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl,
  },
  logoArea: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.xl, gap: 10,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIconText: { color: 'white', fontWeight: '700', fontSize: 18 },
  logoText: { color: 'white', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  heading: {
    fontSize: FONT_SIZE['2xl'], fontWeight: '700',
    color: COLORS.text, marginBottom: 6,
  },
  subheading: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.sm },
  form: { gap: SPACING.md },
  field: { gap: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md,
    paddingVertical: 14, color: COLORS.text,
    fontSize: FONT_SIZE.base,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: FONT_SIZE.base, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 4 },
  linkText: { color: COLORS.primaryLight, fontSize: FONT_SIZE.sm },
  signupRow: { marginTop: SPACING.xl, alignItems: 'center' },
  signupText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  signupLink: { color: COLORS.primaryLight, fontWeight: '600' },
})