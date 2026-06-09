import Link from 'next/link'

interface LogoProps {
  className?: string
  linkTo?: string
}

export function WorkPulseLogo({ className = 'h-8 w-auto', linkTo }: LogoProps) {
  const logo = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path
            d="M3 12h4l3-9 4 18 3-9h4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">WorkPulse</span>
    </div>
  )

  if (linkTo) {
    return <Link href={linkTo}>{logo}</Link>
  }

  return logo
}