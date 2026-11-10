// apps/web/src/components/ui/priority-badge.tsx
// WCAG 1.4.1 — color + text, never color alone
import{cn}from '@/lib/utils'
const CFG={critical:{color:'bg-red-500',label:'Critical'},high:{color:'bg-orange-500',label:'High'},medium:{color:'bg-amber-400',label:'Medium'},low:{color:'bg-slate-400',label:'Low'}}
interface Props{priority:string;showLabel?:boolean;className?:string}
export default function PriorityBadge({priority,showLabel=false,className=''}:Props){
  const cfg=CFG[priority as keyof typeof CFG];if(!cfg)return null
  return(
    <span className={cn('inline-flex items-center gap-1.5',className)} title={cfg.label} aria-label={`Priority: ${cfg.label}`}>
      <span className={cn('w-2 h-2 rounded-full shrink-0',cfg.color)} aria-hidden="true"/>
      {showLabel&&<span className="text-xs font-medium" style={{color:'var(--text-muted)'}}>{cfg.label}</span>}
    </span>
  )
}
