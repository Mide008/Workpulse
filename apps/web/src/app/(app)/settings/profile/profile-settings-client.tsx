'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { User, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default function ProfileSettingsClient({ currentUser }: { currentUser: any }) {
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser.avatarUrl)
  const supabase = createClient()

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      fullName: currentUser.fullName,
      jobTitle: currentUser.jobTitle ?? '',
      phone: '',
      bio: '',
    },
  })

  async function onSubmit(data: any) {
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ full_name: data.fullName, job_title: data.jobTitle })
      .eq('id', currentUser.id)

    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Profile updated')
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    const ext = file.name.split('.').pop()
    const path = `avatars/${currentUser.id}.${ext}`
    const { error } = await supabase.storage.from('workspace-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); return }

    const { data } = supabase.storage.from('workspace-assets').getPublicUrl(path)
    setAvatarPreview(data.publicUrl)
    await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', currentUser.id)
    toast.success('Avatar updated')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Personal information
          </h3>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar size="xl">
              {avatarPreview
                ? <AvatarImage src={avatarPreview} alt={currentUser.fullName} />
                : <AvatarFallback>{getInitials(currentUser.fullName)}</AvatarFallback>
              }
            </Avatar>
            <div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10
                  text-slate-300 hover:border-white/30 hover:text-white transition text-sm">
                  <Upload className="w-4 h-4" />
                  Change photo
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              <p className="text-xs text-slate-600 mt-1.5">JPG, PNG or GIF · Max 2MB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Full name</label>
              <input {...register('fullName', { required: true })}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  hover:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Job title</label>
              <input {...register('jobTitle')}
                placeholder="e.g. Senior Developer"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white placeholder:text-slate-600 focus:outline-none
                  focus:ring-2 focus:ring-indigo-500/50 hover:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Email</label>
              <input value={currentUser.email} disabled
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5
                  text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed here</p>
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" loading={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}