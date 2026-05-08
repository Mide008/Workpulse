import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Search, Plus, AlertTriangle } from 'lucide-react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/auth'
import { COLORS, FONT_SIZE, RADIUS, SPACING, statusColor, statusLabel, priorityColor } from '../../../constants/theme'

interface Task {
  id: string; title: string; status: string
  priority: string; due_date: string | null; progress: number
  blocker_reason: string | null
}

export default function TasksScreen() {
  const { profile } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filtered, setFiltered] = useState<Task[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeStatus, setActiveStatus] = useState('all')

  const STATUSES = ['all', 'not_started', 'in_progress', 'blocked', 'done']

  const fetchTasks = useCallback(async () => {
    if (!profile) return
    let query = supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, progress, blocker_reason')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (profile.roleLevel > 2) query = query.eq('assigned_to', profile.id)
    else query = query.eq('workspace_id', profile.workspaceId)

    const { data } = await query
    const taskList = (data as Task[]) ?? []
    setTasks(taskList)
    applyFilters(taskList, search, activeStatus)
    setLoading(false)
    setRefreshing(false)
  }, [profile, search, activeStatus])

  function applyFilters(list: Task[], q: string, status: string) {
    let result = list
    if (q) result = result.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    if (status !== 'all') result = result.filter(t => t.status === status)
    setFiltered(result)
  }

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { applyFilters(tasks, search, activeStatus) }, [search, activeStatus, tasks])

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/new-task' as any)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color={COLORS.textMuted} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Status filter */}
      <FlatList
        horizontal
        data={STATUSES}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveStatus(item)}
            style={[styles.filterChip, activeStatus === item && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeStatus === item && styles.filterChipTextActive]}>
              {item === 'all' ? 'All' : statusLabel[item as keyof typeof statusLabel] ?? item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Task list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks() }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => router.push(`/(app)/task/${item.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.taskTop}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor[item.priority as keyof typeof priorityColor] ?? COLORS.textMuted }]} />
              <Text style={[styles.taskTitle, item.status === 'done' && styles.taskDone]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.taskStatus, { color: statusColor[item.status as keyof typeof statusColor] ?? COLORS.textMuted }]}>
                {statusLabel[item.status as keyof typeof statusLabel]}
              </Text>
            </View>

            {item.blocker_reason && (
              <View style={styles.blockerBadge}>
                <AlertTriangle size={12} color={COLORS.danger} />
                <Text style={styles.blockerText} numberOfLines={1}>{item.blocker_reason}</Text>
              </View>
            )}

            {item.progress > 0 && item.status !== 'done' && (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{item.progress}%</Text>
              </View>
            )}

            {item.due_date && (
              <Text style={[
                styles.dueDate,
                new Date(item.due_date) < new Date() && item.status !== 'done'
                  ? styles.dueDateOverdue
                  : null,
              ]}>
                Due {new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '700', color: COLORS.text },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  searchRow: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, position: 'relative', justifyContent: 'center' },
  searchInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingLeft: 40, paddingRight: SPACING.md, paddingVertical: 10, color: COLORS.text, fontSize: FONT_SIZE.sm },
  filterRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: FONT_SIZE.xs, fontWeight: '500', color: COLORS.textSecondary },
  filterChipTextActive: { color: 'white' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: 8 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZE.base },
  taskCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  taskTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  taskTitle: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: '500', color: COLORS.text, lineHeight: 22 },
  taskDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskStatus: { fontSize: 11, fontWeight: '600', flexShrink: 0 },
  blockerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  blockerText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  progressTrack: { flex: 1, height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, width: 28, textAlign: 'right' },
  dueDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 8 },
  dueDateOverdue: { color: COLORS.danger },
})