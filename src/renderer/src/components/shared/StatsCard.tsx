import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CardColor = 'violet' | 'emerald' | 'amber' | 'red' | 'blue' | 'cyan'

const COLOR_MAP: Record<CardColor, { icon: string; glow: string; border: string }> = {
  violet: {
    icon: 'bg-violet-500/15 text-violet-400',
    glow: 'from-violet-500/5',
    border: 'border-violet-500/10'
  },
  emerald: {
    icon: 'bg-emerald-500/15 text-emerald-400',
    glow: 'from-emerald-500/5',
    border: 'border-emerald-500/10'
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-400',
    glow: 'from-amber-500/5',
    border: 'border-amber-500/10'
  },
  red: {
    icon: 'bg-red-500/15 text-red-400',
    glow: 'from-red-500/5',
    border: 'border-red-500/10'
  },
  blue: {
    icon: 'bg-blue-500/15 text-blue-400',
    glow: 'from-blue-500/5',
    border: 'border-blue-500/10'
  },
  cyan: {
    icon: 'bg-cyan-500/15 text-cyan-400',
    glow: 'from-cyan-500/5',
    border: 'border-cyan-500/10'
  }
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: CardColor
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'violet',
  className
}: StatsCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col gap-4',
        `bg-gradient-to-br ${colors.glow} to-transparent`,
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-white/40 leading-none">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-white tracking-tight leading-none">{value}</p>
        {subtitle && <p className="text-xs text-white/35 mt-1.5 leading-tight">{subtitle}</p>}
      </div>
    </div>
  )
}
