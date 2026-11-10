// apps/web/src/components/motion/noise-texture.tsx
// Skill: Impeccable craft floor — noise as texture from subject's world
export default function NoiseTexture({opacity=0.04,className=''}:{opacity?:number;className?:string}){
  return(
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{opacity}}>
      <filter id="wp-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#wp-noise)"/>
    </svg>
  )
}
