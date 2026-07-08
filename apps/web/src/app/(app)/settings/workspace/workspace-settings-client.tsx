/* apps/web/src/app/(app)/settings/workspace/workspace-settings-client.tsx */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Check, Mail, Users, Copy, Loader2, RefreshCw, Upload, Trash2, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion'
import { validateEmailFormat } from '@/lib/email-validation'

const COLORS = ['#6366F1','#8B5CF6','#EC4899','#10B981','#F59E0B','#EF4444','#06B6D4','#3B82F6']
const INDUSTRIES = ['Technology','Real Estate','Healthcare','Construction','Legal & Finance','Education','Logistics','Retail','Hospitality','Other']

export default function WorkspaceSettingsClient({ workspace: initial, user }: { workspace: any; user: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [industry, setIndustry] = useState(initial?.industry ?? 'Technology')
  const [color, setColor] = useState(initial?.primary_color ?? '#6366F1')
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Staff')
  const [inviting, setInviting] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    setLoadingInvites(true)
    try {
      const res = await fetch('/api/invitations')
      if (res.ok) {
        const { invitations: inv } = await res.json()
        setInvitations(inv ?? [])
      }
    } catch {
      // Handled by block
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  useEffect(() => { fetchInvitations() }, [fetchInvitations])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }

    setUploadingLogo(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        toast.error('Not authenticated')
        return
      }

      const ext = file.name.split('.').pop()
      const path = `${initial.id}/logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-logos')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('workspace-logos')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ logo_url: publicUrl })
        .eq('id', initial.id)

      if (updateError) {
        toast.error('Failed to save logo')
        return
      }

      setLogoUrl(publicUrl)
      toast.success('Logo updated')
      router.refresh()
      window.location.reload()
    } catch {
      toast.error('Failed to preserve uploaded brand asset')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('workspaces')
      .update({ name: name.trim(), industry, primary_color: color })
      .eq('id', initial.id)
    if (error) {
      toast.error('Failed to save changes')
    } else {
      toast.success('Workspace updated')
      // Apply brand colour immediately
      document.documentElement.style.setProperty('--primary', color)
      try { localStorage.setItem('wp-primary-color', color) } catch {}
      router.refresh()
    }
    setSaving(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) { toast.error('Please enter an email address'); return }

    // Client‑side format validation
    const formatCheck = validateEmailFormat(email)
    if (!formatCheck.valid) {
      toast.error(formatCheck.error ?? 'Invalid email address')
      return
    }

    // Check for existing pending invitation
    const existing = invitations.find(
      (inv: any) => inv.email.toLowerCase() === email.toLowerCase()
    )
    if (existing) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const url = `${appUrl}/invite?token=${existing.token}`
      setLastInviteUrl(url)
      await navigator.clipboard.writeText(url).catch(() => {})
      toast.info(`${email} was already invited. The link has been copied — share it directly.`)
      return
    }

    setInviting(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setLastInviteUrl(data.inviteUrl)
        // Always copy the link — email delivery is best‑effort only
        if (data.inviteUrl) {
          await navigator.clipboard.writeText(data.inviteUrl).catch(() => {})
        }
        if (data.emailSent) {
          toast.success(`Invitation sent to ${email}. Link also copied to clipboard as backup.`)
        } else {
          toast.success(`Invite link created and copied to clipboard. Share it directly with ${email}.`)
        }
        setInviteEmail('')
        await fetchInvitations()
      } else {
        toast.error(data.error ?? 'Failed to send invitation')
      }
    } catch {
      toast.error('Network error. Try again.')
    }
    setInviting(false)
  }

  async function copyInviteLink(token: string, id: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const url = `${appUrl}/invite?token=${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Invite link copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function deleteInvitation(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/invitations?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setInvitations(prev => prev.filter((inv: any) => inv.id !== id))
        toast.success('Invitation removed')
      } else {
        toast.error('Failed to remove invitation')
      }
    } catch {
      toast.error('Network error removing invitation')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <TooltipProvider>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Workspace Settings</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">Manage your workspace details and team</p>
        </motion.div>

        {/* Workspace Branding & Logo Configuration Block */}
        <motion.div variants={staggerItem} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
            Workspace Identity Logo
          </h2>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-hidden flex items-center justify-center relative shadow-inner">
              {logoUrl ? (
                <img src={logoUrl} alt="Workspace Identity" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-[var(--text-muted)]" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                </div>
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-[var(--border-strong)] rounded-xl text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer shadow-sm transition">
                <Upload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                Upload brand logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
              </label>
              <p className="text-[var(--text-muted)] text-[11px] mt-2">Square PNG or JPG file dimensions up to 2MB recommended.</p>
            </div>
          </div>
        </motion.div>

        {/* Workspace Core Metadata Form Details */}
        <motion.div variants={staggerItem} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
            Workspace Details
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Workspace name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 text-sm transition" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Industry</label>
              <select 
                value={industry} 
                onChange={e => setIndustry(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 text-sm"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Brand colour</label>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Preset swatches */}
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <Tooltip key={c}>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          onClick={() => setColor(c)}
                          className="relative w-8 h-8 rounded-xl transition-transform hover:scale-110 shadow-sm border border-black/5"
                          style={{ backgroundColor: c }}
                        >
                          {color === c && <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto filter drop-shadow-sm" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{c}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {/* Full native color picker */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-[var(--border)] bg-transparent p-0 overflow-hidden"
                    style={{ background: color }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">or pick any colour</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Invite team members panel */}
        <motion.div variants={staggerItem} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-secondary)]" />
              Invite Team Members
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={fetchInvitations}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition rounded-lg hover:bg-[var(--bg-elevated)]"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingInvites && 'animate-spin')} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh invitations</TooltipContent>
            </Tooltip>
          </div>

          <form onSubmit={handleInvite} className="flex gap-2 mb-5 flex-wrap">
            <input 
              type="email" 
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com" 
              required
              className="flex-1 min-w-52 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition" 
            />
            <select 
              value={inviteRole} 
              onChange={e => setInviteRole(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            >
              {['Executive','Manager','Team Lead','Staff'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm" 
              loading={inviting}
              icon={<Mail className="w-4 h-4" />}
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </Button>
          </form>

          {lastInviteUrl && (
            <div className="mb-4 p-4 rounded-xl border"
              style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
              <p className="text-xs font-semibold text-indigo-500 mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Share this invite link directly
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs p-2 rounded-lg truncate"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {lastInviteUrl}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastInviteUrl)
                    toast.success('Copied!')
                  }}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition">
                  Copy
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Send this link to your team member. Valid for 7 days.
              </p>
            </div>
          )}

          {loadingInvites ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm py-2">No invitations sent yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-3">
                Sent invitations ({invitations.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {invitations.map((inv: any) => (
                  <div 
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{inv.email}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {inv.role} · {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inv.status === 'pending' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => copyInviteLink(inv.token, inv.id)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] opacity-0 group-hover:opacity-100"
                            >
                              {copiedId === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copy invite link</TooltipContent>
                        </Tooltip>
                      )}
                      <button 
                        onClick={() => deleteInvitation(inv.id)}
                        disabled={deletingId === inv.id}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingId === inv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-semibold border',
                        inv.status === 'accepted' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
                        inv.status === 'pending' && 'bg-amber-500/10 text-amber-700 border-amber-500/20',
                        inv.status === 'expired' && 'bg-red-500/10 text-red-700 border-red-500/20',
                      )}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </TooltipProvider>
  )
}