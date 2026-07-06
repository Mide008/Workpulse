// apps/web/src/lib/team-report.ts
import jsPDF from 'jspdf'

export interface MemberReport {
  id: string
  full_name: string
  job_title?: string
  taskCount: number
  kpi: {
    overallScore: number
    completionRate: number
    onTimeRate: number
    priorityScore: number
    activityScore: number
  }
  aiSummary?: string
}

function grade(score: number): { label: string; grade: string; r: number; g: number; b: number } {
  if (score >= 90) return { label: 'Excellent', grade: 'A', r: 16, g: 185, b: 129 }
  if (score >= 80) return { label: 'Good', grade: 'B', r: 59, g: 130, b: 246 }
  if (score >= 65) return { label: 'Fair', grade: 'C', r: 245, g: 158, b: 11 }
  return { label: 'Needs Work', grade: 'D', r: 239, g: 68, b: 68 }
}

export async function generateTeamPDF({
  members,
  workspaceName,
  period,
  overallKPI,
}: {
  members: MemberReport[]
  workspaceName: string
  period: string
  overallKPI: { overallScore: number; completionRate: number; onTimeRate: number; priorityScore: number; activityScore: number }
}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const margin = 18
  const contentWidth = W - margin * 2
  let y = 0

  function addPage() {
    pdf.addPage()
    y = margin
    // Page header
    pdf.setFillColor(15, 23, 42)
    pdf.rect(0, 0, W, 10, 'F')
    pdf.setTextColor(99, 102, 241)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.text('WORKPULSE', margin, 6.5)
    pdf.setTextColor(100, 116, 139)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${workspaceName} — Team Performance Report`, W / 2, 6.5, { align: 'center' })
    pdf.text(`${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - margin, 6.5, { align: 'right' })
    y = margin
  }

  // ── Cover page ──────────────────────────────────────────────────────────────
  pdf.setFillColor(9, 11, 19)
  pdf.rect(0, 0, W, H, 'F')

  // Accent bar
  pdf.setFillColor(99, 102, 241)
  pdf.rect(0, 0, 5, H, 'F')

  // Logo area
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(99, 102, 241)
  pdf.text('WORKPULSE', margin + 5, 20)

  // Title
  y = 70
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(248, 250, 252)
  pdf.text('Team Performance', margin + 5, y)
  y += 12
  pdf.text('Report', margin + 5, y)

  y += 12
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 116, 139)
  pdf.text(workspaceName, margin + 5, y)

  y += 8
  pdf.setFontSize(10)
  pdf.setTextColor(71, 85, 105)
  pdf.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)} · ${members.length} team member${members.length !== 1 ? 's' : ''}`, margin + 5, y)

  // Overall KPI box on cover
  y += 30
  const overallGrade = grade(overallKPI.overallScore)
  pdf.setFillColor(30, 41, 59)
  pdf.roundedRect(margin + 5, y, contentWidth - 5, 60, 4, 4, 'F')
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(148, 163, 184)
  pdf.text('Overall Workspace KPI Score', margin + 14, y + 12)
  pdf.setFontSize(40)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(overallGrade.r, overallGrade.g, overallGrade.b)
  pdf.text(`${overallKPI.overallScore}`, margin + 14, y + 32)
  pdf.setFontSize(14)
  pdf.setTextColor(overallGrade.r, overallGrade.g, overallGrade.b)
  pdf.text(`Grade ${overallGrade.grade} — ${overallGrade.label}`, margin + 14, y + 44)

  const metrics = [
    { label: 'Completion', value: overallKPI.completionRate },
    { label: 'On-time', value: overallKPI.onTimeRate },
    { label: 'Priority', value: overallKPI.priorityScore },
    { label: 'Activity', value: overallKPI.activityScore },
  ]

  const metricX = margin + 100
  metrics.forEach((m, i) => {
    const mx = metricX + (i % 2) * 40
    const my = y + 12 + Math.floor(i / 2) * 22
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(248, 250, 252)
    pdf.text(`${m.value}%`, mx, my)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(m.label, mx, my + 6)
  })

  // Generated date at bottom of cover
  pdf.setFontSize(8)
  pdf.setTextColor(51, 65, 85)
  pdf.text(`Generated ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 5, H - 20)
  pdf.text('Confidential — WorkPulse Team OS', margin + 5, H - 14)

  // ── Team overview page ────────────────────────────────────────────────────────
  addPage()
  y = margin + 5

  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdf.text('Team Overview', margin, y)
  y += 12

  // Ranked member list
  const sortedMembers = [...members].sort((a, b) => b.kpi.overallScore - a.kpi.overallScore)

  sortedMembers.forEach((member, i) => {
    if (y > H - 50) { addPage() }

    const g = grade(member.kpi.overallScore)
    const rowY = y
    const rowH = 28

    // Row background
    pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255)
    pdf.rect(margin, rowY, contentWidth, rowH, 'F')

    // Rank
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 116, 139)
    pdf.text(`#${i + 1}`, margin + 3, rowY + 10)

    // Name + role
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.text(member.full_name, margin + 16, rowY + 10)
    if (member.job_title) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      pdf.text(member.job_title, margin + 16, rowY + 17)
    }

    // Tasks
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(71, 85, 105)
    pdf.text(`${member.taskCount} tasks`, margin + 90, rowY + 10)

    // Progress bar
    const barX = margin + 115
    const barY = rowY + 7
    const barW = 55
    const barH2 = 4
    pdf.setFillColor(226, 232, 240)
    pdf.roundedRect(barX, barY, barW, barH2, 1, 1, 'F')
    pdf.setFillColor(g.r, g.g, g.b)
    pdf.roundedRect(barX, barY, barW * (member.kpi.overallScore / 100), barH2, 1, 1, 'F')

    // Score
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(g.r, g.g, g.b)
    pdf.text(`${member.kpi.overallScore}%`, barX + barW + 5, rowY + 11)

    // Grade
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Grade ${g.grade}`, barX + barW + 5, rowY + 19)

    y += rowH + 2
  })

  // ── Individual member pages ───────────────────────────────────────────────────
  sortedMembers.forEach(member => {
    addPage()
    const g = grade(member.kpi.overallScore)

    // Member name header
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.text(member.full_name, margin, y + 5)
    y += 12

    if (member.job_title) {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      pdf.text(member.job_title, margin, y)
      y += 8
    }

    y += 4

    // Score box
    pdf.setFillColor(g.r, g.g, g.b)
    pdf.rect(margin, y, 5, 48, 'F')
    pdf.setFillColor(248, 250, 252)
    pdf.roundedRect(margin + 8, y, contentWidth - 8, 48, 3, 3, 'F')
    pdf.setFontSize(32)
    pdf.setFont('helvetica', 'black')
    pdf.setTextColor(g.r, g.g, g.b)
    pdf.text(`${member.kpi.overallScore}`, margin + 18, y + 22)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Grade ${g.grade} — ${g.label}`, margin + 18, y + 34)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(`${member.taskCount} tasks tracked this ${period}`, margin + 18, y + 42)
    y += 58

    // KPI breakdown
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.text('KPI Breakdown', margin, y)
    y += 8

    const breakdown = [
      { label: 'Completion rate', value: member.kpi.completionRate, weight: '35%' },
      { label: 'On-time delivery', value: member.kpi.onTimeRate, weight: '30%' },
      { label: 'Priority handling', value: member.kpi.priorityScore, weight: '20%' },
      { label: 'Activity score', value: member.kpi.activityScore, weight: '15%' },
    ]

    breakdown.forEach(metric => {
      const mg = grade(metric.value)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(71, 85, 105)
      pdf.text(metric.label, margin, y + 4)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`(weight: ${metric.weight})`, margin + 55, y + 4)

      // Bar
      const bX = margin + 95
      const bY = y
      const bW = 65
      pdf.setFillColor(226, 232, 240)
      pdf.roundedRect(bX, bY, bW, 5, 1.5, 1.5, 'F')
      pdf.setFillColor(mg.r, mg.g, mg.b)
      pdf.roundedRect(bX, bY, bW * (metric.value / 100), 5, 1.5, 1.5, 'F')

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(mg.r, mg.g, mg.b)
      pdf.text(`${metric.value}%`, bX + bW + 5, y + 4.5)

      y += 12
    })

    // AI narrative if present
    if (member.aiSummary) {
      y += 4
      pdf.setFillColor(238, 242, 255)
      pdf.roundedRect(margin, y, contentWidth, 1, 0, 0, 'F')
      y += 6

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text('Performance Narrative', margin, y)
      y += 8

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(51, 65, 85)

      const lines = pdf.splitTextToSize(member.aiSummary, contentWidth)
      lines.forEach((line: string) => {
        if (y > H - 25) { addPage() }
        pdf.text(line, margin, y)
        y += 5.5
      })
    }
  })

  // ── Footer on last page ──────────────────────────────────────────────────────
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, H - 10, W, 10, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(51, 65, 85)
  pdf.text('Confidential — WorkPulse Performance Report · Generated by WorkPulse Team OS', W / 2, H - 4, { align: 'center' })

  const filename = `workpulse-team-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}