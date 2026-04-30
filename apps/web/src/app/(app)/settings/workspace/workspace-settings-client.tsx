'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Building2, Upload, Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const BRAND_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
]

export default function WorkspaceSettingsClient({ workspace, roles, currentUser }: {
  workspace: any; roles: any[]; currentUser: any
}) {
  const [saving, setSaving] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(workspace?.primary_color ?? '#6366F1')
  const [logoPreview, setLogoPreview] = useState<string | null>(workspace?.logo_url ?? null)
  const supabase = createClient()

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: workspace?.name ?? '',
      industry: workspace?.industry ?? '',
    },
  })

  async function onSubmit(data: any) {
    setSaving(true)
    const { error } = await supabase
      .from('workspaces')
      .update({ name: data.name, industry: data.industry, primary_color: primaryColor })
      .eq('id', workspace.id)

    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Workspace updated')
    setSaving(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }

    const ext = file.name.split('.').pop()
    const path = `${workspace.id}/logo.${ext}`
    const { error } = await supabase.storage.from('workspace-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); return }

    const { data } = supabase.storage.from('workspace-assets').getPublicUrl(path)
    setLogoPreview(data.publicUrl)
    await supabase.from('workspaces').update({ logo_url: data.publicUrl }).eq('id', workspace.id)
    toast.success('Logo updated')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Workspace Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your workspace appearance and details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Workspace identity
          </h3>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden
              bg-white/5 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: primaryColor }}>
                  {workspace?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10
                text-slate-300 hover:border-white/30 hover:text-white transition text-sm">
                <Upload className="w-4 h-4" />
                Upload logo
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Workspace name</label>
              <input {...register('name', { required: true })}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  hover:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Industry</label>
              <input {...register('industry')}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5
                  text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  hover:border-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Brand colour */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-400" />
            Brand colour
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            {BRAND_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setPrimaryColor(c)}
                className="relative w-10 h-10 rounded-xl transition-transform hover:scale-110"
                style={{ backgroundColor: c }}>
                {primaryColor === c && <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0.5" />
              <span className="text-sm font-mono text-slate-400">{primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Roles (read-only display) */}
        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Roles & permissions</h3>
          <div className="space-y-2">
            {roles.map(role => (
              <div key={role.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                <span className="text-sm font-medium text-white">{role.name}</span>
                <span className="text-xs text-slate-500 ml-auto">Level {role.level}</span>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" loading={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}