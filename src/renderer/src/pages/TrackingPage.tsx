import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Wallet, Percent, Building2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import PageShell from '../components/PageShell'
import { useAccounting } from '@/hooks/useAccounting'
import { useRents } from '@/hooks/useRents'
import { useProperties } from '@/hooks/useProperties'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-white/35 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label, tooltipIncome, tooltipExpense }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
  tooltipIncome: string
  tooltipExpense: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name === 'income' ? tooltipIncome : tooltipExpense} :</span>
          <span className="text-white font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#84cc16']

export default function TrackingPage() {
  const { t, i18n } = useTranslation()
  const { data: entries = [] } = useAccounting()
  const { data: rents = [] } = useRents()
  const { data: properties = [] } = useProperties()

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonthKey = `${thisYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'

  const { ytdIncome, ytdExpense } = useMemo(() => {
    const yearEntries = entries.filter((e) => e.date.startsWith(String(thisYear)))
    return {
      ytdIncome: yearEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0),
      ytdExpense: yearEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
    }
  }, [entries, thisYear])

  const collectionRate = useMemo(() => {
    const monthRents = rents.filter((r) => r.dueDate.startsWith(thisMonthKey))
    if (monthRents.length === 0) return null
    const paid = monthRents.filter((r) => r.status === 'paid').length
    return Math.round((paid / monthRents.length) * 100)
  }, [rents, thisMonthKey])

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString(locale, { month: 'short' })
      const income = entries.filter((e) => e.type === 'income' && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0)
      const expense = entries.filter((e) => e.type === 'expense' && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0)
      return { label, income, expense }
    })
  }, [entries, locale])

  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    entries.filter((e) => e.type === 'income').forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))
  }, [entries])

  const propertyPerf = useMemo(() => {
    return properties.map((p) => {
      const inc = entries.filter((e) => e.propertyId === p.id && e.type === 'income').reduce((s, e) => s + e.amount, 0)
      const exp = entries.filter((e) => e.propertyId === p.id && e.type === 'expense').reduce((s, e) => s + e.amount, 0)
      return { property: p, income: inc, expense: exp, balance: inc - exp }
    }).sort((a, b) => b.balance - a.balance)
  }, [properties, entries])

  const hasData = entries.length > 0
  const monthRents = rents.filter((r) => r.dueDate.startsWith(thisMonthKey))
  const monthPaid = monthRents.filter((r) => r.status === 'paid').length

  return (
    <PageShell title={t('tracking.title')} subtitle={t('tracking.subtitle')} icon={TrendingUp}>
      <div className="flex flex-col gap-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label={t('tracking.ytdIncome', { year: thisYear })}
            value={formatCurrency(ytdIncome)}
            icon={TrendingUp}
            color="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            label={t('tracking.ytdExpense', { year: thisYear })}
            value={formatCurrency(ytdExpense)}
            icon={TrendingDown}
            color="bg-red-500/15 text-red-400"
          />
          <StatCard
            label={t('tracking.ytdNet', { year: thisYear })}
            value={(ytdIncome - ytdExpense >= 0 ? '+' : '') + formatCurrency(ytdIncome - ytdExpense)}
            icon={Wallet}
            color={ytdIncome - ytdExpense >= 0 ? 'bg-violet-500/15 text-violet-400' : 'bg-red-500/15 text-red-400'}
          />
          <StatCard
            label={t('tracking.collectionMonth')}
            value={collectionRate !== null ? `${collectionRate} %` : '—'}
            sub={collectionRate !== null
              ? t('tracking.collectionSub', { paid: monthPaid, total: monthRents.length })
              : t('tracking.noRentsMonth')}
            icon={Percent}
            color={collectionRate === 100 ? 'bg-emerald-500/15 text-emerald-400' : collectionRate !== null && collectionRate < 80 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}
          />
        </div>

        {/* Bar chart */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <p className="text-sm font-medium text-white/70 mb-4">{t('tracking.barChartTitle')}</p>
          {!hasData ? (
            <div className="flex items-center justify-center h-48 text-white/20 text-sm">{t('tracking.noAccountingData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip content={<ChartTooltip tooltipIncome={t('tracking.tooltipIncome')} tooltipExpense={t('tracking.tooltipExpense')} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="income" name="income" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Pie chart */}
          <div className="col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-sm font-medium text-white/70 mb-3">{t('tracking.pieChartTitle')}</p>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-white/20 text-sm">{t('tracking.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{v}</span>} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'white' }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-property table */}
          <div className="col-span-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-sm font-medium text-white/70 mb-3">{t('tracking.perfTitle')}</p>
            {propertyPerf.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-white/20 text-sm">{t('tracking.noProperties')}</div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-4 gap-2 px-2 pb-2 border-b border-white/[0.05]">
                  <span className="text-[10px] text-white/30 uppercase tracking-wide col-span-1">{t('tracking.columnProperty')}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wide text-right">{t('tracking.columnIncome')}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wide text-right">{t('tracking.columnExpense')}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wide text-right">{t('tracking.columnBalance')}</span>
                </div>
                {propertyPerf.map(({ property, income, expense, balance }) => (
                  <div key={property.id} className="grid grid-cols-4 gap-2 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-2 col-span-1 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3 h-3 text-white/25" />
                      </div>
                      <span className="text-sm text-white/70 truncate">{property.name}</span>
                    </div>
                    <span className="text-sm text-emerald-400 tabular-nums text-right self-center">{income > 0 ? formatCurrency(income) : '—'}</span>
                    <span className="text-sm text-red-400 tabular-nums text-right self-center">{expense > 0 ? formatCurrency(expense) : '—'}</span>
                    <span className={cn('text-sm font-medium tabular-nums text-right self-center', balance >= 0 ? 'text-violet-300' : 'text-red-400')}>
                      {income === 0 && expense === 0 ? '—' : (balance >= 0 ? '+' : '') + formatCurrency(balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
