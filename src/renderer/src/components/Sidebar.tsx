import {
  LayoutDashboard,
  Building2,
  Users,
  Banknote,
  BookOpen,
  TrendingUp,
  Settings,
  Landmark
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Page } from '../App'

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick
}: {
  id: Page
  label: string
  icon: React.ElementType
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
        active
          ? 'bg-violet-500/12 text-white'
          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/75'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200',
          active
            ? 'bg-violet-500/20 text-violet-400'
            : 'text-white/35 group-hover:text-white/60'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-left">{label}</span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)]" />
      )}
    </button>
  )
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t } = useTranslation()

  const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'properties', label: t('nav.properties'), icon: Building2 },
    { id: 'tenants', label: t('nav.tenants'), icon: Users },
    { id: 'rents', label: t('nav.rents'), icon: Banknote },
    { id: 'accounting', label: t('nav.accounting'), icon: BookOpen },
    { id: 'tracking', label: t('nav.tracking'), icon: TrendingUp },
  ]

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full bg-[#0f0f18] border-r border-white/[0.05]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40 flex-shrink-0">
          <Landmark className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white leading-tight truncate">
            OpenPatrimoine
          </div>
          <div className="text-[10px] text-white/35 leading-tight mt-0.5">
            {t('nav.tagline')}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-white/[0.05] mb-3" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20 select-none">
          {t('nav.menu')}
        </p>
        {navItems.map(({ id, label, icon }) => (
          <NavItem
            key={id}
            id={id}
            label={label}
            icon={icon}
            active={activePage === id}
            onClick={() => onNavigate(id)}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 pt-3">
        <NavItem
          id="settings"
          label={t('nav.settings')}
          icon={Settings}
          active={activePage === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </div>
    </aside>
  )
}
