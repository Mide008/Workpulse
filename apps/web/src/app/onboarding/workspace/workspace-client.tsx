// apps/web/src/app/onboarding/workspace/workspace-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Building2, Check, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const INDUSTRIES = [
  'Technology', 'Real Estate', 'Healthcare', 'Construction',
  'Legal & Finance', 'Education', 'Logistics', 'Retail', 'Hospitality', 'Other',
]

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6']

const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

export default function OnboardingWorkspaceClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [color, setColor] = useState('#6366F1')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/signup')
      else setCheckingAuth(false)
    })
  }, [])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Workspace name is required'); return }
    if (!industry) { toast.error('Select your industry'); return }
    if (!size) { toast.error('Select your team size'); return }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Session expired. Please sign in.'); router.replace('/login'); return }

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name: name.trim(), slug, industry, size, primary_color: color, plan: 'free' })
        .select('id')
        .single()

      if (wsError || !workspace) throw wsError

      const wid = (workspace as any).id

      // Upload logo if provided
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `${wid}/logo-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('workspace-logos')
          .upload(path, logoFile, { upsert: true })
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('workspace-logos').getPublicUrl(path)
          await supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', wid)
        }
      }

      const defaultRoles = [
        { name: 'Executive', level: 1, color: '#7C3AED', is_default: true, permissions: { viewAllKPIs: true, manageWorkspace: true, viewCRM: true } },
        { name: 'Manager', level: 2, color: '#2563EB', is_default: true, permissions: { viewTeamKPIs: true, setGoals: true, exportReports: true, viewCRM: true } },
        { name: 'Team Lead', level: 3, color: '#059669', is_default: true, permissions: { viewTeamTasks: true, assignTasks: true } },
        { name: 'Staff', level: 4, color: '#D97706', is_default: true, permissions: { logTasks: true, updateOwnTasks: true } },
      ]

      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .insert(defaultRoles.map(r => ({ ...r, workspace_id: wid })))
        .select('id, level')

      if (rolesError) throw rolesError

      const execRole = (roles as any[]).find(r => r.level === 1)

      const { error: userError } = await supabase.from('users').upsert({
        id: user.id,
        workspace_id: wid,
        role_id: execRole?.id ?? null,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
        is_active: true,
      })

      if (userError) throw userError

      toast.success('Workspace created')
      router.push('/onboarding/structure')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to create workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Set up your workspace</h1>
        <p className="text-slate-300 mt-1.5">Your team's home in WorkPulse. You can update everything later.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Workspace logo <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                : <Building2 className="w-5 h-5 text-slate-500" />
              }
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-white transition text-sm">
                <Upload className="w-4 h-4" />
                Upload logo
              </div>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Workspace name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Acme Corporation"
            autoFocus
            className="w-full h-11 px-4 rounded-xl border text-sm transition-all
              bg-white/5 border-white/10 text-white placeholder:text-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60
              hover:border-white/20"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Industry <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                  ${industry === ind
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
              >
                <span className="truncate">{ind}</span>
                {industry === ind && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Team size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Team size <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all
                  ${size === s
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Brand color */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Brand colour</label>
          <div className="flex items-center gap-3 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="relative w-9 h-9 rounded-xl transition-transform hover:scale-110 border-2"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'white' : 'transparent',
                }}
              >
                {color === c && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-9 h-9 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent p-0.5"
              />
              <span className="text-slate-500 text-xs font-mono">{color}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white
            flex items-center justify-center gap-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 active:scale-[0.98]"
          style={{ background: color }}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating workspace...</>
            : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </motion.div>
  )
}