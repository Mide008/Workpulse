// apps/web/src/app/api/og/route.tsx
import{ImageResponse}from 'next/og'
import{NextRequest}from 'next/server'
export const runtime='edge'
export async function GET(req:NextRequest){
  const{searchParams}=new URL(req.url)
  const title=searchParams.get('title')||'WorkPulse — Team OS'
  const sub=searchParams.get('subtitle')||'Task management, KPI scoring, AI narratives, CRM, and agents.'
  return new ImageResponse(
    (<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#020617',fontFamily:'system-ui'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 50% at 50% -10%,rgba(99,102,241,0.3),transparent)'}}/>
      <div style={{position:'relative',display:'flex',flexDirection:'column',padding:'60px 80px',flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'48px'}}>
          <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'#6366F1',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#fff',fontSize:'24px',fontWeight:'900'}}>⚡</span></div>
          <span style={{color:'#fff',fontSize:'24px',fontWeight:'800'}}>WorkPulse</span>
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <h1 style={{fontSize:'64px',fontWeight:'900',color:'#fff',lineHeight:1.1,margin:'0 0 20px',letterSpacing:'-2px'}}>{title}</h1>
          <p style={{fontSize:'28px',color:'#94A3B8',margin:0,lineHeight:1.4}}>{sub}</p>
        </div>
        <div style={{display:'flex',gap:'32px',paddingTop:'32px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          {['Free plan forever','KPI scoring engine','AI agents','Built for Africa'].map(t=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:'8px',color:'#6366F1',fontSize:'18px'}}><span style={{color:'#10B981'}}>✓</span>{t}</div>
          ))}
        </div>
      </div>
    </div>),
    {width:1200,height:630}
  )
}
