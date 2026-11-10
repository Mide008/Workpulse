// apps/web/src/components/shell/theme-toggle.tsx
'use client'
import{useState,useEffect}from 'react'
import{motion}from 'framer-motion'
import{Sun,Moon}from 'lucide-react'
export default function ThemeToggle(){
  const[theme,setTheme]=useState<'light'|'dark'>('dark'),[mounted,setMounted]=useState(false)
  useEffect(()=>{setMounted(true);const s=(localStorage.getItem('wp-theme') as 'light'|'dark'|null)??'dark';setTheme(s);apply(s)},[])
  function apply(t:'light'|'dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark');try{localStorage.setItem('wp-theme',t)}catch{}}
  function toggle(){const n:('light'|'dark')=theme==='light'?'dark':'light';setTheme(n);apply(n)}
  if(!mounted)return<div className="w-9 h-9"/>
  return(
    <motion.button onClick={toggle} whileHover={{scale:1.05}} whileTap={{scale:0.95}} aria-label={`Switch to ${theme==='light'?'dark':'light'} mode`}
      className="w-9 h-9 rounded-xl flex items-center justify-center border hover:bg-[var(--bg-elevated)] transition-all"
      style={{borderColor:'var(--border)',color:'var(--text-secondary)'}}>
      {theme==='dark'?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}
    </motion.button>
  )
}
