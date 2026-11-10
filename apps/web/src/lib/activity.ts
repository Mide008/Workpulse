// apps/web/src/lib/activity.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type ActivityAction = 
  | 'task_created' | 'task_updated' | 'task_status_changed' | 'task_assigned' | 'task_completed' | 'task_deleted' | 'task_commented'
  | 'blocker_added' | 'blocker_resolved' | 'project_created' | 'project_updated' | 'project_completed' | 'project_deleted'
  | 'goal_created' | 'goal_updated' | 'goal_checkin' | 'goal_completed' | 'goal_deleted'
  | 'member_invited' | 'member_joined' | 'channel_created' | 'deal_created' | 'deal_stage_changed' | 'deal_won' | 'deal_lost' | 'contact_created'
  | 'approval_requested' | 'approval_approved' | 'approval_rejected' | 'worklog_submitted' | 'leave_requested' | 'leave_approved' | 'leave_rejected' | 'appraisal_generated'

export interface LogActivityParams {
  workspaceId: string; userId: string; entityType: string; entityId?: string; entityTitle?: string;
  action: ActivityAction; metadata?: Record<string, any>; notifyUserIds?: string[];
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const { workspaceId, userId, entityType, entityId, entityTitle, action, metadata = {}, notifyUserIds = [] } = params

  try {
    const supabase = await createServerSupabaseClient()

    // 1. Write Activity Log
    const { error: logError } = await (supabase as any).from('activity_logs').insert({
      workspace_id: workspaceId, user_id: userId, entity_type: entityType,
      entity_id: entityId ? String(entityId) : null, entity_title: entityTitle, action, metadata,
    })

    if (logError) {
      console.error('❌ [logActivity] Failed to insert activity_log:', logError)
      return // Stop here if this fails
    }

    // 2. Write Notifications
    const targetUsers = notifyUserIds.filter(id => id !== userId)
    if (targetUsers.length === 0) return

    const { error: notifError } = await (supabase as any).from('notifications').insert(
      targetUsers.map(uid => ({
        workspace_id: workspaceId, user_id: uid, entity_type: entityType, entity_id: entityId ? String(entityId) : null,
        type: action.includes('blocked') ? 'warning' : action.includes('completed') || action.includes('approved') ? 'success' : action.includes('rejected') ? 'error' : 'info',
        title: buildNotificationTitle(action, entityTitle, metadata), message: metadata.message ?? null, link: buildNotificationLink(entityType, entityId), read: false,
      }))
    )
    
    if (notifError) console.error('❌ [logActivity] Failed to insert notification:', notifError)
  } catch (err) {
    console.error('❌ [logActivity] Fatal error:', err)
  }
}

function buildNotificationTitle(action: ActivityAction, entityTitle?: string, metadata?: any): string {
  const name = metadata?.actorName ?? 'Someone'
  const title = entityTitle ?? 'an item'
  const map: Record<string, string> = {
    approval_requested: `${name} requested approval: "${title}"`, approval_approved: `Your request "${title}" was approved`, approval_rejected: `Your request "${title}" was declined`,
    worklog_submitted: `${name} submitted a work log`, leave_requested: `${name} requested leave: "${title}"`, leave_approved: `Your leave request was approved`,
    leave_rejected: `Your leave request was declined`, appraisal_generated: `A performance appraisal was prepared for ${title}`,
    task_created: `${name} created task "${title}"`, task_updated: `${name} updated "${title}"`, task_status_changed: `${name} moved "${title}" to ${metadata?.newStatus ?? 'a new status'}`,
    task_assigned: `${name} assigned "${title}" to you`, task_completed: `${name} completed "${title}"`, task_deleted: `${name} deleted task "${title}"`,
    task_commented: `${name} commented on "${title}"`, blocker_added: `"${title}" is now blocked`, blocker_resolved: `Blocker on "${title}" was resolved`,
    project_created: `${name} created project "${title}"`, project_updated: `${name} updated project "${title}"`, project_completed: `Project "${title}" is now complete`,
    project_deleted: `${name} deleted project "${title}"`, goal_created: `${name} set a new goal: "${title}"`, goal_updated: `${name} updated goal "${title}"`,
    goal_checkin: `${name} checked in on goal "${title}"`, goal_completed: `Goal "${title}" was achieved`, goal_deleted: `${name} deleted goal "${title}"`,
    member_invited: `${name} invited you to a workspace`, member_joined: `${name} joined the workspace`, channel_created: `${name} created channel "${title}"`,
    deal_created: `${name} added deal "${title}"`, deal_stage_changed: `Deal "${title}" moved to ${metadata?.stage}`, deal_won: `Deal "${title}" was marked as Won`,
    deal_lost: `Deal "${title}" was marked as Lost`, contact_created: `${name} added contact "${title}"`,
  }
  return map[action] ?? `${name} updated ${title}`
}

function buildNotificationLink(entityType: string, entityId?: string): string {
  if (!entityId) return '/dashboard'
  const routes: Record<string, string> = { task: `/tasks/${entityId}`, project: `/projects/${entityId}`, goal: `/goals`, channel: `/chat`, deal: `/crm/pipeline`, contact: `/crm/contacts/${entityId}`, approval: '/approvals', worklog: '/standup', leave: '/hr', appraisal: '/hr' }
  return routes[entityType] ?? '/dashboard'
}