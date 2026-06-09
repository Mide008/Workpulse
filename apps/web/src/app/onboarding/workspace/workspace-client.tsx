'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const INDUSTRIES = [
  'Real Estate', 'Healthcare', 'Construction', 'Legal & Finance',
  'Education', 'Logistics', 'Technology', 'Retail', 'Hospitality', 'Other',
]

const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

const schema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  industry: z.string().min(1, 'Select your industry'),
  size: z.string().min(1, 'Select your team size'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid colour'),
})

type FormData = z.infer<typeof schema>

export default function OnboardingWorkspaceClient() {
  const router = useRouter()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { primaryColor: '#6366F1' },
  })

  const primaryColor = watch('primaryColor')

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Session expired. Please sign in again.')
      router.push('/login')
      return
    }

    try {
      const slug =
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 6)

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: data.name,
          slug,
          industry: data.industry,
          size: data.size,
          primary_color: data.primaryColor,
        })
        .select('id')
        .single()

      if (wsError || !workspace) throw wsError

      const workspaceId = (workspace as { id: string }).id

      let logoUrl: string | null = null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `${workspaceId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('workspace-assets')
          .upload(path, logoFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('workspace-assets')
            .getPublicUrl(path)
          logoUrl = urlData.publicUrl

          await supabase
            .from('workspaces')
            .update({ logo_url: logoUrl })
            .eq('id', workspaceId)
        }
      }

      const defaultRoles = [
        { name: 'Executive', level: 1, color: '#7C3AED', is_default: true,
          permissions: { viewAllDepartments: true, viewAllKPIs: true, manageWorkspace: true } },
        { name: 'Manager', level: 2, color: '#2563EB', is_default: true,
          permissions: { viewTeamKPIs: true, setGoals: true, exportReports: true } },
        { name: 'Team Lead', level: 3, color: '#059669', is_default: true,
          permissions: { viewTeamTasks: true, assignTasks: true } },
        { name: 'Staff', level: 4, color: '#D97706', is_default: true,
          permissions: { logTasks: true, updateOwnTasks: true } },
      ]

      const { data: roles } = await supabase
        .from('roles')
        .insert(defaultRoles.map((r) => ({ ...r, workspace_id: workspaceId })))
        .select('id, level')

      const staffRole = (roles as { id: string; level: number }[] | null)?.find(
        (r) => r.level === 1
      )

      await supabase.from('users').upsert({
        id: user.id,
        workspace_id: workspaceId,
        role_id: staffRole?.id ?? null,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
      })

      toast.success('Workspace created')
      router.push('/onboarding/structure')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create workspace. Please try again.')
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set up your workspace</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          This is your team&apos;s home in WorkPulse. You can change everything later.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Workspace logo <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--border)]20
                flex items-center justify-center overflow-hidden bg-white/5"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-[var(--text-muted)]" />
              )}
            </div>
            <label className="cursor-pointer">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg border
                  border-[var(--border)]10 text-slate-300 hover:border-[var(--border)]30 hover:text-[var(--text-primary)]
                  transition text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload logo
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
          </div>
        </div>

        {/* Workspace name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Workspace name <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Acme Corporation"
            className="w-full bg-white/5 border border-[var(--border)]10 rounded-xl px-4 py-3
              text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2
              focus:ring-indigo-500 transition"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Industry <span className="text-red-400">*</span>
          </label>
          <select
            {...register('industry')}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)]10 rounded-xl px-4 py-3
              text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Select your industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-red-400 text-sm mt-1">{errors.industry.message}</p>
          )}
        </div>

        {/* Team size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Team size <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  {...register('size')}
                  type="radio"
                  value={size}
                  className="sr-only peer"
                />
                <div
                  className="text-center py-2.5 rounded-xl border border-[var(--border)]10
                    text-[var(--text-secondary)] text-sm font-medium transition cursor-pointer
                    peer-checked:border-indigo-500 peer-checked:text-[var(--text-primary)]
                    peer-checked:bg-indigo-500/10 hover:border-[var(--border)]30"
                >
                  {size}
                </div>
              </label>
            ))}
          </div>
          {errors.size && <p className="text-red-400 text-sm mt-1">{errors.size.message}</p>}
        </div>

        {/* Brand colour */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Brand colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              {...register('primaryColor')}
              className="w-12 h-12 rounded-xl border border-[var(--border)]10 bg-transparent
                cursor-pointer p-1"
            />
            <div className="flex gap-2">
              {['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(
                (colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => {}}
                    style={{ backgroundColor: colour }}
                    className="w-8 h-8 rounded-lg border-2 border-transparent
                      hover:border-white transition"
                  />
                )
              )}
            </div>
            <span className="text-[var(--text-secondary)] text-sm font-mono">{primaryColor}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-[var(--text-primary)] font-semibold py-3 rounded-xl transition
            flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Creating workspace...' : 'Continue'}
        </button>
      </form>
    </>
  )
}