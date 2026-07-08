// apps/web/src/lib/demo-mode.ts

export const DEMO_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEMO_WORKSPACE_ID ?? null

export function isDemoMode(workspaceId: string): boolean {
  return DEMO_WORKSPACE_ID !== null && workspaceId === DEMO_WORKSPACE_ID
}