// apps/web/src/app/(app)/attendance/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, Loader2, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function AttendancePage() {
  const [log, setLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/attendance')
      .then(res => res.json())
      .then(data => { setLog(data.log); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleAction(action: 'clock_in' | 'clock_out') {
    setBusy(true)
    
    let coords = { latitude: null, longitude: null }

    if (action === 'clock_in') {
      try {
        // Ask browser for GPS location
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        coords.latitude = pos.coords.latitude
        coords.longitude = pos.coords.longitude
      } catch (err) {
        toast.error('Location access denied. Please enable GPS to clock in.')
        setBusy(false)
        return
      }
    }

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...coords }),
    })
    const json = await res.json()
    setBusy(false)

    if (!res.ok) {
      toast.error(json.error || 'Something went wrong')
      return
    }
    setLog(json.log)
    toast.success(action === 'clock_in' ? 'Clocked in successfully!' : 'Clocked out successfully!')
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-indigo-500" /></div>

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Attendance</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </div>

      <div className="p-6 rounded-xl border mb-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        {!log ? (
          <p className="text-center text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>You have not clocked in yet today.</p>
        ) : (
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Clock In:</span>
              <span className="font-bold text-emerald-400">{format(new Date(log.clock_in), 'h:mm a')}</span>
            </div>
            {log.latitude && log.longitude && (
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                <a 
                  href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:underline font-medium"
                >
                  <MapPin className="w-3 h-3" /> View on Map
                </a>
              </div>
            )}
            <div className="flex justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Clock Out:</span>
              <span className="font-bold text-indigo-400">{log.clock_out ? format(new Date(log.clock_out), 'h:mm a') : '—'}</span>
            </div>
          </div>
        )}

        {!log ? (
          <button onClick={() => handleAction('clock_in')} disabled={busy} className="w-full h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: '#10B981' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Clock In (Requires GPS)
          </button>
        ) : !log.clock_out ? (
          <button onClick={() => handleAction('clock_out')} disabled={busy} className="w-full h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: '#EF4444' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Clock Out
          </button>
        ) : (
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">
            Day Complete
          </div>
        )}
      </div>
    </div>
  )
}