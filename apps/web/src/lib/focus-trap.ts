// apps/web/src/lib/focus-trap.ts — WCAG 2.1 SC 2.1.2
const SEL=['a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'].join(',')
export function createFocusTrap(el:HTMLElement){
  const els=Array.from(el.querySelectorAll<HTMLElement>(SEL));if(!els.length)return{activate:()=>{},deactivate:()=>{}}
  const first=els[0],last=els[els.length-1]
  function onKey(e:KeyboardEvent){if(e.key!=='Tab')return;if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus()}}else{if(document.activeElement===last){e.preventDefault();first.focus()}}}
  return{activate(){el.addEventListener('keydown',onKey);first.focus()},deactivate(){el.removeEventListener('keydown',onKey)}}
}
