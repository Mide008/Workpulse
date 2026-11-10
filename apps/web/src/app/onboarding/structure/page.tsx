// apps/web/src/app/onboarding/structure/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Building2, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ease } from '@/lib/motion'

interface Department { name: string }
interface Team { name: string; departmentIndex: number }

const SUGGESTIONS = ['Operations', 'Sales', 'Marketing', 'Engineering', 'Finance', 'Human Resources', 'Customer Success', 'Projects']
const inputCls = 'w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base'

export default function StructurePage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([{ name: '' }])
  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function addSuggestion(name: string) {
    if (departments.some(d => d.name.toLowerCase() === name.toLowerCase())) return
    const empty = departments.findIndex(d => !d.name.trim())
    if (empty >= 0) setDepartments(departments.map((d, i) => (i === empty ? { name } : d)))
    else setDepartments([...departments, { name }])
  }
  function removeDept(di: number) {
    setDepartments(departments.filter((_, i) => i !== di))
    setTeams(teams.filter(t => t.departmentIndex !== di).map(t => ({ ...t, departmentIndex: t.departmentIndex > di ? t.departmentIndex - 1 : t.departmentIndex })))
  }

  async function handleSave() {
    const valid = departments.map((d, i) => ({ ...d, i })).filter(d => d.name.trim())
    if (valid.length === 0) { router.push('/onboarding/invite'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('users').select('workspace_id').eq('id', user.id).single()
      const workspaceId = (profile as any)?.workspace_id
      if (!workspaceId) throw new Error('No workspace found')

      const { data: created, error } = await supabase
        .from('departments').insert(valid.map(d => ({ name: d.name.trim(), workspace_id: workspaceId }))).select('id, name')
      if (error) throw error

      const idByOriginal = new Map<number, string>()
      ;(created as any[] | null)?.forEach((row, pos) => idByOriginal.set(valid[pos].i, row.id))

      const validTeams = teams.filter(t => t.name.trim())
      if (validTeams.length > 0) {
        await supabase.from('teams').insert(validTeams.map(t => ({ name: t.name.trim(), workspace_id: workspaceId, department_id: idByOriginal.get(t.departmentIndex) ?? null })))
      }
      toast.success('Structure saved')
      router.push('/onboarding/invite')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save structure')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">Map your organisation</h1>
      <p className="text-base mb-7 text-slate-400">Add departments and the teams inside them. This is optional and easy to change later.</p>

      <div className="flex flex-wrap gap-2 mb-6" aria-label="Quick add departments">
        {SUGGESTIONS.map(s => (
          <motion.button key={s} type="button" whileTap={{ scale: 0.94 }} whileHover={{ y: -2 }} onClick={() => addSuggestion(s)}
            className="h-10 px-4 rounded-full text-sm font-semibold text-white inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
            <Plus className="w-3.5 h-3.5" />{s}
          </motion.button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {departments.map((dept, di) => (
            <motion.div key={di} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.3, ease: ease.out }}
              className="rounded-2xl p-4 space-y-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/20"><Building2 className="w-4 h-4 text-indigo-300" /></span>
                <input value={dept.name} onChange={e => setDepartments(departments.map((d, i) => (i === di ? { name: e.target.value } : d)))} placeholder={`Department ${di + 1}`} aria-label={`Department ${di + 1} name`} className={inputCls} />
                {departments.length > 1 && (
                  <button type="button" onClick={() => removeDept(di)} aria-label="Remove department" className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
              {teams.map((t, ti) => t.departmentIndex === di && (
                <div key={ti} className="flex items-center gap-2 pl-4 sm:pl-12">
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
                  <input value={t.name} onChange={e => setTeams(teams.map((x, i) => (i === ti ? { ...x, name: e.target.value } : x)))} placeholder="Team name" aria-label="Team name" className={inputCls} />
                  <button type="button" onClick={() => setTeams(teams.filter((_, i) => i !== ti))} aria-label="Remove team" className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setTeams([...teams, { name: '', departmentIndex: di }])} className="pl-4 sm:pl-12 text-sm font-semibold inline-flex items-center gap-1.5 hover:underline min-h-[40px] text-indigo-300 transition-colors">
                <Plus className="w-4 h-4" />Add team
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button type="button" onClick={() => setDepartments([...departments, { name: '' }])}
        className="w-full h-12 rounded-xl border-2 border-dashed border-white/20 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:border-indigo-400/60 transition-all flex items-center justify-center gap-2 mb-8">
        <Plus className="w-4 h-4" />Add department
      </button>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push('/onboarding/invite')} className="h-12 px-6 rounded-xl border border-white/20 text-base font-semibold text-white hover:bg-white/10 transition-colors">Skip</button>
        <motion.button type="button" disabled={saving} onClick={handleSave} whileTap={{ scale: 0.97 }}
          className="btn-shine flex-1 h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_10px_28px_rgba(99,102,241,.4)]">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </div>
    </div>
  )
}