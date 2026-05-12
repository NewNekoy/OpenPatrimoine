import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RentPayment } from '@/types/entities'

type RentStatus = RentPayment['status']

const RENT_STATUS_CLS: Record<RentStatus, string> = {
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  late: 'bg-red-500/15 text-red-300 border-red-500/20',
  partial: 'bg-blue-500/15 text-blue-300 border-blue-500/20'
}

const ACCOUNTING_TYPE_CLS = {
  income: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  expense: 'bg-red-500/15 text-red-300 border-red-500/20'
}

interface RentStatusBadgeProps {
  status: RentStatus
  className?: string
}

export function RentStatusBadge({ status, className }: RentStatusBadgeProps) {
  const { t } = useTranslation()
  const labels: Record<RentStatus, string> = {
    paid: t('status.paid'),
    pending: t('status.pending'),
    late: t('status.late'),
    partial: t('status.partial'),
  }
  return (
    <Badge className={cn('border text-[11px] font-medium px-2 py-0.5', RENT_STATUS_CLS[status], className)}>
      {labels[status]}
    </Badge>
  )
}

interface AccountingTypeBadgeProps {
  type: 'income' | 'expense'
  className?: string
}

export function AccountingTypeBadge({ type, className }: AccountingTypeBadgeProps) {
  const { t } = useTranslation()
  const label = type === 'income' ? t('status.income') : t('status.expense')
  return (
    <Badge className={cn('border text-[11px] font-medium px-2 py-0.5', ACCOUNTING_TYPE_CLS[type], className)}>
      {label}
    </Badge>
  )
}
