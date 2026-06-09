'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Department {
  name: string
  id?: string
}

interface Team {
  name: string
  departmentIndex: number
}

export default function StructurePage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([{ name: '' }])
  const [teams, setTeams] = useState<Team[]>([{ name: '', departmentIndex: 0 }])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function addDepartment() {
    setDepartments([...departments, { name: '' }])
  }

  function removeDepartment(index: number) {
    setDepartments(departments.filter((_, i) => i !== index))
    setTeams(teams.filter((t) => t.departmentIndex !== index))
  }

  function updateDepartment(index: number, name: string) {
    const updated = [...departments]
    updated[index].name = name
    setDepartments(updated)
  }

  function addTeam() {
    setTeams([...teams, { name: '', departmentIndex: 0 }])
  }

  function removeTeam(index: number) {
    setTeams(teams.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const validDepts = departments.filter((d) => d.name.trim())
    if (validDepts.length === 0) {
      router.push('/onboarding/invite')
      return
    }

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

      const workspaceId = (profile as { workspace_id: string } | null)?.workspace_id
      if (!workspaceId) throw new Error('No workspace found')

      // Insert departments
      const { data: createdDepts } = await supabase
        .from('departments')
        .insert(validDepts.map((d) => ({ name: d.name, workspace_id: workspaceId })))
        .select('id, name')

      const deptMap = new Map(
        (createdDepts as { id: string; name: string }[] | null)?.map((d, i) => [i, d.id]) ?? []
      )

      // Insert teams
      const validTeams = teams.filter((t) => t.name.trim())
      if (validTeams.length > 0) {
        await supabase.from('teams').insert(
          validTeams.map((t) => ({
            name: t.name,
            workspace_id: workspaceId,
            department_id: deptMap.get(t.departmentIndex) ?? null,
          }))
        )
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
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set up your structure</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Add departments and teams. You can always add more later.
        </p>
      </div>

      <div className="space-y-8">
        {/* Departments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[var(--text-primary)] font-semibold">Departments</h2>
            <button
              onClick={addDepartment}
              className="flex items-center gap-1.5 text-sm text-indigo-400
                hover:text-indigo-300 transition"
            >
              <Plus className="w-4 h-4" />
              Add department
            </button>
          </div>
          <div className="space-y-2">
            {departments.map((dept, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={dept.name}
                  onChange={(e) => updateDepartment(i, e.target.value)}
                  placeholder={`e.g. ${['Sales', 'Operations', 'Technology', 'Finance'][i % 4]}`}
                  className="flex-1 bg-white/5 border border-[var(--border)]10 rounded-xl px-4 py-2.5
                    text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2
                    focus:ring-indigo-500 transition text-sm"
                />
                {departments.length > 1 && (
                  <button
                    onClick={() => removeDepartment(i)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[var(--text-primary)] font-semibold">Teams</h2>
            <button
              onClick={addTeam}
              className="flex items-center gap-1.5 text-sm text-indigo-400
                hover:text-indigo-300 transition"
            >
              <Plus className="w-4 h-4" />
              Add team
            </button>
          </div>
          <div className="space-y-2">
            {teams.map((team, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={team.name}
                  onChange={(e) => {
                    const updated = [...teams]
                    updated[i].name = e.target.value
                    setTeams(updated)
                  }}
                  placeholder="e.g. Frontend, Lettings, Claims"
                  className="flex-1 bg-white/5 border border-[var(--border)]10 rounded-xl px-4 py-2.5
                    text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2
                    focus:ring-indigo-500 transition text-sm"
                />
                <select
                  value={team.departmentIndex}
                  onChange={(e) => {
                    const updated = [...teams]
                    updated[i].departmentIndex = Number(e.target.value)
                    setTeams(updated)
                  }}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)]10 rounded-xl px-3 py-2.5
                    text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map((d, di) => (
                    <option key={di} value={di}>
                      {d.name || `Department ${di + 1}`}
                    </option>
                  ))}
                </select>
                {teams.length > 1 && (
                  <button
                    onClick={() => removeTeam(i)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/onboarding/invite')}
            className="flex-1 border border-[var(--border)]10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]
              hover:border-[var(--border)]30 font-medium py-3 rounded-xl transition text-sm"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
              text-[var(--text-primary)] font-semibold py-3 rounded-xl transition
              flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  )
}