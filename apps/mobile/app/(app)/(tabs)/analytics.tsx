import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/auth'
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../../constants/theme'

function calcScore(tasks: any[]) {
  const total = tasks.length
  if (!total) return { overall: 0, completion: 0, onTime: 0 }
  const done = tasks.filter(t => t.status === 'done').length
  const completion = Math.round((done / total) * 100)
  const withDue = tasks.filter(t => t.due_date && t.status === 'done' && t.completed_at)
  const onTime = withDue.length > 0
    ? Math.round((withDue.filter(t => new Date(t.completed_at) <= new Date(t.due_date)).length / withDue.length) * 100)
    : completion
  const overall = Math.round(completion * 0.5 + onTime * 0.5)
  return { overall, completion, onTime }
}

function scoreColor(n: number) {
  if (n >= 80) return COLORS.success
  if (n >= 60) return COLORS.primary
  if (n >= 40) return COLORS.warning
  return COLORS.danger
}

export default function AnalyticsScreen() {
  const { profile } = useAuthStore()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const start = new Date(); start.setDate(start.getDate() - 30)
    supabase
      .from('tasks')
      .select('id, status, priority, due_date, completed_at')
      .eq('assigned_to', profile.id)
      .is('deleted_at', null)
      .gte('created_at', start.toISOString())
      .then(({ data }) => { setTasks(data ?? []); setLoading(false) })
  }, [profile])

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></SafeAreaView>

  const scores = calcScore(tasks)

  const cards = [
    { label: 'Overall Score', value: scores.overall },
    { label: 'Completion Rate', value: scores.completion },
    { label: 'On-time Rate', value: scores.onTime },
    { label: 'Total Tasks', value: tasks.length, noPercent: true },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>

        {/* KPI Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>KPI Score</Text>
          <Text style={[styles.scoreValue, { color: scoreColor(scores.overall) }]}>
            {scores.overall}
          </Text>
          <Text style={styles.scoreMax}>/ 100</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${scores.overall}%`, backgroundColor: scoreColor(scores.overall) }]} />
          </View>
        </View>

        {/* Cards */}
        <View style={styles.grid}>
          {cards.map(card => (
            <View key={card.label} style={styles.card}>
              <Text style={styles.cardValue}>
                {card.value}{!card.noPercent && '%'}
              </Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Status breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Status</Text>
          {['done', 'in_progress', 'blocked', 'not_started'].map(status => {
            const count = tasks.filter(t => t.status === status).length
            const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
            const colors: Record<string, string> = { done: COLORS.success, in_progress: COLORS.primary, blocked: COLORS.danger, not_started: COLORS.textMuted }
            const labels: Record<string, string> = { done: 'Done', in_progress: 'In Progress', blocked: 'Blocked', not_started: 'Not Started' }
            return (
              <View key={status} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{labels[status]}</Text>
                <View style={styles.statusBar}>
                  <View style={[styles.statusFill, { width: `${pct}%`, backgroundColor: colors[status] }]} />
                </View>
                <Text style={styles.statusCount}>{count}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '700', color: COLORS.text, paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginBottom: SPACING.lg },
  scoreCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, alignItems: 'center' },
  scoreLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 8 },
  scoreValue: { fontSize: 64, fontWeight: '700', lineHeight: 72 },
  scoreMax: { fontSize: FONT_SIZE.base, color: COLORS.textMuted },
  scoreBar: { width: '100%', height: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 4, marginTop: SPACING.md },
  scoreBarFill: { height: 8, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  card: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cardValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.primary },
  cardLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statusLabel: { width: 90, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  statusBar: { flex: 1, height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3 },
  statusFill: { height: 6, borderRadius: 3 },
  statusCount: { width: 24, fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'right' },
})