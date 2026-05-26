'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Building2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const INDUSTRIES = [
  'Real Estate', 'Healthcare', 'Construction', 'Legal & Finance',
  'Education', 'Logistics', 'Technology', 'Retail', 'Hospitality', 'Other',
]

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6']

export default function OnboardingWorkspaceClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('Technology')
  const [primaryColor, setPrimaryColor] = useState('#6366F1')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/signup')
      } else {
        setCheckingAuth(false)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter a workspace name'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Session expired. Please sign in.'); router.replace('/login'); return }

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name: name.trim(), slug, industry, primary_color: primaryColor, plan: 'free' })
        .select('id')
        .single()

      if (wsError || !workspace) {
        console.error('workspace error:', wsError)
        toast.error('Failed to create workspace: ' + (wsError?.message ?? 'Unknown error'))
        setLoading(false)
        return
      }

      const wid = (workspace as any).id

      const defaultRoles = [
        { name: 'Executive', level: 1, color: '#7C3AED', is_default: true, permissions: { viewAllKPIs: true } },
        { name: 'Manager', level: 2, color: '#2563EB', is_default: true, permissions: { viewTeamKPIs: true } },
        { name: 'Team Lead', level: 3, color: '#059669', is_default: true, permissions: { viewTeamTasks: true } },
        { name: 'Staff', level: 4, color: '#D97706', is_default: true, permissions: { logTasks: true } },
      ]

      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .insert(defaultRoles.map(r => ({ ...r, workspace_id: wid })))
        .select('id, level')

      if (rolesError) {
        console.error('roles error:', rolesError)
        toast.error('Failed to create roles: ' + rolesError.message)
        setLoading(false)
        return
      }

      const execRole = (roles as any[]).find(r => r.level === 1)

      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          workspace_id: wid,
          role_id: execRole?.id ?? null,
          full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
          email: user.email ?? '',
          is_active: true,
        })

      if (userError) {
        console.error('user error:', userError)
        toast.error('Failed to set up profile: ' + userError.message)
        setLoading(false)
        return
      }

      toast.success('Workspace created!')
      router.push('/onboarding/invite')
    } catch (err: any) {
      console.error('unexpected error:', err)
      toast.error('Something went wrong: ' + (err?.message ?? 'Unknown error'))
      setLoading(false)
    }
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Set up your workspace</h1>
        <p className="text-slate-400 mt-1">This is your team's home in WorkPulse. You can change everything later.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Workspace name <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Acme Corporation"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
              text-white placeholder:text-slate-500 focus:outline-none focus:ring-2
              focus:ring-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Industry</label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3
              text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Brand colour</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPrimaryColor(c)}
                className="relative w-9 h-9 rounded-xl transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              >
                {primaryColor === c && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
              text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 border border-white/10 text-slate-400 hover:text-white
              hover:border-white/30 rounded-xl transition text-sm"
          >
            Skip
          </button>
        </div>
      </form>
    </>
  )
}