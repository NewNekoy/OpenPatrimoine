import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Users, BarChart3 } from 'lucide-react'
import { FileSection } from '@/components/shared/FileSection'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getPropertyTypeColor } from '@/lib/propertyTypes'
import { useTenants } from '@/hooks/useTenants'
import { useRents } from '@/hooks/useRents'
import { useAccounting } from '@/hooks/useAccounting'
import type { Property } from '@/types/entities'
import type { PropertyType } from '@/lib/propertyTypes'

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'violet' }: { label: string; value: string; sub?: string; color?: 'violet' | 'emerald' | 'red' | 'amber' }) {
  const colors = {
    violet: 'bg-violet-500/10 border-violet-500/15 text-violet-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/15 text-emerald-300',
    red: 'bg-red-500/10 border-red-500/15 text-red-300',
    amber: 'bg-amber-500/10 border-amber-500/15 text-amber-300',
  }
  return (
    <div className={`flex flex-col gap-1 px-4 py-3 rounded-xl border ${colors[color]}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-60">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-[10px] opacity-50">{sub}</span>}
    </div>
  )
}

interface PropertyDetailDialogProps {
  property: Property | null
  open: boolean
  onClose: () => void
  onEdit: (p: Property) => void
}

export function PropertyDetailDialog({ property, open, onClose, onEdit }: PropertyDetailDialogProps) {
  const { t } = useTranslation()
  const { data: allTenants = [] } = useTenants()
  const { data: allRents = [] } = useRents()
  const { data: allEntries = [] } = useAccounting()

  const tenants = useMemo(() => allTenants.filter((t) => t.propertyId === property?.id), [allTenants, property?.id])
  const activeTenants = useMemo(() => tenants.filter((t) => !t.leaseEnd || new Date(t.leaseEnd) > new Date()), [tenants])

  const stats = useMemo(() => {
    if (!property) return null
    const year = new Date().getFullYear()
    const propertyRents = allRents.filter((r) => r.propertyId === property.id)
    const propertyEntries = allEntries.filter((e) => e.propertyId === property.id)

    const ytdEntries = propertyEntries.filter((e) => e.date.startsWith(String(year)))
    const ytdIncome = ytdEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
    const ytdExpense = ytdEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
    const ytdNet = ytdIncome - ytdExpense

    const totalRents = propertyRents.length
    const paidRents = propertyRents.filter((r) => r.status === 'paid').length
    const pendingRents = propertyRents.filter((r) => r.status === 'pending' || r.status === 'late').length
    const collectionRate = totalRents > 0 ? Math.round((paidRents / totalRents) * 100) : 0

    const monthlyRevenue = activeTenants.reduce((s, t) => s + t.monthlyRent + (t.charges ?? 0), 0)
    const annualRevenue = monthlyRevenue * 12
    const grossYield = property.purchasePrice && annualRevenue > 0
      ? ((annualRevenue / property.purchasePrice) * 100).toFixed(1)
      : null

    return { ytdIncome, ytdExpense, ytdNet, totalRents, paidRents, pendingRents, collectionRate, monthlyRevenue, grossYield }
  }, [allRents, allEntries, property, activeTenants])

  if (!property) return null

  const year = new Date().getFullYear()
  const activeCount = activeTenants.length

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-white truncate">{property.name}</DialogTitle>
              <p className="text-xs text-white/40 mt-1">{property.address}, {property.city}</p>
            </div>
            <Badge className={`${getPropertyTypeColor(property.type)} border text-xs shrink-0`}>
              {t(`properties.types.${property.type as PropertyType}`)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="fiche" className="mt-2">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] h-8 w-full">
            <TabsTrigger value="fiche" className="flex-1 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
              {t('properties.detail.tabFiche')}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
              <BarChart3 className="w-3 h-3 mr-1" />
              {t('properties.detail.tabStats')}
            </TabsTrigger>
          </TabsList>

          {/* ── Fiche ── */}
          <TabsContent value="fiche" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label={t('properties.detail.surface')} value={`${property.surface} m²`} />
              <DetailRow label={t('properties.detail.rooms')} value={property.rooms} />
              <DetailRow label={t('properties.detail.purchasePrice')} value={property.purchasePrice ? formatCurrency(property.purchasePrice) : undefined} />
              <DetailRow label={t('properties.detail.purchaseDate')} value={formatDate(property.purchaseDate)} />
            </div>

            {property.notes && (
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 mb-1">{t('properties.detail.notes')}</p>
                <p className="text-sm text-white/70 leading-relaxed">{property.notes}</p>
              </div>
            )}

            {tenants.length > 0 && (
              <div className="pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-xs font-medium text-white/50">
                    {t('properties.detail.tenants')} ({activeCount === 1
                      ? t('properties.detail.tenantsActiveOne', { count: activeCount })
                      : t('properties.detail.tenantsActiveMany', { count: activeCount })})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {tenants.map((tenant) => {
                    const active = !tenant.leaseEnd || new Date(tenant.leaseEnd) > new Date()
                    return (
                      <div key={tenant.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center text-[10px] font-semibold text-violet-300">
                            {tenant.firstName[0]}{tenant.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white/80">{tenant.firstName} {tenant.lastName}</p>
                            <p className="text-[10px] text-white/35">{formatCurrency(tenant.monthlyRent + (tenant.charges ?? 0))}/mois</p>
                          </div>
                        </div>
                        <Badge className={active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 border text-[10px]'
                          : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20 border text-[10px]'
                        }>
                          {active ? t('status.active') : t('status.ended')}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(property.photos?.length ?? 0) > 0 && (
              <div className="pt-3 border-t border-white/[0.05]">
                <FileSection files={property.photos ?? []} onChange={() => {}} disabled />
              </div>
            )}
          </TabsContent>

          {/* ── Statistiques ── */}
          <TabsContent value="stats" className="mt-4 flex flex-col gap-4">
            {stats && (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 mb-2">
                    {t('properties.stats.ytd', { year })}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label={t('properties.stats.income')} value={formatCurrency(stats.ytdIncome)} color="emerald" />
                    <StatCard label={t('properties.stats.expense')} value={formatCurrency(stats.ytdExpense)} color="red" />
                    <StatCard color={stats.ytdNet >= 0 ? 'violet' : 'red'} label={t('properties.stats.net')} value={(stats.ytdNet >= 0 ? '+' : '') + formatCurrency(stats.ytdNet)} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 mb-2">{t('properties.stats.rents')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard
                      label={t('properties.stats.collectionRate')}
                      value={`${stats.collectionRate}%`}
                      color={stats.collectionRate >= 80 ? 'emerald' : 'amber'}
                      sub={t('properties.stats.collectionRateSub', { paid: stats.paidRents, total: stats.totalRents })}
                    />
                    <StatCard
                      label={t('properties.stats.pending')}
                      value={String(stats.pendingRents)}
                      color={stats.pendingRents > 0 ? 'amber' : 'emerald'}
                      sub={t('properties.stats.pendingSub')}
                    />
                    <StatCard
                      label={t('properties.stats.monthlyRevenue')}
                      value={formatCurrency(stats.monthlyRevenue)}
                      color="violet"
                      sub={t('properties.stats.monthlyRevenueSub')}
                    />
                  </div>
                </div>

                {stats.grossYield && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 mb-2">{t('properties.stats.grossYield')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <StatCard label={t('properties.stats.grossYield')} value={`${stats.grossYield}%`} color="violet" sub={t('properties.stats.grossYieldSub')} />
                      <StatCard label={t('properties.stats.annualRevenue')} value={formatCurrency(stats.monthlyRevenue * 12)} color="emerald" sub={t('properties.stats.annualRevenueSub')} />
                    </div>
                  </div>
                )}

                {stats.totalRents === 0 && stats.ytdIncome === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-white/20">
                    <BarChart3 className="w-8 h-8 mb-2" />
                    <p className="text-sm">{t('properties.stats.noData')}</p>
                    <p className="text-xs mt-1">{t('properties.stats.noDataSub')}</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/[0.05]">
          <span className="text-[10px] text-white/20">{t('common.addedOn', { date: formatDate(property.createdAt) })}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/[0.06]">
              {t('common.close')}
            </Button>
            <Button size="sm" onClick={() => { onClose(); onEdit(property) }} className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
              <Pencil className="w-3 h-3" />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
