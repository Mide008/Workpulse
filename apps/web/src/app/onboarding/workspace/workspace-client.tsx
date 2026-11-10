// apps/web/src/app/onboarding/workspace/workspace-client.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import PageLoader from '@/components/motion/page-loader'
import { ease } from '@/lib/motion'

const INDUSTRIES = ['Technology', 'Real Estate', 'Healthcare', 'Construction', 'Legal & Finance', 'Education', 'Logistics', 'Retail', 'Hospitality', 'Other']
const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6']
const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

const inputCls = 'w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base'

export default function OnboardingWorkspaceClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
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
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase.from('users').select('workspace_id').eq('id', user.id).maybeSingle()
      if ((p as any)?.workspace_id) { router.replace('/dashboard'); return }
      setCheckingAuth(false)
    })
  }, [])

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return }
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  function next() {
    if (step === 0 && !name.trim()) { toast.error('Give your workspace a name'); return }
    if (step === 1 && (!industry || !size)) { toast.error(!industry ? 'Select your sector' : 'Select your team size'); return }
    setStep(s => s + 1)
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
        .select('id').single()
      if (wsError || !workspace) throw wsError

      const wid = (workspace as any).id

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `${wid}/logo-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('workspace-logos').upload(path, logoFile, { upsert: true })
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
        .from('roles').insert(defaultRoles.map(r => ({ ...r, workspace_id: wid }))).select('id, level')
      if (rolesError) throw rolesError

      const execRole = (roles as any[]).find(r => r.level === 1)
      const { error: userError } = await supabase.from('users').upsert({
        id: user.id, workspace_id: wid, role_id: execRole?.id ?? null,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '', is_active: true,
      })
      if (userError) throw userError

      toast.success('Workspace created')
      router.push('/onboarding/structure')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) return <PageLoader />

  const primaryBtn = 'btn-shine h-12 px-6 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60'
  const grad = { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: '0 10px 28px rgba(99,102,241,.4)' }
  const ghostBtn = 'h-12 px-5 rounded-xl border border-white/20 text-base font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-2'

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
        {['Name your workspace', 'Tell us about your team', 'Make it yours'][step]}
      </h1>
      <p className="text-base mb-8 text-slate-400">
        {['This is what your team will see when they join.', 'We use this to set sensible defaults. You can change it later.', 'Pick a brand colour. It tints buttons and highlights across your workspace.'][step]}
      </p>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: ease.out }} className="space-y-6">
            <div>
              <label htmlFor="ws-name" className="block text-sm font-semibold mb-2 text-slate-300">Workspace name</label>
              <div className="flex items-center gap-3">
                <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0" animate={{ background: color }}>
                  {name ? name[0].toUpperCase() : <Building2 className="w-5 h-5 opacity-80" />}
                </motion.div>
                <input id="ws-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your company or team name" autoFocus className={inputCls} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-300">Logo <span className="font-normal text-slate-500">(optional)</span></p>
              <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-indigo-400/60 hover:bg-white/5 transition-all">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-xl object-cover" />
                  : <span className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/5"><Upload className="w-5 h-5 text-slate-300" /></span>}
                <span>
                  <span className="block text-[15px] font-semibold text-white">{logoPreview ? 'Change logo' : 'Upload a logo'}</span>
                  <span className="block text-sm text-slate-400">PNG, JPG or SVG · up to 2 MB</span>
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={onLogo} />
              </label>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: ease.out }} className="space-y-7">
            <fieldset>
              <legend className="text-sm font-semibold mb-3 text-slate-300">Your sector</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {INDUSTRIES.map(ind => {
                  const on = industry === ind
                  return (
                    <motion.button key={ind} type="button" whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} onClick={() => setIndustry(ind)}
                      className={`min-h-[52px] px-3 rounded-xl border text-sm font-semibold text-left flex items-center justify-between gap-2 transition-colors ${on ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                      {ind}{on && <Check className="w-4 h-4 shrink-0 text-indigo-300" />}
                    </motion.button>
                  )
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold mb-3 text-slate-300">Team size</legend>
              <div className="flex flex-wrap gap-2.5">
                {SIZES.map(s => {
                  const on = size === s
                  return (
                    <motion.button key={s} type="button" whileTap={{ scale: 0.96 }} onClick={() => setSize(s)}
                      className={`h-12 px-5 rounded-xl border text-sm font-bold transition-colors ${on ? 'bg-indigo-500/20 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                      {s} people
                    </motion.button>
                  )
                })}
              </div>
            </fieldset>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: ease.out }} className="space-y-7">
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <motion.button key={c} type="button" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={() => setColor(c)}
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }}>
                  {color === c && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                </motion.button>
              ))}
            </div>
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-white/5 border border-white/10">
              {logoPreview
                ? <img src={logoPreview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                : <motion.div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-2xl" animate={{ background: color }}>{name[0]?.toUpperCase() ?? 'W'}</motion.div>}
              <div className="min-w-0">
                <p className="text-lg font-bold text-white truncate">{name || 'Your workspace'}</p>
                <p className="text-sm text-slate-400">{industry || 'Sector'} · {size || 'Team size'} people</p>
              </div>
              <motion.span className="ml-auto h-9 px-4 rounded-lg text-sm font-bold text-white flex items-center shrink-0" animate={{ background: color }}>Button</motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-10">
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => s - 1)} className={ghostBtn}>
            <ArrowLeft className="w-4 h-4" />Back
          </button>
        )}
        {step < 2 ? (
          <motion.button type="button" onClick={next} whileTap={{ scale: 0.97 }} className={`${primaryBtn} flex-1`} style={grad}>
            Continue <ArrowRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className={`${primaryBtn} flex-1`} style={grad}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating workspace…</> : <>Create workspace <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        )}
      </div>
    </form>
  )
}