// apps/web/src/app/(app)/crm/pipeline/pipeline-client.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, X, Loader2, Building2, User, DollarSign,
  TrendingUp, TrendingDown, Trophy, ChevronDown, Calendar,
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'

const STAGES = [
  { id: 'new', label: 'New', color: '#6366F1', bg: 'bg-indigo-500/10' },
  { id: 'qualified', label: 'Qualified', color: '#3B82F6', bg: 'bg-blue-500/10' },
  { id: 'proposal', label: 'Proposal', color: '#8B5CF6', bg: 'bg-purple-500/10' },
  { id: 'negotiation', label: 'Negotiation', color: '#F59E0B', bg: 'bg-amber-500/10' },
  { id: 'won', label: 'Won', color: '#10B981', bg: 'bg-emerald-500/10' },
  { id: 'lost', label: 'Lost', color: '#EF4444', bg: 'bg-red-500/10' },
]

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function DealCard({ deal, isDragging }: { deal: any; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: selfDragging } = useSortable({ id: deal.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: selfDragging ? 0.4 : 1,
  }

  const stage = STAGES.find(s => s.id === deal.stage)

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={cn(
        'p-4 rounded-xl border mb-2.5 cursor-grab active:cursor-grabbing transition-all',
        isDragging ? 'shadow-2xl rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'
      )}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {deal.title}
          </p>
          {deal.stage === 'won' && <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />}
          {deal.stage === 'lost' && <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />}
        </div>

        {deal.value > 0 && (
          <p className="text-base font-bold mb-3" style={{ color: stage?.color ?? 'var(--text-primary)' }}>
            {formatCurrency(deal.value, deal.currency)}
          </p>
        )}

        <div className="space-y-1.5">
          {deal.company && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{deal.company.name}</span>
            </div>
          )}
          {deal.contact && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{deal.contact.full_name}</span>
            </div>
          )}
          {deal.close_date && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formatDate(deal.close_date)}</span>
            </div>
          )}
        </div>

        {deal.probability > 0 && deal.stage !== 'won' && deal.stage !== 'lost' && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Probability</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{deal.probability}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full" style={{ width: `${deal.probability}%`, background: stage?.color }} />
            </div>
          </div>
        )}

        {deal.owner && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <Avatar size="xs">
              {deal.owner.avatar_url
                ? <AvatarImage src={deal.owner.avatar_url} alt={deal.owner.full_name} />
                : <AvatarFallback>{getInitials(deal.owner.full_name)}</AvatarFallback>
              }
            </Avatar>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{deal.owner.full_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PipelineClient({ deals: initialDeals, contacts, companies, members, user }: {
  deals: any[]; contacts: any[]; companies: any[]; members: any[]; user: any
}) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '', value: '', currency: 'USD', stage: 'new',
    companyId: '', contactId: '', closeDate: '', probability: '20', description: '',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const pipelineValue = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((s, d) => s + (d.value ?? 0), 0)

  const wonValue = deals
    .filter(d => d.stage === 'won')
    .reduce((s, d) => s + (d.value ?? 0), 0)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const newStage = over.id as string
    if (!STAGES.find(s => s.id === newStage)) return

    const deal = deals.find(d => d.id === active.id)
    if (!deal || deal.stage === newStage) return

    setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage: newStage } : d))

    const res = await fetch(`/api/crm/deals/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })

    if (!res.ok) {
      setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage: deal.stage } : d))
      toast.error('Failed to move deal')
    } else {
      const stageName = STAGES.find(s => s.id === newStage)?.label
      toast.success(`Deal moved to ${stageName}`)
    }
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setCreating(true)

    const res = await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        value: Number(form.value) || 0,
        currency: form.currency,
        stage: form.stage,
        companyId: form.companyId || null,
        contactId: form.contactId || null,
        closeDate: form.closeDate || null,
        probability: Number(form.probability),
        description: form.description,
      }),
    })

    if (res.ok) {
      const { deal } = await res.json()
      setDeals(prev => [deal, ...prev])
      setShowCreate(false)
      setForm({ title: '', value: '', currency: 'USD', stage: 'new', companyId: '', contactId: '', closeDate: '', probability: '20', description: '' })
      toast.success('Deal created')
    } else {
      toast.error('Failed to create deal')
    }
    setCreating(false)
  }

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  const inputClass = 'w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
  const inputStyle = { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Deal Pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Drag deals between stages. {deals.length} deals · {formatCurrency(pipelineValue)} pipeline · {formatCurrency(wonValue)} won
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="w-4 h-4" />
          Add deal
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pipeline value', value: formatCurrency(pipelineValue), icon: DollarSign, color: '#6366F1' },
          { label: 'Won this period', value: formatCurrency(wonValue), icon: Trophy, color: '#10B981' },
          { label: 'Total deals', value: deals.filter(d => !['won', 'lost'].includes(d.stage)).length.toString(), icon: TrendingUp, color: '#3B82F6' },
          { label: 'Win rate', value: deals.length > 0 ? `${Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100)}%` : '0%', icon: TrendingUp, color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: `${stat.color}18` }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      {deals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-7 h-7" />}
          title="No deals yet"
          description="Add your first deal to start tracking your sales pipeline. Drag and drop deals between stages as they progress."
          action={{ label: 'Add first deal', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: '600px' }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage.id)
              const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0)

              return (
                <div key={stage.id} style={{ minWidth: '280px', maxWidth: '300px', width: '280px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stage.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {stageDeals.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <span className="text-xs font-semibold" style={{ color: stage.color }}>
                        {formatCurrency(stageValue)}
                      </span>
                    )}
                  </div>

                  <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    <div
                      className="rounded-2xl p-3 min-h-32 transition-all"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: `1px solid var(--border)`,
                      }}
                      data-stage={stage.id}
                    >
                      {stageDeals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 text-center">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Drop deals here</p>
                        </div>
                      ) : (
                        stageDeals.map(deal => (
                          <DealCard key={deal.id} deal={deal} />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeDeal && (
              <div className="opacity-90 rotate-2 shadow-2xl">
                <DealCard deal={activeDeal} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create deal modal */}
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
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New deal</h3>
                  <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={createDeal} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deal title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Enterprise contract — Acme Corp" autoFocus
                      className={inputClass} style={inputStyle} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Value</label>
                      <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                        type="number" placeholder="0" min="0"
                        className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Currency</label>
                      <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        {['USD', 'GBP', 'EUR', 'NGN', 'AED', 'CAD', 'AUD'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stage</label>
                      <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Probability %</label>
                      <input value={form.probability} onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                        type="number" min="0" max="100"
                        className={inputClass} style={inputStyle} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company</label>
                      <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        <option value="">No company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contact</label>
                      <select value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}
                        className={inputClass} style={inputStyle}>
                        <option value="">No contact</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Close date</label>
                    <input value={form.closeDate} onChange={e => setForm(p => ({ ...p, closeDate: e.target.value }))}
                      type="date" className={inputClass} style={inputStyle} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="Any relevant context..."
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
                      {creating ? 'Creating...' : 'Create deal'}
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