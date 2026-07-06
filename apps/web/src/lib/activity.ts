// apps/web/src/lib/activity.ts

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'task_assigned'
  | 'task_completed'
  | 'task_deleted'
  | 'task_commented'
  | 'blocker_added'
  | 'blocker_resolved'
  | 'project_created'
  | 'project_updated'
  | 'project_completed'
  | 'project_deleted'
  | 'goal_created'
  | 'goal_updated'
  | 'goal_checkin'
  | 'goal_completed'
  | 'goal_deleted'
  | 'member_invited'
  | 'member_joined'
  | 'channel_created'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'contact_created'

export interface LogActivityParams {
  workspaceId: string
  userId: string
  entityType: string
  entityId?: string
  entityTitle?: string
  action: ActivityAction
  metadata?: Record<string, any>
  notifyUserIds?: string[]
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const {
    workspaceId,
    userId,
    entityType,
    entityId,
    entityTitle,
    action,
    metadata = {},
    notifyUserIds = [],
  } = params

  try {
    const supabase = await createServerSupabaseClient()

    // Write activity log – cast supabase to any to bypass type checks
    await (supabase as any)
      .from('activity_logs')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        entity_title: entityTitle,
        action,
        metadata,
      })

    // Write notifications for relevant users (excluding the actor)
    const targetUsers = notifyUserIds.filter(id => id !== userId)
    if (targetUsers.length === 0) return

    const notificationTitle = buildNotificationTitle(action, entityTitle, metadata)
    const notificationLink = buildNotificationLink(entityType, entityId)

    // Cast supabase to any for notifications as well
    await (supabase as any)
      .from('notifications')
      .insert(
        targetUsers.map(uid => ({
          workspace_id: workspaceId,
          user_id: uid,
          entity_type: entityType,
          entity_id: entityId,
          type: action.includes('blocked') ? 'warning' : action.includes('completed') ? 'success' : 'info',
          title: notificationTitle,
          message: metadata.message ?? null,
          link: notificationLink,
          read: false,
        }))
      )
  } catch (err) {
    // Never throw — activity logging must never break the primary action
    console.error('[logActivity] failed silently:', err)
  }
}

function buildNotificationTitle(action: ActivityAction, entityTitle?: string, metadata?: any): string {
  const name = metadata?.actorName ?? 'Someone'
  const title = entityTitle ?? 'an item'

  const map: Record<ActivityAction, string> = {
    task_created: `${name} created task "${title}"`,
    task_updated: `${name} updated "${title}"`,
    task_status_changed: `${name} moved "${title}" to ${metadata?.newStatus ?? 'a new status'}`,
    task_assigned: `${name} assigned "${title}" to you`,
    task_completed: `${name} completed "${title}"`,
    task_deleted: `${name} deleted task "${title}"`,
    task_commented: `${name} commented on "${title}"`,
    blocker_added: `"${title}" is now blocked`,
    blocker_resolved: `Blocker on "${title}" was resolved`,
    project_created: `${name} created project "${title}"`,
    project_updated: `${name} updated project "${title}"`,
    project_completed: `Project "${title}" is now complete`,
    project_deleted: `${name} deleted project "${title}"`,
    goal_created: `${name} set a new goal: "${title}"`,
    goal_updated: `${name} updated goal "${title}"`,
    goal_checkin: `${name} checked in on goal "${title}"`,
    goal_completed: `Goal "${title}" was achieved`,
    goal_deleted: `${name} deleted goal "${title}"`,
    member_invited: `${name} invited you to a workspace`,
    member_joined: `${name} joined the workspace`,
    channel_created: `${name} created channel "${title}"`,
    deal_created: `${name} added deal "${title}"`,
    deal_stage_changed: `Deal "${title}" moved to ${metadata?.stage}`,
    deal_won: `Deal "${title}" was marked as Won`,
    deal_lost: `Deal "${title}" was marked as Lost`,
    contact_created: `${name} added contact "${title}"`,
  }

  return map[action] ?? `${name} updated ${title}`
}

function buildNotificationLink(entityType: string, entityId?: string): string {
  if (!entityId) return '/dashboard'
  const routes: Record<string, string> = {
    task: `/tasks/${entityId}`,
    project: `/projects/${entityId}`,
    goal: `/goals`,
    channel: `/chat`,
    deal: `/crm/pipeline`,
    contact: `/crm/contacts/${entityId}`,
  }
  return routes[entityType] ?? '/dashboard'
}