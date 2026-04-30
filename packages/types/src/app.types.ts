export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'

export type UserRole = 'executive' | 'manager' | 'team_lead' | 'staff'

export type PlanType = 'free' | 'pro' | 'enterprise'

export type NotificationType =
  | 'task_overdue'
  | 'task_comment'
  | 'task_assigned'
  | 'goal_updated'
  | 'blocker_alert'
  | 'kpi_ready'
  | 'mention'

export interface WorkspaceTheme {
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

export interface KPIScore {
  completionRate: number
  onTimeRate: number
  priorityScore: number
  activityScore: number
  overallScore: number
}

export interface BlockerDigest {
  clientApproval: number
  budgetSignoff: number
  technicalIssue: number
  resourceShortage: number
  other: number
  total: number
}

export interface ReportFilter {
  userId?: string
  teamId?: string
  departmentId?: string
  startDate: string
  endDate: string
  includeKpis: boolean
  includeTasks: boolean
  includeBlockers: boolean
}