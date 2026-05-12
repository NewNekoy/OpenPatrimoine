import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import PageShell from '@/components/PageShell'
import { AccountingFormDialog } from '@/components/accounting/AccountingFormDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AccountingTypeBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccounting, useDeleteAccountingEntry } from '@/hooks/useAccounting'
import { useProperties } from '@/hooks/useProperties'
import { EmptyState } from '@/components/shared/EmptyState'
import { accountingService } from '@/services/accounting.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AccountingEntry } from '@/types/entities'

type Filter = 'all' | 'income' | 'expense'

function SummaryFooter({ entries }: { entries: AccountingEntry[] }) {
  const { t } = useTranslation()
  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="flex items-stretch gap-px rounded-xl overflow-hidden border border-white/[0.06]">
      <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-white/[0.02]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wide">{t('accounting.summary.income')}</p>
          <p className="text-base font-semibold text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
      </div>
      <div className="w-px bg-white/[0.06]" />
      <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-white/[0.02]">
        <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wide">{t('accounting.summary.expense')}</p>
          <p className="text-base font-semibold text-red-400 tabular-nums">{formatCurrency(totalExpense)}</p>
        </div>
      </div>
      <div className="w-px bg-white/[0.06]" />
      <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-white/[0.02]">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', balance >= 0 ? 'bg-violet-500/15' : 'bg-red-500/15')}>
          <Wallet className={cn('w-4 h-4', balance >= 0 ? 'text-violet-400' : 'text-red-400')} />
        </div>
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wide">{t('accounting.summary.balance')}</p>
          <p className={cn('text-base font-semibold tabular-nums', balance >= 0 ? 'text-violet-300' : 'text-red-400')}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </p>
        </div>
      </div>
    </div>
  )
}


export default function AccountingPage() {
  const { t } = useTranslation()
  const { data: entries = [], isLoading } = useAccounting()
  const { data: properties = [] } = useProperties()
  const deleteEntry = useDeleteAccountingEntry()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AccountingEntry | null>(null)
  const [deleting, setDeleting] = useState<AccountingEntry | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [isExporting, setIsExporting] = useState(false)

  const handleAdd = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (e: AccountingEntry) => { setEditing(e); setFormOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      await deleteEntry.mutateAsync(deleting.id)
      toast.success(t('accounting.delete.success'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setDeleting(null)
    }
  }

  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries])
  const filtered = filter === 'all' ? sorted : sorted.filter((e) => e.type === filter)

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const rows = filtered.map((e) => ({
        date: e.date,
        type: e.type === 'income' ? t('status.income') : t('status.expense'),
        category: e.category,
        description: e.description,
        property: properties.find((p) => p.id === e.propertyId)?.name ?? 'Général',
        amount: e.amount
      }))
      const ok = await accountingService.exportCsv(rows)
      if (ok) toast.success(t('accounting.csvSuccess'))
    } catch {
      toast.error(t('accounting.csvError'))
    } finally {
      setIsExporting(false)
    }
  }

  const subtitle = entries.length === 1
    ? t('accounting.subtitleOne', { count: entries.length })
    : t('accounting.subtitleMany', { count: entries.length })

  return (
    <>
      <PageShell
        title={t('accounting.title')}
        subtitle={subtitle}
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Button onClick={handleExportCsv} disabled={isExporting} variant="outline" size="sm" className="border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.07] gap-1.5 h-8 text-xs">
                <FileDown className="w-3.5 h-3.5" />
                {isExporting ? t('accounting.csvExporting') : t('accounting.csv')}
              </Button>
            )}
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
        ) : entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('accounting.empty.title')}
            subtitle={t('accounting.empty.subtitle')}
            actionLabel={t('accounting.empty.action')}
            onAction={handleAdd}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SummaryFooter entries={entries} />

            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="bg-white/[0.04] border border-white/[0.06] h-8">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/40">
                  {t('accounting.filter.all', { count: entries.length })}
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-white/40">
                  {t('accounting.filter.income', { count: entries.filter(e => e.type === 'income').length })}
                </TabsTrigger>
                <TabsTrigger value="expense" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/40">
                  {t('accounting.filter.expense', { count: entries.filter(e => e.type === 'expense').length })}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-white/40 text-xs font-medium">{t('accounting.columns.date')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('accounting.columns.type')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('accounting.columns.category')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('accounting.columns.description')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium">{t('accounting.columns.property')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium text-right">{t('accounting.columns.amount')}</TableHead>
                    <TableHead className="text-white/40 text-xs font-medium text-right w-[80px]">{t('accounting.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e, i) => {
                    const property = properties.find((p) => p.id === e.propertyId)
                    return (
                      <TableRow key={e.id} className={`border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                        <TableCell className="text-sm text-white/60 whitespace-nowrap">{formatDate(e.date)}</TableCell>
                        <TableCell><AccountingTypeBadge type={e.type} /></TableCell>
                        <TableCell className="text-sm text-white/70">{e.category}</TableCell>
                        <TableCell className="text-sm text-white/50 truncate max-w-[180px]">{e.description}</TableCell>
                        <TableCell className="text-sm text-white/40 truncate max-w-[100px]">{property?.name ?? '—'}</TableCell>
                        <TableCell className={cn('text-right text-sm font-semibold tabular-nums', e.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                          {e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => handleEdit(e)} className="p-1.5 rounded-md text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleting(e)} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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

      <AccountingFormDialog open={formOpen} onClose={() => setFormOpen(false)} entry={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={t('accounting.delete.title')}
        description={t('accounting.delete.description')}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
