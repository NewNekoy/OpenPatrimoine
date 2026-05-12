import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] select-none gap-0">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-violet-500/8 blur-2xl scale-150" />
        <div className="relative w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
          <Icon className="w-7 h-7 text-white/20" />
        </div>
      </div>
      <p className="text-sm font-medium text-white/40">{title}</p>
      <p className="text-xs text-white/20 mt-1.5">{subtitle}</p>
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          size="sm"
          className="mt-7 bg-violet-600 hover:bg-violet-500 text-white gap-2 shadow-lg shadow-violet-900/30"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
