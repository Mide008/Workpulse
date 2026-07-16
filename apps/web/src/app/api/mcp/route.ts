// apps/web/src/app/api/mcp/route.ts
export const dynamic = 'force-dynamic'

import { validateApiKey } from '@/lib/api-key'
import { createClient } from '@supabase/supabase-js'
import { callAI } from '@/lib/agents/agent-base'
import type { NextRequest } from 'next/server'

// WorkPulse MCP Server — exposes tools that AI clients can call
const TOOLS = [
  {
    name: 'get_tasks',
    description: 'Get tasks from the WorkPulse workspace. Filter by status, priority, or assignee.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['not_started', 'in_progress', 'review', 'blocked', 'done'] },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        assignedTo: { type: 'string', description: 'User ID' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in WorkPulse.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        assignedTo: { type: 'string', description: 'User ID' },
        dueDate: { type: 'string', description: 'ISO date string' },
      },
    },
  },
  {
    name: 'get_kpi_scores',
    description: 'Get KPI performance scores for the workspace and individual team members.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_team_members',
    description: 'Get all team members in the workspace with their roles.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_deals',
    description: 'Get CRM deals from the pipeline.',
    inputSchema: {
      type: 'object',
      properties: {
        stage: { type: 'string', enum: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
      },
    },
  },
  {
    name: 'get_blocked_tasks',
    description: 'Get all currently blocked tasks with their blocker reasons.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_task_status',
    description: 'Update the status of a task.',
    inputSchema: {
      type: 'object',
      required: ['taskId', 'status'],
      properties: {
        taskId: { type: 'string' },
        status: { type: 'string', enum: ['not_started', 'in_progress', 'review', 'blocked', 'done'] },
        blockerReason: { type: 'string', description: 'Required when status is blocked' },
      },
    },
  },
  {
    name: 'get_goals',
    description: 'Get workspace goals and their current progress.',
    inputSchema: { type: 'object', properties: { status: { type: 'string' } } },
  },
  {
    name: 'generate_performance_summary',
    description: 'Generate an AI-powered performance summary for a team member or the whole workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Optional: specific user ID. Omit for workspace summary.' },
        period: { type: 'string', enum: ['week', 'month', 'quarter'], default: 'month' },
      },
    },
  },
]

async function executeTool(toolName: string, args: any, workspaceId: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  switch (toolName) {
    case 'get_tasks': {
      let q = admin.from('tasks')
        .select('id, title, status, priority, due_date, assigned_to, progress, blocker_reason, assignee:users!tasks_assigned_to_fkey(full_name)')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .limit(args.limit ?? 20)
      if (args.status) q = q.eq('status', args.status)
      if (args.priority) q = q.eq('priority', args.priority)
      if (args.assignedTo) q = q.eq('assigned_to', args.assignedTo)
      const { data } = await q
      return { tasks: data ?? [], count: data?.length ?? 0 }
    }

    case 'create_task': {
      const { data: task, error } = await admin.from('tasks')
        .insert({
          workspace_id: workspaceId,
          title: args.title,
          description: args.description ?? null,
          priority: args.priority ?? 'medium',
          status: 'not_started',
          due_date: args.dueDate ?? null,
          assigned_to: args.assignedTo ?? null,
        })
        .select('id, title, status, priority')
        .single()
      if (error) return { error: error.message }
      return { task, message: `Task "${task?.title}" created successfully` }
    }

    case 'get_kpi_scores': {
      const { data: tasks } = await admin.from('tasks')
        .select('id, status, priority, due_date, completed_at, assigned_to')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      const { data: members } = await admin.from('users')
        .select('id, full_name').eq('workspace_id', workspaceId)

      const all = tasks ?? []
      const done = all.filter(t => t.status === 'done').length
      const workspaceScore = all.length > 0 ? Math.round((done / all.length) * 100) : 0

      return {
        workspace: { overallScore: workspaceScore, total: all.length, done },
        members: (members ?? []).map(m => {
          const memberTasks = all.filter(t => t.assigned_to === m.id)
          const memberDone = memberTasks.filter(t => t.status === 'done').length
          return {
            userId: m.id,
            fullName: m.full_name,
            kpiScore: memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0,
            taskCount: memberTasks.length,
          }
        }).sort((a, b) => b.kpiScore - a.kpiScore),
      }
    }

    case 'get_team_members': {
      const { data } = await admin.from('users')
        .select('id, full_name, email, job_title, is_active, role:roles!users_role_id_fkey(name, level)')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
      return { members: data ?? [], count: data?.length ?? 0 }
    }

    case 'get_deals': {
      let q = admin.from('deals')
        .select('id, title, value, currency, stage, probability, close_date, company:companies(name), contact:contacts(full_name)')
        .eq('workspace_id', workspaceId)
      if (args.stage) q = q.eq('stage', args.stage)
      const { data } = await q
      const pipelineValue = (data ?? []).filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + (d.value ?? 0), 0)
      return { deals: data ?? [], pipelineValue, count: data?.length ?? 0 }
    }

    case 'get_blocked_tasks': {
      const { data } = await admin.from('tasks')
        .select('id, title, blocker_reason, blocker_category, assignee:users!tasks_assigned_to_fkey(full_name)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'blocked')
        .is('deleted_at', null)
      return { blockedTasks: data ?? [], count: data?.length ?? 0 }
    }

    case 'update_task_status': {
      const updates: any = { status: args.status }
      if (args.status === 'done') updates.completed_at = new Date().toISOString()
      if (args.blockerReason) updates.blocker_reason = args.blockerReason
      const { data: task, error } = await admin.from('tasks')
        .update(updates)
        .eq('id', args.taskId)
        .eq('workspace_id', workspaceId)
        .select('id, title, status')
        .single()
      if (error) return { error: error.message }
      return { task, message: `Task status updated to ${args.status}` }
    }

    case 'get_goals': {
      let q = admin.from('goals')
        .select('id, title, target_value, current_value, period, status, due_date, user:users!goals_user_id_fkey(full_name)')
        .eq('workspace_id', workspaceId)
      if (args.status) q = q.eq('status', args.status)
      const { data } = await q
      return { goals: data ?? [], count: data?.length ?? 0 }
    }

    case 'generate_performance_summary': {
      const { data: tasks } = await admin.from('tasks')
        .select('id, status, priority, due_date, completed_at, assigned_to')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      const target = args.userId
      const relevant = target ? (tasks ?? []).filter(t => t.assigned_to === target) : (tasks ?? [])
      const done = relevant.filter(t => t.status === 'done').length
      const total = relevant.length
      const blocked = relevant.filter(t => t.status === 'blocked').length
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

      let userName = 'The team'
      if (target) {
        const { data: u } = await admin.from('users').select('full_name').eq('id', target).single()
        userName = (u as any)?.full_name ?? 'This team member'
      }

      const summary = await callAI(
        `Write a 2-sentence performance summary for ${userName}. Data: ${total} tasks total, ${done} completed (${completionRate}%), ${blocked} blocked. Period: ${args.period ?? 'month'}. Be direct and data-specific.`,
        150
      )

      return { summary, metrics: { total, done, blocked, completionRate, period: args.period ?? 'month' } }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}

// MCP protocol implementation
export async function POST(req: NextRequest) {
  // Validate API key
  const key = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.headers.get('x-api-key') ?? ''
  const auth = await validateApiKey(key)
  if (!auth.valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { method, params, id } = body

  // MCP protocol methods
  if (method === 'initialize') {
    return Response.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'workpulse-mcp', version: '1.0.0' },
      },
    })
  }

  if (method === 'tools/list') {
    return Response.json({
      jsonrpc: '2.0', id,
      result: { tools: TOOLS },
    })
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params
    try {
      const result = await executeTool(name, args ?? {}, auth.workspaceId!)
      return Response.json({
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      })
    } catch (err: any) {
      return Response.json({
        jsonrpc: '2.0', id,
        error: { code: -32000, message: err.message },
      })
    }
  }

  return Response.json({
    jsonrpc: '2.0', id,
    error: { code: -32601, message: `Method not found: ${method}` },
  })
}

// MCP discovery endpoint
export async function GET() {
  return Response.json({
    name: 'WorkPulse MCP Server',
    version: '1.0.0',
    description: 'Connect AI assistants to your WorkPulse workspace',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    endpoints: {
      mcp: '/api/mcp',
      rest: '/api/v1',
    },
    authentication: {
      type: 'bearer',
      description: 'Generate an API key in WorkPulse Settings → Integrations',
    },
  })
}