import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Eye, Pencil, Trash2, Home, Mail } from 'lucide-react'
import { toast } from 'sonner'
import PageShell from '@/components/PageShell'
import { TenantFormDialog } from '@/components/tenants/TenantFormDialog'
import { TenantDetailDialog } from '@/components/tenants/TenantDetailDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTenants, useDeleteTenant } from '@/hooks/useTenants'
import { useProperties } from '@/hooks/useProperties'
import { useRents, useDeleteRent } from '@/hooks/useRents'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Tenant } from '@/types/entities'

export default function TenantsPage() {
  const { t } = useTranslation()
  const { data: tenants = [], isLoading } = useTenants()
  const { data: properties = [] } = useProperties()
  const { data: allRents = [] } = useRents()
  const deleteTenant = useDeleteTenant()
  const deleteRent = useDeleteRent()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [viewing, setViewing] = useState<Tenant | null>(null)
  const [deleting, setDeleting] = useState<Tenant | null>(null)

  const handleAdd = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (t: Tenant) => { setEditing(t); setFormOpen(true) }
  const isActive = (t: Tenant) => !t.leaseEnd || new Date(t.leaseEnd) > new Date()

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      const tenantRents = allRents.filter((r) => r.tenantId === deleting.id)
      for (const rent of tenantRents) await deleteRent.mutateAsync(rent.id)
      await deleteTenant.mutateAsync(deleting.id)
      toast.success(`"${deleting.firstName} ${deleting.lastName}" supprimé`)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setDeleting(null)
    }
  }

  const activeTenants = tenants.filter(isActive).length
  const subtitle = tenants.length === 1
    ? t('tenants.subtitleOne', { count: tenants.length })
    : t('tenants.subtitleMany', { count: tenants.length })

  return (
    <>
      <PageShell
        title={t('tenants.title')}
        subtitle={subtitle}
        icon={Users}
        actions={
          <Button onClick={handleAdd} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 shadow-lg shadow-violet-900/30 h-8 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {t('common.add')}
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('tenants.empty.title')}
            subtitle={t('tenants.empty.subtitle')}
            actionLabel={t('tenants.add')}
            onAction={handleAdd}
          />
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs font-medium">{t('tenants.columns.tenant')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('tenants.form.email')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('tenants.columns.property')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('tenants.columns.lease')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-right">{t('tenants.columns.rent')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('tenants.columns.status')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-right w-[100px]">{t('tenants.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant, i) => {
                  const property = properties.find((p) => p.id === tenant.propertyId)
                  const active = isActive(tenant)
                  return (
                    <TableRow key={tenant.id} className={`border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-violet-300">
                            {tenant.firstName[0]}{tenant.lastName[0]}
                          </div>
                          <span className="text-sm font-medium text-white/85">{tenant.firstName} {tenant.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Mail className="w-3 h-3 text-white/25 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{tenant.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {property ? (
                          <div className="flex items-center gap-1.5 text-white/60 text-sm">
                            <Home className="w-3 h-3 text-white/30 flex-shrink-0" />
                            <span className="truncate max-w-[130px]">{property.name}</span>
                          </div>
                        ) : <span className="text-white/25 text-sm">—</span>}
                      </TableCell>
                      <TableCell className="text-white/50 text-xs">
                        <div>{formatDate(tenant.leaseStart)}</div>
                        {tenant.leaseEnd && <div className="text-white/30">{formatDate(tenant.leaseEnd)}</div>}
                      </TableCell>
                      <TableCell className="text-right text-sm text-white/70 tabular-nums font-medium">
                        {formatCurrency(tenant.monthlyRent + (tenant.charges ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge className={active
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 border text-[10px]'
                          : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20 border text-[10px]'
                        }>
                          {active ? t('status.active') : t('status.ended')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => setViewing(tenant)} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEdit(tenant)} className="p-1.5 rounded-md text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleting(tenant)} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
        )}
      </PageShell>

      <TenantFormDialog open={formOpen} onClose={() => setFormOpen(false)} tenant={editing} />
      <TenantDetailDialog tenant={viewing} open={!!viewing} onClose={() => setViewing(null)} onEdit={(t) => { setViewing(null); handleEdit(t) }} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={t('tenants.delete.title')}
        description={(() => {
          if (!deleting) return ''
          const rc = allRents.filter((r) => r.tenantId === deleting.id).length
          const rentsStr = rc > 0 ? (rc === 1 ? t('tenants.delete.rentsOne', { count: rc }) : t('tenants.delete.rentsMany', { count: rc })) : ''
          return (
            <>
              <span className="text-white/70 font-medium">{deleting.firstName} {deleting.lastName}</span>
              {rc > 0 ? <> — {t('tenants.delete.alsoDeletes', { rents: rentsStr })}</> : '.'}
            </>
          )
        })()}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
