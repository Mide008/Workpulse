import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { FolderKanban, Plus } from 'lucide-react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/auth'
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../../constants/theme'

export default function ProjectsScreen() {
  const { profile } = useAuthStore()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('projects')
      .select('id, name, status, priority, color, progress, end_date')
      .eq('workspace_id', profile.workspaceId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { setProjects(data ?? []); setLoading(false) })
  }, [profile])

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></SafeAreaView>

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FolderKanban size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardTop}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.statusBadge, { color: item.status === 'active' ? COLORS.success : COLORS.textMuted }]}>
                {item.status}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={styles.progressLabel}>{item.progress}% complete</Text>
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
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { color: COLORS.textMuted, fontSize: FONT_SIZE.base },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  cardName: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.text },
  statusBadge: { fontSize: FONT_SIZE.xs, fontWeight: '500', textTransform: 'capitalize' },
  progressTrack: { height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 6 },
})