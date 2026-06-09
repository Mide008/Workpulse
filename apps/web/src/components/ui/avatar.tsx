// apps/web/src/components/ui/avatar.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  className?: string
  children?: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

function Avatar({ className, children, size = 'sm' }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-white/10',
        sizeMap[size],
        className
      )}
    >
      {children}
    </div>
  )
}

function AvatarImage({ src, alt = '', className }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-full h-full object-cover', className)}
    />
  )
}

function AvatarFallback({ children, className, color }: { children?: React.ReactNode; className?: string; color?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center font-semibold select-none',
        className
      )}
      style={{
        background: color
          ? color
          : 'color-mix(in srgb, var(--primary, #6366F1) 20%, transparent)',
        color: color ? 'white' : 'var(--primary, #6366F1)',
      }}
    >
      {children}
    </div>
  )
}

interface AvatarGroupProps {
  avatars: Array<{ name: string; avatarUrl?: string | null; color?: string }>
  max?: number
  size?: AvatarProps['size']
  className?: string
}

function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((av, i) => (
        <div key={i} className={cn('relative', i !== 0 && '-ml-2')}>
          <Avatar size={size} className="ring-2 ring-slate-900">
            {av.avatarUrl ? (
              <AvatarImage src={av.avatarUrl} alt={av.name} />
            ) : (
              <AvatarFallback color={av.color}>
                {av.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      ))}
      {remaining > 0 && (
        <div className="-ml-2">
          <Avatar size={size} className="ring-2 ring-slate-900">
            <AvatarFallback className="bg-slate-700 text-slate-300 text-[10px]">
              +{remaining}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }