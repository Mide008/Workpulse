import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Bell } from 'lucide-react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/auth'
import { COLORS, FONT_SIZE, RADIUS, SPACING, statusColor, statusLabel, priorityColor } from '../../../constants/theme'

interface Task {
  id: string; title: string; status: string
  priority: string; due_date: string | null; progress: number
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardScreen() {
  const { profile } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, progress')
      .eq('assigned_to', profile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    setTasks((data as Task[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [profile])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{profile?.fullName.split(' ')[0]}</Text>
            <Text style={styles.workspace}>{profile?.workspaceName}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/(app)/notifications' as any)}>
            <Bell size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total', value: stats.total, color: COLORS.primary, Icon: CheckSquare },
            { label: 'In Progress', value: stats.inProgress, color: COLORS.info, Icon: Clock },
            { label: 'Blocked', value: stats.blocked, color: COLORS.danger, Icon: AlertTriangle },
            { label: 'Done', value: stats.done, color: COLORS.success, Icon: TrendingUp },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <stat.Icon size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/tasks')}>
              <Text style={styles.sectionLink}>View all →</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckSquare size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyText}>Tasks assigned to you will appear here</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(app)/new-task' as any)}
              >
                <Text style={styles.emptyButtonText}>Create task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tasks.slice(0, 8).map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskRow}
                onPress={() => router.push(`/(app)/task/${task.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: priorityColor[task.priority as keyof typeof priorityColor] ?? COLORS.textMuted }]} />
                <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={[styles.taskStatus, { color: statusColor[task.status as keyof typeof statusColor] ?? COLORS.textMuted }]}>
                  {statusLabel[task.status as keyof typeof statusLabel] ?? task.status}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.lg },
  greeting: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  name: { fontSize: FONT_SIZE['2xl'], fontWeight: '700', color: COLORS.text },
  workspace: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  sectionLink: { fontSize: FONT_SIZE.sm, color: COLORS.primaryLight },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  emptyButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: SPACING.lg },
  emptyButtonText: { color: 'white', fontWeight: '600', fontSize: FONT_SIZE.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 12, paddingHorizontal: SPACING.sm, marginBottom: 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  priorityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskTitle: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  taskDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskStatus: { fontSize: 11, fontWeight: '500', flexShrink: 0 },
})