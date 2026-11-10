// apps/web/src/components/ui/modal.tsx — WCAG 2.1: focus trap + role dialog + aria + Escape
'use client'
import{useEffect,useRef}from 'react'
import{motion,AnimatePresence}from 'framer-motion'
import{X}from 'lucide-react'
import{scalePop}from '@/lib/motion'
const SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
interface Props{open:boolean;onClose:()=>void;title:string;description?:string;children:React.ReactNode;size?:'sm'|'md'|'lg'}
export default function Modal({open,onClose,title,description,children,size='md'}:Props){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!open||!ref.current)return
    const els=Array.from(ref.current.querySelectorAll<HTMLElement>(SEL));const first=els[0],last=els[els.length-1]
    function onKey(e:KeyboardEvent){if(e.key==='Escape'){onClose();return};if(e.key!=='Tab')return;if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last?.focus()}}else{if(document.activeElement===last){e.preventDefault();first?.focus()}}}
    document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';setTimeout(()=>first?.focus(),50)
    return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=''}
  },[open,onClose])
  const widths={sm:'max-w-sm',md:'max-w-md',lg:'max-w-2xl'}
  return(
    <AnimatePresence>
      {open&&(
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description?'modal-desc':undefined} variants={scalePop} initial="initial" animate="animate" exit="exit"
              className={`w-full ${widths[size]} rounded-2xl border shadow-2xl pointer-events-auto overflow-hidden`} style={{background:'var(--bg-surface)',borderColor:'var(--border)'}}>
              <div className="flex items-start justify-between px-5 py-4 border-b" style={{borderColor:'var(--border)'}}>
                <div><h2 id="modal-title" className="text-base font-semibold" style={{color:'var(--text-primary)'}}>{title}</h2>{description&&<p id="modal-desc" className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{description}</p>}</div>
                <button onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors ml-4" style={{color:'var(--text-muted)'}}><X className="w-4 h-4"/></button>
              </div>
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
