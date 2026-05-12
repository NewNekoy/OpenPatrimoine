import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, Plus, Pencil, Trash2, CheckCircle2, CalendarClock, FileDown, Bell } from 'lucide-react'
import { toast } from 'sonner'
import PageShell from '@/components/PageShell'
import { RentFormDialog } from '@/components/rents/RentFormDialog'
import { ReminderDialog } from '@/components/rents/ReminderDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RentStatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRents, useDeleteRent, useUpdateRent, useCreateRent } from '@/hooks/useRents'
import { useTenants } from '@/hooks/useTenants'
import { useProperties } from '@/hooks/useProperties'
import { useCreateAccountingEntry } from '@/hooks/useAccounting'
import { useSettings } from '@/hooks/useSettings'
import { EmptyState } from '@/components/shared/EmptyState'
import { settingsService } from '@/services/settings.service'
import { buildReceiptHtml } from '@/lib/receipt'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RentPayment } from '@/types/entities'
import i18n from '@/i18n'

type Filter = 'all' | 'pending' | 'paid' | 'late'


export default function RentsPage() {
  const { t } = useTranslation()
  const { data: rents = [], isLoading } = useRents()
  const { data: tenants = [] } = useTenants()
  const { data: properties = [] } = useProperties()
  const { data: settings } = useSettings()
  const deleteRent = useDeleteRent()
  const updateRent = useUpdateRent()
  const createRent = useCreateRent()
  const createAccounting = useCreateAccountingEntry()

  const [formOpen, setFormOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editing, setEditing] = useState<RentPayment | null>(null)
  const [deleting, setDeleting] = useState<RentPayment | null>(null)
  const [reminding, setReminding] = useState<RentPayment | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const handleAdd = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (r: RentPayment) => { setEditing(r); setFormOpen(true) }

  const handleMarkPaid = async (r: RentPayment) => {
    try {
      const paidDate = new Date().toISOString().split('T')[0]
      await updateRent.mutateAsync({ id: r.id, data: { status: 'paid', paidDate } })
      const tenant = tenants.find((t) => t.id === r.tenantId)
      const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire inconnu'
      await createAccounting.mutateAsync({
        type: 'income',
        category: 'Loyer',
        amount: r.amount,
        date: paidDate,
        propertyId: r.propertyId,
        description: `Loyer — ${tenantName} (échéance ${formatDate(r.dueDate)})`
      })
      toast.success(t('rents.actions.markPaidSuccess'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleGenerateMonth = async () => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dueDate = `${monthKey}-01`
    const activeTenants = tenants.filter((t) => {
      if (new Date(t.leaseStart) > now) return false
      if (t.leaseEnd && new Date(t.leaseEnd) < now) return false
      return true
    })
    const toCreate = activeTenants.filter((t) =>
      !rents.some((r) => r.tenantId === t.id && r.dueDate.startsWith(monthKey))
    )
    if (toCreate.length === 0) {
      toast.info(t('rents.alreadyGenerated'))
      return
    }
    setIsGenerating(true)
    try {
      for (const tenant of toCreate) {
        await createRent.mutateAsync({
          tenantId: tenant.id,
          propertyId: tenant.propertyId,
          amount: tenant.monthlyRent + (tenant.charges ?? 0),
          dueDate,
          status: 'pending'
        })
      }
      const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
      const monthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
      const msg = toCreate.length === 1
        ? t('rents.generatedOne', { count: toCreate.length, month: monthLabel })
        : t('rents.generatedMany', { count: toCreate.length, month: monthLabel })
      toast.success(msg)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReceipt = async (r: RentPayment) => {
    const tenant = tenants.find((t) => t.id === r.tenantId)
    const property = properties.find((p) => p.id === r.propertyId)
    if (!tenant || !property) { toast.error(t('common.error')); return }
    if (!settings?.ownerName) { toast.error(t('rents.actions.receiptMissingInfo')); return }
    try {
      const html = buildReceiptHtml(settings, tenant, property, r)
      const result = await settingsService.generatePdf(html)
      if (!result.success) toast.error(result.error ?? t('rents.actions.receiptError'))
    } catch {
      toast.error(t('rents.actions.receiptError'))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      await deleteRent.mutateAsync(deleting.id)
      toast.success(t('rents.delete.success'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = filter === 'all' ? rents
    : filter === 'late' ? rents.filter((r) => r.status === 'late' || r.status === 'pending')
    : rents.filter((r) => r.status === filter)

  const pending = rents.filter((r) => r.status === 'pending' || r.status === 'late').length

  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const currentMonth = new Date().toLocaleDateString(locale, { month: 'long' })

  const subtitle = rents.length === 1
    ? t('rents.subtitleOne', { count: rents.length, pending })
    : t('rents.subtitleMany', { count: rents.length, pending })

  return (
    <>
      <PageShell
        title={t('rents.title')}
        subtitle={subtitle}
        icon={Banknote}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateMonth} disabled={isGenerating} variant="outline" size="sm" className="border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.07] gap-1.5 h-8 text-xs">
              <CalendarClock className="w-3.5 h-3.5" />
              {isGenerating ? t('rents.generating') : t('rents.generate', { month: currentMonth })}
            </Button>
            <Button onClick={handleAdd} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 shadow-lg shadow-violet-900/30 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" />
              {t('common.add')}
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : rents.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={t('rents.empty.title')}
            subtitle={t('rents.empty.subtitle')}
            actionLabel={t('rents.empty.action')}
            onAction={handleAdd}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="bg-white/[0.04] border border-white/[0.06] h-8">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
                  {t('rents.filter.all', { count: rents.length })}
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white text-white/40">
                  {t('rents.filter.pending', { count: rents.filter(r => r.status === 'pending').length })}
                </TabsTrigger>
                <TabsTrigger value="late" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/40">
                  {t('rents.filter.late', { count: rents.filter(r => r.status === 'late').length })}
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-white/40">
                  {t('rents.filter.paid', { count: rents.filter(r => r.status === 'paid').length })}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-white/40 text-xs font-medium">{t('rents.columns.tenant')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('rents.columns.property')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium text-right">{t('rents.columns.amount')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('rents.columns.dueDate')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('rents.columns.paidDate')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('rents.columns.status')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium text-right w-[110px]">{t('rents.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => {
                    const tenant = tenants.find((t) => t.id === r.tenantId)
                    const property = properties.find((p) => p.id === r.propertyId)
                    return (
                      <TableRow key={r.id} className={`border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                        <TableCell>
                          {tenant ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center text-[9px] font-semibold text-violet-300 flex-shrink-0">
                                {tenant.firstName[0]}{tenant.lastName[0]}
                              </div>
                              <span className="text-sm text-white/80">{tenant.firstName} {tenant.lastName}</span>
                            </div>
                          ) : <span className="text-white/30 text-sm">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-white/60 truncate max-w-[120px]">
                          {property?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-white/80 tabular-nums">
                          {formatCurrency(r.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-white/60">{formatDate(r.dueDate)}</TableCell>
                        <TableCell className="text-sm text-white/50">{formatDate(r.paidDate)}</TableCell>
                        <TableCell><RentStatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {(r.status === 'pending' || r.status === 'late') && (
                              <>
                                <button onClick={() => handleMarkPaid(r)} className="p-1.5 rounded-md text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title={t('rents.actions.markPaid')}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setReminding(r)} className="p-1.5 rounded-md text-white/30 hover:text-orange-400 hover:bg-orange-500/10 transition-colors" title={t('rents.actions.remind')}>
                                  <Bell className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {r.status === 'paid' && (
                              <button onClick={() => handleReceipt(r)} className="p-1.5 rounded-md text-white/30 hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title={t('rents.actions.receipt')}>
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleEdit(r)} className="p-1.5 rounded-md text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleting(r)} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </PageShell>

      <RentFormDialog open={formOpen} onClose={() => setFormOpen(false)} rent={editing} />
      <ReminderDialog
        open={!!reminding}
        onClose={() => setReminding(null)}
        rent={reminding}
        tenant={tenants.find((t) => t.id === reminding?.tenantId)}
        property={properties.find((p) => p.id === reminding?.propertyId)}
        owner={settings}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={t('rents.delete.title')}
        description={t('rents.delete.description')}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
