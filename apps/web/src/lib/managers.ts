// apps/web/src/lib/managers.ts
/** Ids of everyone at Manager level or above (role level <= 2) in a workspace. */
export async function getManagerIds(supabase: any, workspaceId: string, excludeUserId?: string): Promise<string[]> {
  const { data } = await supabase.from('users').select('id, role:roles(level)').eq('workspace_id', workspaceId)
  return ((data ?? []) as any[])
    .filter(u => (u.role?.level ?? 4) <= 2 && u.id !== excludeUserId)
    .map(u => u.id as string)
}
export function friendlyDbError(message: string): string {
  if (/does not exist|schema cache|relation/i.test(message))
    return 'This feature’s database table has not been created yet. Run the SQL migration (supabase/migrations/20260101000000_worklog_approvals.sql) in Supabase, then try again.'
  if (/row-level security|permission denied/i.test(message)) return 'You do not have permission to do that.'
  return message
}
