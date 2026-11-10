import { ImageResponse } from 'next/og'

export const alt = 'WorkPulse — the team OS for tasks, work logs, approvals, KPIs and CRM'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80,
        background: 'linear-gradient(135deg,#020617 0%,#0b1130 55%,#2a1f7a 100%)', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 900 }}>W</div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>WorkPulse</div>
        </div>
        <div style={{ fontSize: 78, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>The operating system for teams that deliver.</div>
        <div style={{ fontSize: 30, marginTop: 36, color: '#CBD5E1' }}>Tasks · Work logs · Approvals · KPIs · CRM — free for your first 5 members</div>
      </div>
    ),
    size
  )
}
