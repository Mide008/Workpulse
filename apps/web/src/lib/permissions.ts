export type Permission =
  | 'view_all_departments'
  | 'view_all_kpis'
  | 'view_team_kpis'
  | 'view_own_kpis'
  | 'manage_workspace'
  | 'manage_members'
  | 'manage_roles'
  | 'manage_billing'
  | 'set_goals'
  | 'view_goals'
  | 'assign_tasks'
  | 'create_tasks'
  | 'update_own_tasks'
  | 'delete_tasks'
  | 'comment_on_tasks'
  | 'export_reports'
  | 'generate_ai_summaries'
  | 'view_blocker_digest'
  | 'manage_channels'
  | 'create_channels'
  | 'manage_projects'
  | 'create_projects'
  | 'view_activity_logs'
  | 'manage_departments'

// Role level: 1 = Executive, 2 = Manager, 3 = Team Lead, 4 = Staff
const ROLE_PERMISSIONS: Record<number, Permission[]> = {
  1: [
    // Executive has all permissions
    'view_all_departments', 'view_all_kpis', 'view_own_kpis', 'view_team_kpis',
    'manage_workspace', 'manage_members', 'manage_roles', 'manage_billing',
    'set_goals', 'view_goals', 'assign_tasks', 'create_tasks', 'update_own_tasks',
    'delete_tasks', 'comment_on_tasks', 'export_reports', 'generate_ai_summaries',
    'view_blocker_digest', 'manage_channels', 'create_channels', 'manage_projects',
    'create_projects', 'view_activity_logs', 'manage_departments',
  ],
  2: [
    // Manager
    'view_team_kpis', 'view_own_kpis', 'set_goals', 'view_goals',
    'assign_tasks', 'create_tasks', 'update_own_tasks', 'delete_tasks',
    'comment_on_tasks', 'export_reports', 'generate_ai_summaries',
    'view_blocker_digest', 'create_channels', 'manage_projects', 'create_projects',
    'view_activity_logs',
  ],
  3: [
    // Team Lead
    'view_own_kpis', 'view_goals', 'assign_tasks', 'create_tasks',
    'update_own_tasks', 'comment_on_tasks', 'create_channels', 'create_projects',
    'view_activity_logs',
  ],
  4: [
    // Staff
    'view_own_kpis', 'view_goals', 'create_tasks', 'update_own_tasks',
    'comment_on_tasks',
  ],
}

export function hasPermission(roleLevel: number, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[roleLevel] ?? ROLE_PERMISSIONS[4]
  return perms.includes(permission)
}

export function requirePermission(roleLevel: number, permission: Permission): void {
  if (!hasPermission(roleLevel, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

// Plan-based feature gating — fixes the plan enforcement gap
export type Plan = 'free' | 'pro' | 'enterprise'

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ['basic_tasks', 'basic_dashboard', 'team_up_to_5'],
  pro: [
    'basic_tasks', 'basic_dashboard', 'unlimited_team',
    'ai_summaries', 'file_uploads', 'pdf_reports', 'csv_export',
    'advanced_analytics', 'goals', 'blocker_digest', 'chat',
  ],
  enterprise: [
    'basic_tasks', 'basic_dashboard', 'unlimited_team',
    'ai_summaries', 'file_uploads', 'pdf_reports', 'csv_export',
    'advanced_analytics', 'goals', 'blocker_digest', 'chat',
    'white_label', 'sso', 'audit_logs', 'custom_roles', 'api_access',
    'dedicated_support', 'sla',
  ],
}

export function canUsePlanFeature(plan: Plan, feature: string): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}

export function assertPlanFeature(plan: Plan, feature: string): void {
  if (!canUsePlanFeature(plan, feature)) {
    throw new Error(`plan_upgrade_required:${feature}`)
  }
}