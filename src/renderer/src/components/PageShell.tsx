import type { LucideIcon } from 'lucide-react'

interface PageShellProps {
  title: string
  subtitle: string
  icon: LucideIcon
  actions?: React.ReactNode
  children?: React.ReactNode
}

export default function PageShell({ title, subtitle, icon: Icon, actions, children }: PageShellProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 h-[68px] border-b border-white/[0.05] bg-[#0a0a10]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-violet-400/70" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-semibold text-white leading-none">{title}</h1>
            <p className="text-[11px] text-white/35 leading-none">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {children ?? <EmptyState title={title} icon={Icon} />}
      </div>
    </div>
  )
}

function EmptyState({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] select-none">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl scale-150" />
        <div className="relative w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
          <Icon className="w-7 h-7 text-white/20" />
        </div>
      </div>
      <p className="text-[13px] font-medium text-white/30">{title}</p>
      <p className="text-[11px] text-white/15 mt-1.5">Cette section est en cours de construction</p>
    </div>
  )
}
