'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { MapPin, Clock, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageAttendancePage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attendance/manage')
      .then(res => res.json())
      .then(data => {
        if (data.error) toast.error(data.error)
        else setLogs(data.logs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Attendance</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Today, {format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-white/5 rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-primary)] font-bold">No one has clocked in yet</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Staff attendance will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Staff</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Clock In</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Clock Out</th>
                <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{log.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{log.user?.job_title}</p>
                  </td>
                  <td className="p-4 text-sm text-emerald-400 font-medium">
                    {format(new Date(log.clock_in), 'h:mm a')}
                  </td>
                  <td className="p-4 text-sm text-indigo-400 font-medium">
                    {log.clock_out ? format(new Date(log.clock_out), 'h:mm a') : '—'}
                  </td>
                  <td className="p-4">
                    {log.latitude && log.longitude ? (
                      <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:underline">
                        <MapPin className="w-3 h-3" /> View Location
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No GPS Data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}