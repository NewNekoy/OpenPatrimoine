import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { Resolver } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EntitySelect } from '@/components/shared/EntitySelect'
import { useCreateRent, useUpdateRent } from '@/hooks/useRents'
import { useTenants } from '@/hooks/useTenants'
import { useProperties } from '@/hooks/useProperties'
import type { RentPayment } from '@/types/entities'

const schema = z.object({
  tenantId: z.string().min(1, 'Requis'),
  propertyId: z.string().min(1, 'Requis'),
  amount: z.coerce.number().positive('Doit être > 0'),
  dueDate: z.string().min(1, 'Requis'),
  paidDate: z.string().optional(),
  status: z.enum(['pending', 'paid', 'late', 'partial']),
  notes: z.string().optional()
})

type FormValues = z.output<typeof schema>

interface RentFormDialogProps {
  open: boolean
  onClose: () => void
  rent?: RentPayment | null
  defaultTenantId?: string
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-white/60 text-xs">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

const inputCls = 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-violet-500/50'

export function RentFormDialog({ open, onClose, rent, defaultTenantId }: RentFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!rent
  const create = useCreateRent()
  const update = useUpdateRent()
  const { data: tenants = [] } = useTenants()
  const { data: properties = [] } = useProperties()
  const isPending = create.isPending || update.isPending

  const tenantOptions = tenants.map((tenant) => ({
    id: tenant.id,
    label: `${tenant.firstName} ${tenant.lastName}`,
    sublabel: properties.find((p) => p.id === tenant.propertyId)?.name
  }))
  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name, sublabel: p.city }))

  const statusOptions = [
    { value: 'pending', label: t('status.pending') },
    { value: 'paid', label: t('status.paid') },
    { value: 'late', label: t('status.late') },
    { value: 'partial', label: t('status.partial') },
  ]

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: {
        tenantId: defaultTenantId ?? '', propertyId: '', amount: undefined,
        dueDate: '', paidDate: '', status: 'pending', notes: ''
      }
    })

  const watchedTenantId = watch('tenantId')

  useEffect(() => {
    if (!watchedTenantId) return
    const tenant = tenants.find((t) => t.id === watchedTenantId)
    if (tenant) {
      setValue('propertyId', tenant.propertyId)
      if (!isEdit) setValue('amount', tenant.monthlyRent + (tenant.charges ?? 0))
    }
  }, [watchedTenantId, tenants, setValue, isEdit])

  useEffect(() => {
    if (!open) return
    reset(rent ? {
      tenantId: rent.tenantId, propertyId: rent.propertyId, amount: rent.amount,
      dueDate: rent.dueDate, paidDate: rent.paidDate ?? '', status: rent.status, notes: rent.notes ?? ''
    } : {
      tenantId: defaultTenantId ?? '', propertyId: '', amount: undefined,
      dueDate: '', paidDate: '', status: 'pending', notes: ''
    })
  }, [open, rent, defaultTenantId, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && rent) {
        await update.mutateAsync({ id: rent.id, data: values })
        toast.success(t('rents.form.updated'))
      } else {
        await create.mutateAsync(values)
        toast.success(t('rents.form.added'))
      }
      onClose()
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            {isEdit ? t('rents.form.titleEdit') : t('rents.form.titleAdd')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex flex-col gap-4">
          <Field label={t('rents.form.tenant')} error={errors.tenantId?.message}>
            <Controller name="tenantId" control={control} render={({ field }) => (
              <EntitySelect options={tenantOptions} value={field.value} onValueChange={field.onChange} placeholder={t('rents.form.tenantPh')} />
            )} />
          </Field>

          <Field label={t('rents.form.property')} error={errors.propertyId?.message}>
            <Controller name="propertyId" control={control} render={({ field }) => (
              <EntitySelect options={propertyOptions} value={field.value} onValueChange={field.onChange} placeholder={t('rents.form.propertyPh')} />
            )} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('rents.form.amount')} error={errors.amount?.message}>
              <Input {...register('amount')} type="number" placeholder="800" className={inputCls} />
            </Field>
            <Field label={t('rents.form.status')} error={errors.status?.message}>
              <Controller name="status" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white focus:ring-violet-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c28] border-white/[0.08] text-white">
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="focus:bg-violet-500/20 focus:text-white">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('rents.form.dueDate')} error={errors.dueDate?.message}>
              <Input {...register('dueDate')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
            <Field label={t('rents.form.paidDate')} error={errors.paidDate?.message}>
              <Input {...register('paidDate')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
          </div>

          <Field label={t('rents.form.notes')} error={errors.notes?.message}>
            <Textarea {...register('notes')} placeholder={t('rents.form.notesPh')} rows={2} className={`${inputCls} resize-none`} />
          </Field>

          <DialogFooter className="mt-2 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/[0.06]">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30">
              {isPending ? t('common.saving') : isEdit ? t('common.update') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
