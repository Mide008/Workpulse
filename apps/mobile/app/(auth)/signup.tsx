import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../constants/theme'

export default function SignupScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✉️</Text>
        <Text style={styles.successHeading}>Check your email</Text>
        <Text style={styles.successText}>
          We sent a confirmation link to {email}. Check your inbox to activate your account.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.button}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>Start your 14-day free trial</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {[
            { label: 'Full name', value: fullName, setter: setFullName, placeholder: 'Sarah Johnson', type: 'default' as const },
            { label: 'Work email', value: email, setter: setEmail, placeholder: 'you@company.com', type: 'email-address' as const },
            { label: 'Password', value: password, setter: setPassword, placeholder: 'Min. 8 characters', type: 'default' as const, secure: true },
          ].map(field => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textMuted}
                keyboardType={field.type}
                secureTextEntry={field.secure}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSignup}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl },
  backBtn: { marginBottom: SPACING.lg },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  heading: { fontSize: FONT_SIZE['2xl'], fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subheading: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.sm },
  form: { gap: SPACING.md },
  field: { gap: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    color: COLORS.text, fontSize: FONT_SIZE.base,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: FONT_SIZE.base, fontWeight: '600' },
  successContainer: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  successEmoji: { fontSize: 56, marginBottom: SPACING.lg },
  successHeading: {
    fontSize: FONT_SIZE.xl, fontWeight: '700',
    color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center',
  },
  successText: {
    fontSize: FONT_SIZE.base, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl,
  },
})