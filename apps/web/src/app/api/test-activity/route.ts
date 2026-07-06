// apps/web/src/app/api/test-activity/route.ts
import { withAuth } from '@/lib/api-guard'
import { logActivity } from '@/lib/activity'
import type { NextRequest } from 'next/server'

export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    await logActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      entityType: 'task',
      entityId: 'test-id',
      entityTitle: 'Test Task',
      action: 'task_created',
      metadata: { actorName: 'Test User' },
      notifyUserIds: [],
    })

    return Response.json({ success: true, message: 'Activity logged successfully' })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
})