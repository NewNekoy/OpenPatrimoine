import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Plus, Eye, Pencil, Trash2, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import PageShell from '@/components/PageShell'
import { PropertyFormDialog } from '@/components/properties/PropertyFormDialog'
import { PropertyDetailDialog } from '@/components/properties/PropertyDetailDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProperties, useDeleteProperty } from '@/hooks/useProperties'
import { useTenants, useDeleteTenant } from '@/hooks/useTenants'
import { useRents, useDeleteRent } from '@/hooks/useRents'
import { EmptyState } from '@/components/shared/EmptyState'
import { getPropertyTypeColor } from '@/lib/propertyTypes'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types/entities'
import type { PropertyType } from '@/lib/propertyTypes'


export default function PropertiesPage() {
  const { t } = useTranslation()
  const { data: properties = [], isLoading } = useProperties()
  const { data: allTenants = [] } = useTenants()
  const { data: allRents = [] } = useRents()
  const deleteProperty = useDeleteProperty()
  const deleteTenant = useDeleteTenant()
  const deleteRent = useDeleteRent()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const [viewing, setViewing] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState<Property | null>(null)

  const handleAdd = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (p: Property) => { setEditing(p); setFormOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      const propertyTenants = allTenants.filter((t) => t.propertyId === deleting.id)
      for (const tenant of propertyTenants) {
        const tenantRents = allRents.filter((r) => r.tenantId === tenant.id)
        for (const rent of tenantRents) await deleteRent.mutateAsync(rent.id)
        await deleteTenant.mutateAsync(tenant.id)
      }
      const orphanRents = allRents.filter((r) => r.propertyId === deleting.id && !propertyTenants.find((t) => t.id === r.tenantId))
      for (const rent of orphanRents) await deleteRent.mutateAsync(rent.id)
      await deleteProperty.mutateAsync(deleting.id)
      toast.success(`"${deleting.name}" supprimée`)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setDeleting(null)
    }
  }

  const subtitle = properties.length === 1
    ? t('properties.subtitleOne', { count: properties.length })
    : t('properties.subtitleMany', { count: properties.length })

  return (
    <>
      <PageShell
        title={t('properties.title')}
        subtitle={subtitle}
        icon={Building2}
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
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t('properties.empty.title')}
            subtitle={t('properties.empty.subtitle')}
            actionLabel={t('properties.add')}
            onAction={handleAdd}
          />
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs font-medium w-[240px]">{t('properties.columns.name')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('common.notes')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium">{t('properties.columns.type')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-right">{t('properties.columns.surface')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-center">{t('properties.columns.tenants')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-right">{t('properties.form.purchasePrice')}</TableHead>
                  <TableHead className="text-white/40 text-xs font-medium text-right w-[100px]">{t('properties.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p, i) => {
                  const tenants = allTenants.filter((t) => t.propertyId === p.id)
                  const active = tenants.filter((t) => !t.leaseEnd || new Date(t.leaseEnd) > new Date())
                  return (
                    <TableRow key={p.id} className={`border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-white/30" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white/85 truncate max-w-[160px]">{p.name}</p>
                            {(p.photos?.length ?? 0) > 0 && (
                              <p className="text-[10px] text-white/30">{p.photos!.length} photo{p.photos!.length > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-white/50 text-sm">
                          <MapPin className="w-3 h-3 text-white/25 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{p.address}, {p.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPropertyTypeColor(p.type)} border text-[11px] font-medium px-2 py-0.5`}>
                          {t(`properties.types.${p.type as PropertyType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-white/60 tabular-nums">{p.surface} m²</TableCell>
                      <TableCell className="text-center">
                        {tenants.length > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Users className="w-3 h-3 text-white/30" />
                            <span className="text-sm text-white/60">{active.length}/{tenants.length}</span>
                          </div>
                        ) : <span className="text-white/25 text-sm">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm text-white/60 tabular-nums">
                        {p.purchasePrice ? formatCurrency(p.purchasePrice) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => setViewing(p)} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors" title={t('common.edit')}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEdit(p)} className="p-1.5 rounded-md text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors" title={t('common.edit')}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleting(p)} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" title={t('common.delete')}>
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

      <PropertyFormDialog open={formOpen} onClose={() => setFormOpen(false)} property={editing} />
      <PropertyDetailDialog property={viewing} open={!!viewing} onClose={() => setViewing(null)} onEdit={(p) => { setViewing(null); handleEdit(p) }} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={t('properties.delete.title')}
        description={(() => {
          if (!deleting) return ''
          const tc = allTenants.filter((t) => t.propertyId === deleting.id).length
          const rc = allRents.filter((r) => r.propertyId === deleting.id).length
          const tenantsStr = tc > 0 ? (tc === 1 ? t('properties.delete.tenantsOne', { count: tc }) : t('properties.delete.tenantsMany', { count: tc })) : ''
          const rentsStr = rc > 0 ? (rc === 1 ? t('properties.delete.rentsOne', { count: rc }) : t('properties.delete.rentsMany', { count: rc })) : ''
          return (
            <>
              <span className="text-white/70 font-medium">{deleting.name}</span>
              {tc > 0 ? <> — {t('properties.delete.alsoDeletes', { tenants: tenantsStr, rents: rentsStr })}</> : '.'}
            </>
          )
        })()}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
