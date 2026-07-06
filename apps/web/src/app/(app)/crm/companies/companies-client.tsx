// apps/web/src/app/(app)/crm/companies/companies-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, Loader2, Building2, Globe, Phone, Users, Trash2, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'

const INDUSTRIES = [
  'Technology', 'Real Estate', 'Healthcare', 'Construction',
  'Legal & Finance', 'Education', 'Logistics', 'Retail', 'Hospitality', 'Manufacturing', 'Other',
]

export default function CompaniesClient({ companies: initial, user }: { companies: any[]; user: any }) {
  const [companies, setCompanies] = useState(initial)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', industry: '', website: '', phone: '', address: '',
    employeeCount: '', annualRevenue: '', notes: '',
  })

  const filtered = companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  async function createCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Company name is required'); return }
    setCreating(true)

    const res = await fetch('/api/crm/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        industry: form.industry || null,
        website: form.website || null,
        phone: form.phone || null,
        address: form.address || null,
        employeeCount: form.employeeCount ? Number(form.employeeCount) : null,
        annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : null,
        notes: form.notes || null,
      }),
    })

    if (res.ok) {
      const { company } = await res.json()
      setCompanies(prev => [{ ...company, contacts: [] }, ...prev])
      setShowCreate(false)
      setForm({ name: '', industry: '', website: '', phone: '', address: '', employeeCount: '', annualRevenue: '', notes: '' })
      toast.success('Company created')
    } else {
      toast.error('Failed to create company')
    }
    setCreating(false)
  }

  async function deleteCompany(id: string) {
    if (!confirm('Delete this company? Associated contacts will not be deleted.')) return
    const res = await fetch(`/api/crm/companies/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCompanies(prev => prev.filter(c => c.id !== id))
      toast.success('Company deleted')
    } else {
      toast.error('Failed to delete company')
    }
  }

  const inputClass = 'w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Companies</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />
          Add company
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" />}
          title={search ? 'No companies found' : 'No companies yet'}
          description={search ? `No companies match "${search}".` : 'Add companies to organise your contacts and deals. Companies give you an account-level view of your relationships.'}
          action={!search ? { label: 'Add company', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(company => (
            <motion.div key={company.id} variants={staggerItem}>
              <div className="group p-5 rounded-2xl border transition-all hover:shadow-sm hover:-translate-y-0.5 relative"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
                    style={{ background: 'var(--primary)' }}>
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{company.name}</p>
                    {company.industry && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{company.industry}</p>}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === company.id ? null : company.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === company.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-8 z-20 rounded-xl border shadow-xl overflow-hidden w-36"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                        >
                          <button onClick={() => deleteCompany(company.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition text-left">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  {company.website && (
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs transition hover:opacity-70"
                      style={{ color: 'var(--primary)' }}
                      onClick={e => e.stopPropagation()}>
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate">{company.website}</span>
                    </a>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-3.5 h-3.5" />
                      {company.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Users className="w-3.5 h-3.5" />
                    {company.contacts?.length ?? 0} contact{(company.contacts?.length ?? 0) !== 1 ? 's' : ''}
                    {company.employee_count && ` · ${company.employee_count.toLocaleString()} employees`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New company</h3>
                  <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={createCompany} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Acme Corporation" autoFocus className={inputClass} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Industry</label>
                      <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+234 801 234 5678" className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Website</label>
                      <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                        placeholder="acme.com" className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employees</label>
                      <input value={form.employeeCount} onChange={e => setForm(p => ({ ...p, employeeCount: e.target.value }))}
                        type="number" placeholder="250" className={inputClass} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} placeholder="Key context about this company..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={inputStyle} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="flex-1 h-10 rounded-xl border text-sm font-medium transition"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={creating}
                      className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary)' }}>
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {creating ? 'Creating...' : 'Create company'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}