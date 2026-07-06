// apps/web/src/app/(app)/crm/contacts/contacts-client.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, X, Loader2, Mail, Phone, Building2,
  User, Tag, MoreHorizontal, Trash2, Edit3, ChevronDown,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { toast } from 'sonner'

const STATUSES = ['lead', 'prospect', 'client', 'churned', 'partner']
const STATUS_COLORS: Record<string, string> = {
  lead: 'text-blue-500 bg-blue-500/10',
  prospect: 'text-amber-500 bg-amber-500/10',
  client: 'text-emerald-500 bg-emerald-500/10',
  churned: 'text-red-500 bg-red-500/10',
  partner: 'text-purple-500 bg-purple-500/10',
}

const SOURCES = ['Referral', 'Website', 'LinkedIn', 'Cold outreach', 'Event', 'Partner', 'Other']

export default function ContactsClient({ contacts: initial, companies, members, user }: {
  contacts: any[]; companies: any[]; members: any[]; user: any
}) {
  const [contacts, setContacts] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', jobTitle: '',
    companyId: '', status: 'lead', source: '', notes: '', tags: '',
  })

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  async function createContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) { toast.error('Full name is required'); return }
    setCreating(true)

    const res = await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email || null,
        phone: form.phone || null,
        jobTitle: form.jobTitle || null,
        companyId: form.companyId || null,
        status: form.status,
        source: form.source || null,
        notes: form.notes || null,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      }),
    })

    if (res.ok) {
      const { contact } = await res.json()
      setContacts(prev => [contact, ...prev])
      setShowCreate(false)
      resetForm()
      toast.success('Contact created')
    } else {
      toast.error('Failed to create contact')
    }
    setCreating(false)
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    const res = await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Contact deleted')
    } else {
      toast.error('Failed to delete contact')
    }
  }

  function resetForm() {
    setForm({ fullName: '', email: '', phone: '', jobTitle: '', companyId: '', status: 'lead', source: '', notes: '', tags: '' })
  }

  const inputClass = 'w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  const ContactForm = (
    <form onSubmit={createContact} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full name *</label>
          <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            placeholder="Sarah Johnson" autoFocus className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            type="email" placeholder="sarah@acme.com" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+234 801 234 5678" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Job title</label>
          <input value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
            placeholder="Head of Operations" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company</label>
          <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}
            className={inputClass} style={inputStyle}>
            <option value="">No company</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            className={inputClass} style={inputStyle}>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Source</label>
          <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
            className={inputClass} style={inputStyle}>
            <option value="">Unknown</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Tags <span style={{ color: 'var(--text-muted)' }}>(comma separated)</span>
          </label>
          <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
            placeholder="vip, enterprise, referral" className={inputClass} style={inputStyle} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} placeholder="Any relevant context about this contact..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={inputStyle} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => { setShowCreate(false); resetForm() }}
          className="flex-1 h-10 rounded-xl border text-sm font-medium transition"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
        <button type="submit" disabled={creating}
          className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)' }}>
          {creating && <Loader2 className="w-4 h-4 animate-spin" />}
          {creating ? 'Creating...' : 'Create contact'}
        </button>
      </div>
    </form>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" />
          Add contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={statusFilter === s
                ? { background: 'var(--primary)', color: 'white' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<User className="w-7 h-7" />}
          title={search ? 'No contacts found' : 'No contacts yet'}
          description={search ? `No contacts match "${search}". Try a different search.` : 'Add your first contact to start building your CRM. Contacts can be linked to companies and deals.'}
          action={!search ? { label: 'Add contact', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
          {filtered.map(contact => (
            <motion.div key={contact.id} variants={staggerItem}>
              <div className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <Avatar size="md">
                  {contact.avatar_url
                    ? <AvatarImage src={contact.avatar_url} alt={contact.full_name} />
                    : <AvatarFallback>{getInitials(contact.full_name)}</AvatarFallback>
                  }
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {contact.full_name}
                    </p>
                    {contact.status && (
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[contact.status])}>
                        {contact.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {contact.job_title && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{contact.job_title}</span>
                    )}
                    {contact.company && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Building2 className="w-3 h-3" />
                        {contact.company.name}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {contact.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setMenuOpen(menuOpen === contact.id ? null : contact.id)}
                    className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpen === contact.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-10 z-20 rounded-xl border shadow-xl overflow-hidden w-40"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                      >
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              onClick={() => { setShowCreate(false); resetForm() }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New contact</h3>
                  <button onClick={() => { setShowCreate(false); resetForm() }} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {ContactForm}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}