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
import { EntitySelect } from '@/components/shared/EntitySelect'
import { FileSection } from '@/components/shared/FileSection'
import { useCreateTenant, useUpdateTenant } from '@/hooks/useTenants'
import { useProperties } from '@/hooks/useProperties'
import type { Tenant } from '@/types/entities'

const toNum = (v: unknown) => (!v && v !== 0 ? undefined : Number(v))

const schema = z.object({
  firstName: z.string().min(1, 'Requis'),
  lastName: z.string().min(1, 'Requis'),
  email: z.string().email('Email invalide').or(z.literal('')),
  phone: z.string().optional(),
  propertyId: z.string().min(1, 'Requis'),
  leaseStart: z.string().min(1, 'Requis'),
  leaseEnd: z.string().optional(),
  monthlyRent: z.coerce.number().positive('Doit être > 0'),
  charges: z.preprocess(toNum, z.number().min(0).optional()),
  deposit: z.preprocess(toNum, z.number().min(0).optional()),
  notes: z.string().optional(),
  documents: z.array(z.string()).default([])
})

type FormValues = z.output<typeof schema>

interface TenantFormDialogProps {
  open: boolean
  onClose: () => void
  tenant?: Tenant | null
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

export function TenantFormDialog({ open, onClose, tenant }: TenantFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!tenant
  const create = useCreateTenant()
  const update = useUpdateTenant()
  const { data: properties = [] } = useProperties()
  const isPending = create.isPending || update.isPending

  const propertyOptions = properties.map((p) => ({
    id: p.id,
    label: p.name,
    sublabel: `${p.address}, ${p.city}`
  }))

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: {
        firstName: '', lastName: '', email: '', phone: '', propertyId: '',
        leaseStart: '', leaseEnd: '', monthlyRent: undefined, charges: undefined,
        deposit: undefined, notes: '', documents: []
      }
    })

  const documents = watch('documents')

  useEffect(() => {
    if (!open) return
    reset(tenant ? {
      firstName: tenant.firstName, lastName: tenant.lastName,
      email: tenant.email, phone: tenant.phone ?? '',
      propertyId: tenant.propertyId, leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd ?? '', monthlyRent: tenant.monthlyRent,
      charges: tenant.charges, deposit: tenant.deposit,
      notes: tenant.notes ?? '', documents: tenant.documents ?? []
    } : {
      firstName: '', lastName: '', email: '', phone: '', propertyId: '',
      leaseStart: '', leaseEnd: '', monthlyRent: undefined, charges: undefined,
      deposit: undefined, notes: '', documents: []
    })
  }, [open, tenant, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && tenant) {
        await update.mutateAsync({ id: tenant.id, data: values })
        toast.success(t('tenants.form.updated'))
      } else {
        await create.mutateAsync(values)
        toast.success(t('tenants.form.added'))
      }
      onClose()
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            {isEdit ? t('tenants.form.titleEdit') : t('tenants.form.titleAdd')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('tenants.form.firstName')} error={errors.firstName?.message}>
              <Input {...register('firstName')} placeholder={t('tenants.form.firstNamePh')} className={inputCls} />
            </Field>
            <Field label={t('tenants.form.lastName')} error={errors.lastName?.message}>
              <Input {...register('lastName')} placeholder={t('tenants.form.lastNamePh')} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('tenants.form.email')} error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder={t('tenants.form.emailPh')} className={inputCls} />
            </Field>
            <Field label={t('tenants.form.phone')} error={errors.phone?.message}>
              <Input {...register('phone')} placeholder={t('tenants.form.phonePh')} className={inputCls} />
            </Field>
          </div>

          <Field label={t('tenants.form.property')} error={errors.propertyId?.message}>
            <Controller
              name="propertyId"
              control={control}
              render={({ field }) => (
                <EntitySelect
                  options={propertyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('tenants.form.propertyPh')}
                />
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('tenants.form.leaseStart')} error={errors.leaseStart?.message}>
              <Input {...register('leaseStart')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
            <Field label={t('tenants.form.leaseEnd')} error={errors.leaseEnd?.message}>
              <Input {...register('leaseEnd')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t('tenants.form.monthlyRent')} error={errors.monthlyRent?.message}>
              <Input {...register('monthlyRent')} type="number" placeholder="800" className={inputCls} />
            </Field>
            <Field label={t('tenants.form.charges')} error={errors.charges?.message}>
              <Input {...register('charges')} type="number" placeholder="50" className={inputCls} />
            </Field>
            <Field label={t('tenants.form.deposit')} error={errors.deposit?.message}>
              <Input {...register('deposit')} type="number" placeholder="1600" className={inputCls} />
            </Field>
          </div>

          <Field label={t('tenants.form.notes')} error={errors.notes?.message}>
            <Textarea {...register('notes')} placeholder={t('tenants.form.notesPh')} rows={2} className={`${inputCls} resize-none`} />
          </Field>

          <FileSection
            files={documents}
            onChange={(files) => setValue('documents', files)}
            label={t('tenants.form.documents')}
          />

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
