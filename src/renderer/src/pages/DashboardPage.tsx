import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Users, Banknote, AlertCircle, TrendingUp, PieChart, LayoutDashboard, Calendar, AlertTriangle, Clock } from 'lucide-react'
import PageShell from '@/components/PageShell'
import { StatsCard } from '@/components/shared/StatsCard'
import { RentStatusBadge } from '@/components/shared/StatusBadge'
import { useProperties } from '@/hooks/useProperties'
import { useTenants } from '@/hooks/useTenants'
import { useRents } from '@/hooks/useRents'
import { useAccounting } from '@/hooks/useAccounting'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: properties = [] } = useProperties()
  const { data: tenants = [] } = useTenants()
  const { data: rents = [] } = useRents()
  const { data: accounting = [] } = useAccounting()

  const stats = useMemo(() => {
    const now = new Date()
    const activeTenants = tenants.filter((t) => !t.leaseEnd || new Date(t.leaseEnd) > now)
    const monthlyRevenue = activeTenants.reduce((s, t) => s + t.monthlyRent + (t.charges ?? 0), 0)
    const unpaidRents = rents.filter((r) => r.status === 'pending' || r.status === 'late')
    const totalPatrimony = properties.reduce((s, p) => s + (p.purchasePrice ?? 0), 0)
    const propertiesWithTenant = new Set(activeTenants.map((t) => t.propertyId)).size
    const occupancy = properties.length > 0
      ? Math.round((propertiesWithTenant / properties.length) * 100)
      : 0
    const totalIncome = accounting.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
    const totalExpense = accounting.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

    return { activeTenants, monthlyRevenue, unpaidRents, totalPatrimony, occupancy, totalIncome, totalExpense }
  }, [properties, tenants, rents, accounting])

  const alerts = useMemo(() => {
    const now = new Date()
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const lateRents = rents.filter(
      (r) => r.status === 'late' || (r.status === 'pending' && new Date(r.dueDate) < now)
    )
    const expiringLeases = tenants.filter(
      (t) => t.leaseEnd && new Date(t.leaseEnd) >= now && new Date(t.leaseEnd) <= in60
    ).sort((a, b) => a.leaseEnd!.localeCompare(b.leaseEnd!))
    return { lateRents, expiringLeases }
  }, [rents, tenants])

  const upcomingRents = useMemo(() => {
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return rents
      .filter((r) => {
        if (r.status === 'paid') return false
        const due = new Date(r.dueDate)
        return due >= now && due <= in30
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  }, [rents])

  return (
    <PageShell title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} icon={LayoutDashboard}>
      <div className="flex flex-col gap-6">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard
            title={t('dashboard.stats.properties')}
            value={properties.length}
            subtitle={t('dashboard.stats.propertiesOccupied', { pct: stats.occupancy })}
            icon={Building2}
            color="violet"
          />
          <StatsCard
            title={t('dashboard.stats.activeTenants')}
            value={stats.activeTenants.length}
            subtitle={t('dashboard.stats.activeTenantsOf', { total: tenants.length })}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title={t('dashboard.stats.monthlyRevenue')}
            value={formatCurrency(stats.monthlyRevenue)}
            subtitle={t('dashboard.stats.monthlyRevenueSub')}
            icon={Banknote}
            color="emerald"
          />
          <StatsCard
            title={t('dashboard.stats.pendingRents')}
            value={stats.unpaidRents.length}
            subtitle={stats.unpaidRents.length > 0
              ? t('dashboard.stats.pendingRentsAmount', { amount: formatCurrency(stats.unpaidRents.reduce((s, r) => s + r.amount, 0)) })
              : t('dashboard.stats.allClear')}
            icon={AlertCircle}
            color={stats.unpaidRents.length > 0 ? 'red' : 'emerald'}
          />
          <StatsCard
            title={t('dashboard.stats.patrimony')}
            value={stats.totalPatrimony > 0 ? formatCurrency(stats.totalPatrimony) : '—'}
            subtitle={t('dashboard.stats.patrimonySub')}
            icon={TrendingUp}
            color="amber"
          />
          <StatsCard
            title={t('dashboard.stats.balance')}
            value={formatCurrency(stats.totalIncome - stats.totalExpense)}
            subtitle={t('dashboard.stats.balanceSub', { income: formatCurrency(stats.totalIncome), expense: formatCurrency(stats.totalExpense) })}
            icon={PieChart}
            color="cyan"
          />
        </div>

        {/* Alerts */}
        {(alerts.lateRents.length > 0 || alerts.expiringLeases.length > 0) && (
          <div className="flex flex-col gap-2">
            {alerts.lateRents.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-300">
                    {alerts.lateRents.length === 1
                      ? t('dashboard.alerts.lateRentsOne', { count: alerts.lateRents.length })
                      : t('dashboard.alerts.lateRentsMany', { count: alerts.lateRents.length })}
                    <span className="ml-2 font-normal text-red-400/70">
                      {t('dashboard.alerts.lateRentsAmount', { amount: formatCurrency(alerts.lateRents.reduce((s, r) => s + r.amount, 0)) })}
                    </span>
                  </p>
                  <p className="text-xs text-red-400/50 mt-0.5">
                    {alerts.lateRents.slice(0, 3).map((r) => {
                      const tenant = tenants.find((t) => t.id === r.tenantId)
                      return tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'
                    }).join(' · ')}
                    {alerts.lateRents.length > 3 && t('dashboard.alerts.lateRentsMore', { count: alerts.lateRents.length - 3 })}
                  </p>
                </div>
              </div>
            )}
            {alerts.expiringLeases.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-300">
                    {alerts.expiringLeases.length === 1
                      ? t('dashboard.alerts.expiringLeasesOne', { count: alerts.expiringLeases.length })
                      : t('dashboard.alerts.expiringLeasesMany', { count: alerts.expiringLeases.length })}
                  </p>
                  <p className="text-xs text-amber-400/50 mt-0.5">
                    {alerts.expiringLeases.slice(0, 3).map((t) => `${t.firstName} ${t.lastName} (${formatDate(t.leaseEnd)})`).join(' · ')}
                    {alerts.expiringLeases.length > 3 && ` · +${alerts.expiringLeases.length - 3}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming rents */}
        {upcomingRents.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.05]">
              <Calendar className="w-3.5 h-3.5 text-white/30" />
              <p className="text-xs font-medium text-white/50">{t('dashboard.upcoming')}</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {upcomingRents.map((r) => {
                const tenant = tenants.find((t) => t.id === r.tenantId)
                const property = properties.find((p) => p.id === r.propertyId)
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center text-[9px] font-semibold text-violet-300 flex-shrink-0">
                        {tenant?.firstName[0]}{tenant?.lastName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/80">
                          {tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'}
                        </p>
                        <p className="text-[10px] text-white/35">{property?.name ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">{formatDate(r.dueDate)}</span>
                      <span className="text-sm font-semibold text-white/70 tabular-nums">{formatCurrency(r.amount)}</span>
                      <RentStatusBadge status={r.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/[0.06]">
            <LayoutDashboard className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30 font-medium">{t('dashboard.welcome')}</p>
            <p className="text-xs text-white/20 mt-1">{t('dashboard.welcomeSub')}</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
