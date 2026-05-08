export const COLORS = {
  background:   '#020617',
  surface:      '#0f172a',
  surfaceLight: '#1e293b',
  border:       'rgba(255,255,255,0.07)',
  borderLight:  'rgba(255,255,255,0.12)',
  text:         '#f8fafc',
  textSecondary:'#94a3b8',
  textMuted:    '#475569',
  primary:      '#6366F1',
  primaryLight: '#818CF8',
  success:      '#10B981',
  warning:      '#F59E0B',
  danger:       '#EF4444',
  info:         '#3B82F6',
  violet:       '#8B5CF6',
}

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
}

export const priorityColor = {
  low:      COLORS.textMuted,
  medium:   COLORS.warning,
  high:     '#F97316',
  critical: COLORS.danger,
}

export const statusColor = {
  not_started: COLORS.textMuted,
  in_progress: COLORS.info,
  blocked:     COLORS.danger,
  review:      COLORS.violet,
  done:        COLORS.success,
}

export const statusLabel = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  review:      'In Review',
  done:        'Done',
}