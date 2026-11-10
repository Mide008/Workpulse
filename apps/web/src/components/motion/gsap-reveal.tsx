// apps/web/src/components/motion/gsap-reveal.tsx
// Skill: Smyde Motion 3D Toolkit — GSAP ScrollTrigger for section reveals
// Animation Systems: "Section reveal on scroll" — trigger at 20-30% visible
'use client'
import{useEffect,useRef}from 'react'
interface Props{children:React.ReactNode;className?:string;from?:'bottom'|'left'|'right'|'fade';delay?:number;duration?:number}
export default function GSAPReveal({children,className='',from='bottom',delay=0,duration=0.7}:Props){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    let gsap:any,ScrollTrigger:any,ctx:any
    import('gsap').then(m=>{
      gsap=m.gsap??m.default??m
      return import('gsap/ScrollTrigger').then(st=>{
        ScrollTrigger=st.ScrollTrigger
        gsap.registerPlugin(ScrollTrigger)
        const el=ref.current;if(!el)return
        const fromVars:Record<string,any>={bottom:{opacity:0,y:40},left:{opacity:0,x:-40},right:{opacity:0,x:40},fade:{opacity:0}}
        const toVars:Record<string,any>={bottom:{opacity:1,y:0},left:{opacity:1,x:0},right:{opacity:1,x:0},fade:{opacity:1}}
        ctx=gsap.context(()=>{
          gsap.fromTo(el,fromVars[from],{...toVars[from],duration,delay,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 80%',once:true}})
        })
      })
    }).catch(()=>{if(ref.current)ref.current.style.opacity='1'})
    return()=>ctx?.revert()
  },[from,delay,duration])
  return<div ref={ref} className={className} style={{opacity:0}}>{children}</div>
}
