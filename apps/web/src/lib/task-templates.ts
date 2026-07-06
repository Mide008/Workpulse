// apps/web/src/lib/task-templates.ts

export interface TaskTemplate {
  id: string
  name: string
  description: string
  category: string
  defaults: {
    title: string
    description: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    estimatedHours?: number
    category?: string
    tags?: string[]
  }
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Report a software defect or unexpected behaviour',
    category: 'Engineering',
    defaults: {
      title: 'Bug: ',
      description: `**What happened:**\n\n**Expected behaviour:**\n\n**Steps to reproduce:**\n1. \n\n**Environment:** \n\n**Priority justification:**`,
      priority: 'high',
      estimatedHours: 4,
      category: 'Bug Fix',
      tags: ['bug'],
    },
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    description: 'Document a new product feature to be built',
    category: 'Product',
    defaults: {
      title: 'Feature: ',
      description: `**Problem this solves:**\n\n**Proposed solution:**\n\n**Acceptance criteria:**\n- [ ] \n\n**Out of scope:**`,
      priority: 'medium',
      estimatedHours: 8,
      category: 'Feature',
      tags: ['feature'],
    },
  },
  {
    id: 'design-review',
    name: 'Design Review',
    description: 'Schedule and document a design review session',
    category: 'Design',
    defaults: {
      title: 'Design Review: ',
      description: `**What is being reviewed:**\n\n**Design link:**\n\n**Reviewers required:**\n\n**Review criteria:**\n- [ ] Accessibility\n- [ ] Brand alignment\n- [ ] Mobile responsiveness\n- [ ] User flow clarity`,
      priority: 'medium',
      estimatedHours: 2,
      category: 'Design',
      tags: ['design', 'review'],
    },
  },
  {
    id: 'client-deliverable',
    name: 'Client Deliverable',
    description: 'Track a deliverable going to a client',
    category: 'Client Work',
    defaults: {
      title: 'Deliverable: ',
      description: `**Client:**\n\n**Deliverable description:**\n\n**Deadline:**\n\n**Approval required from:**\n\n**Format:**`,
      priority: 'high',
      estimatedHours: 6,
      category: 'Client',
      tags: ['client', 'deliverable'],
    },
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    description: 'Compile and submit weekly progress report',
    category: 'Operations',
    defaults: {
      title: 'Weekly Report — Week of ',
      description: `**Completed this week:**\n- \n\n**In progress:**\n- \n\n**Blocked:**\n- \n\n**Planned for next week:**\n- \n\n**Key metrics:**`,
      priority: 'medium',
      estimatedHours: 1,
      category: 'Reporting',
      tags: ['report', 'weekly'],
    },
  },
  {
    id: 'research-task',
    name: 'Research',
    description: 'Document a research task with structured output',
    category: 'Strategy',
    defaults: {
      title: 'Research: ',
      description: `**Research question:**\n\n**Why this matters:**\n\n**Methods:**\n- [ ] \n\n**Expected output:**\n\n**Deadline for findings:**`,
      priority: 'medium',
      estimatedHours: 4,
      category: 'Research',
      tags: ['research'],
    },
  },
]