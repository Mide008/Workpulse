// apps/web/src/app/(app)/settings/profile/profile-settings-client.tsx
'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, User, Mail, Briefcase, Phone, Globe, Save, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Lagos', 'Africa/Nairobi',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
]

export default function ProfileSettingsClient({ user }: { user: any }) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [timezone, setTimezone] = useState(user.timezone ?? 'UTC')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Avatar must be under 3MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('File must be an image'); return }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('workspace-assets').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Avatar updated')
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message ?? 'Unknown error'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Full name is required'); return }
    setSavingProfile(true)

    // Cast the update to any to bypass missing columns
    const { error } = await (supabase
      .from('users') as any)
      .update({
        full_name: fullName.trim(),
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        timezone,
      })
      .eq('id', user.id)

    if (error) { toast.error('Failed to save profile'); setSavingProfile(false); return }
    toast.success('Profile saved')
    setSavingProfile(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast.error(error.message); setSavingPassword(false); return }

    toast.success('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSavingPassword(false)
  }

  const inputClass = `w-full h-11 px-4 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30`
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage your personal information and preferences</p>
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          Profile Photo
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar size="xl">
              {avatarUrl
                ? <AvatarImage src={avatarUrl} alt={fullName} />
                : <AvatarFallback className="text-xl">{getInitials(fullName)}</AvatarFallback>
              }
            </Avatar>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <Camera className="w-4 h-4" />
              {uploadingAvatar ? 'Uploading...' : 'Change photo'}
            </button>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>PNG, JPG or WebP. Max 3MB.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          Personal Information
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full name *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required
                placeholder="Your full name" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input value={user.email} disabled type="email"
                className={inputClass + ' opacity-60 cursor-not-allowed'} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Job title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="Senior Engineer, Product Manager..." className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                placeholder="+234 801 234 5678" className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="A short description about yourself..."
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className={inputClass} style={inputStyle}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <button type="submit" disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--primary)' }}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          Change Password
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New password</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password"
              placeholder="Minimum 8 characters" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm new password</label>
            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password"
              placeholder="Repeat password" className={inputClass} style={inputStyle} />
          </div>
          <button type="submit" disabled={savingPassword || !newPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--primary)' }}>
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}