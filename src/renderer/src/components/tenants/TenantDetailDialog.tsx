import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Home, CheckCircle2, Clock, XCircle, AlertTriangle, FolderOpen } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useProperties } from '@/hooks/useProperties'
import { useRents } from '@/hooks/useRents'
import { FileSection } from '@/components/shared/FileSection'
import { cn } from '@/lib/utils'
import i18n from '@/i18n'
import type { Tenant, RentPayment } from '@/types/entities'

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  )
}

interface TenantDetailDialogProps {
  tenant: Tenant | null
  open: boolean
  onClose: () => void
  onEdit: (t: Tenant) => void
}

export function TenantDetailDialog({ tenant, open, onClose, onEdit }: TenantDetailDialogProps) {
  const { t } = useTranslation()
  const { data: properties = [] } = useProperties()
  const { data: allRents = [] } = useRents()

  if (!tenant) return null

  const property = properties.find((p) => p.id === tenant.propertyId)
  const isActive = !tenant.leaseEnd || new Date(tenant.leaseEnd) > new Date()
  const totalRent = tenant.monthlyRent + (tenant.charges ?? 0)
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'

  const tenantRents = allRents
    .filter((r) => r.tenantId === tenant.id)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  const totalPaid = tenantRents.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0)
  const totalUnpaid = tenantRents.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.amount, 0)

  const STATUS_CONFIG: Record<RentPayment['status'], { label: string; icon: React.ElementType; cls: string }> = {
    paid:    { label: t('status.paid'),    icon: CheckCircle2,  cls: 'text-emerald-400' },
    pending: { label: t('status.pending'), icon: Clock,         cls: 'text-amber-400'  },
    late:    { label: t('status.late'),    icon: AlertTriangle, cls: 'text-red-400'    },
    partial: { label: t('status.partial'), icon: XCircle,       cls: 'text-orange-400' },
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold text-white">
                {tenant.firstName} {tenant.lastName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 border text-[10px]'
                  : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20 border text-[10px]'
                }>
                  {isActive ? t('status.active') : t('status.inactive')}
                </Badge>
                {property && (
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    {property.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="infos" className="mt-2">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] h-8 w-full">
            <TabsTrigger value="infos" className="flex-1 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
              {t('tenants.detail.tabInfo')}
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex-1 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
              {t('tenants.detail.tabHistory')}{tenantRents.length > 0 ? ` (${tenantRents.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
              {t('tenants.detail.tabDocuments')}{(tenant.documents?.length ?? 0) > 0 ? ` (${tenant.documents!.length})` : ''}
            </TabsTrigger>
          </TabsList>

          {/* ── Infos ── */}
          <TabsContent value="infos" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label={t('tenants.detail.email')} value={tenant.email} />
              <DetailRow label={t('tenants.detail.phone')} value={tenant.phone} />
              <DetailRow label={t('tenants.detail.leaseStart')} value={formatDate(tenant.leaseStart)} />
              <DetailRow label={t('tenants.detail.leaseEnd')} value={formatDate(tenant.leaseEnd)} />
              <DetailRow label={t('tenants.detail.monthlyRent')} value={formatCurrency(tenant.monthlyRent)} />
              <DetailRow label={t('tenants.detail.charges')} value={tenant.charges ? formatCurrency(tenant.charges) : undefined} />
              <DetailRow label={t('tenants.detail.totalMonthly')} value={formatCurrency(totalRent)} />
              <DetailRow label={t('tenants.detail.deposit')} value={tenant.deposit ? formatCurrency(tenant.deposit) : undefined} />
            </div>

            {tenant.notes && (
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/30 mb-1">{t('common.notes')}</p>
                <p className="text-sm text-white/70 leading-relaxed">{tenant.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* ── Historique ── */}
          <TabsContent value="historique" className="mt-4 flex flex-col gap-3">
            {tenantRents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-sm">{t('tenants.detail.noPayments')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                    <span className="text-[10px] text-emerald-400/60 uppercase tracking-wide">{t('tenants.detail.totalPaid')}</span>
                    <span className="text-sm font-semibold text-emerald-400 tabular-nums">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/15">
                    <span className="text-[10px] text-red-400/60 uppercase tracking-wide">{t('tenants.detail.totalUnpaid')}</span>
                    <span className="text-sm font-semibold text-red-400 tabular-nums">{formatCurrency(totalUnpaid)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {tenantRents.map((r) => {
                    const cfg = STATUS_CONFIG[r.status]
                    const Icon = cfg.icon
                    return (
                      <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn('w-3.5 h-3.5 shrink-0', cfg.cls)} />
                          <div>
                            <p className="text-xs font-medium text-white/75">
                              {new Date(r.dueDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                            </p>
                            {r.paidDate && (
                              <p className="text-[10px] text-white/30">{t('tenants.detail.paidOn', { date: formatDate(r.paidDate) })}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={cn('text-xs font-medium tabular-nums', cfg.cls)}>
                            {formatCurrency(r.amount)}
                          </span>
                          <span className={cn('text-[10px]', cfg.cls + '/60')}>{cfg.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Documents ── */}
          <TabsContent value="documents" className="mt-4">
            {(tenant.documents?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <FolderOpen className="w-8 h-8 mb-2" />
                <p className="text-sm">{t('tenants.detail.noDocuments')}</p>
                <p className="text-xs mt-1">{t('tenants.detail.noDocumentsSub')}</p>
              </div>
            ) : (
              <FileSection files={tenant.documents ?? []} onChange={() => {}} disabled label="" />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-3 mt-1 border-t border-white/[0.05]">
          <span className="text-[10px] text-white/20">{t('common.addedOn', { date: formatDate(tenant.createdAt) })}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/[0.06]">
              {t('common.close')}
            </Button>
            <Button size="sm" onClick={() => { onClose(); onEdit(tenant) }} className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
              <Pencil className="w-3 h-3" />
              {t('common.edit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
