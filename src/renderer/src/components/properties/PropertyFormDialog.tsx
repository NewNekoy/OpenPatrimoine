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
import { FileSection } from '@/components/shared/FileSection'
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperties'
import { PROPERTY_TYPE_OPTIONS, propertyTypeSchema } from '@/lib/propertyTypes'
import type { Property } from '@/types/entities'
import type { PropertyType } from '@/lib/propertyTypes'

const toNum = (v: unknown) => (!v && v !== 0 ? undefined : Number(v))

const schema = z.object({
  name: z.string().min(1, 'Requis'),
  address: z.string().min(1, 'Requis'),
  city: z.string().min(1, 'Requis'),
  type: propertyTypeSchema,
  surface: z.coerce.number().positive('Doit être > 0'),
  rooms: z.preprocess(toNum, z.number().int().positive().optional()),
  purchasePrice: z.preprocess(toNum, z.number().positive().optional()),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([])
})

type FormValues = z.output<typeof schema>

interface PropertyFormDialogProps {
  open: boolean
  onClose: () => void
  property?: Property | null
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

export function PropertyFormDialog({ open, onClose, property }: PropertyFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!property
  const create = useCreateProperty()
  const update = useUpdateProperty()
  const isPending = create.isPending || update.isPending

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: {
        name: '', address: '', city: '', type: 'apartment',
        surface: undefined, rooms: undefined, purchasePrice: undefined,
        purchaseDate: '', notes: '', photos: []
      }
    })

  const photos = watch('photos')

  useEffect(() => {
    if (!open) return
    reset(property ? {
      name: property.name, address: property.address, city: property.city,
      type: property.type, surface: property.surface, rooms: property.rooms,
      purchasePrice: property.purchasePrice, purchaseDate: property.purchaseDate ?? '',
      notes: property.notes ?? '', photos: property.photos ?? []
    } : {
      name: '', address: '', city: '', type: 'apartment',
      surface: undefined, rooms: undefined, purchasePrice: undefined,
      purchaseDate: '', notes: '', photos: []
    })
  }, [open, property, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && property) {
        await update.mutateAsync({ id: property.id, data: values })
        toast.success(t('properties.form.updated'))
      } else {
        await create.mutateAsync(values)
        toast.success(t('properties.form.added'))
      }
      onClose()
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            {isEdit ? t('properties.form.titleEdit') : t('properties.form.titleAdd')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('properties.form.name')} error={errors.name?.message}>
              <Input {...register('name')} placeholder={t('properties.form.namePh')} className={inputCls} />
            </Field>
            <Field label={t('properties.form.city')} error={errors.city?.message}>
              <Input {...register('city')} placeholder={t('properties.form.cityPh')} className={inputCls} />
            </Field>
          </div>

          <Field label={t('properties.form.address')} error={errors.address?.message}>
            <Input {...register('address')} placeholder={t('properties.form.addressPh')} className={inputCls} />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t('properties.form.type')} error={errors.type?.message}>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white focus:ring-violet-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c28] border-white/[0.08] text-white">
                    {PROPERTY_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="focus:bg-violet-500/20 focus:text-white">
                        {t(`properties.types.${o.value as PropertyType}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label={t('properties.form.surface')} error={errors.surface?.message}>
              <Input {...register('surface')} type="number" placeholder={t('properties.form.surfacePh')} className={inputCls} />
            </Field>
            <Field label={t('properties.form.rooms')} error={errors.rooms?.message}>
              <Input {...register('rooms')} type="number" placeholder={t('properties.form.roomsPh')} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('properties.form.purchasePrice')} error={errors.purchasePrice?.message}>
              <Input {...register('purchasePrice')} type="number" placeholder="180000" className={inputCls} />
            </Field>
            <Field label={t('properties.form.purchaseDate')} error={errors.purchaseDate?.message}>
              <Input {...register('purchaseDate')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
          </div>

          <Field label={t('properties.form.notes')} error={errors.notes?.message}>
            <Textarea {...register('notes')} placeholder={t('properties.form.notesPh')} rows={2} className={`${inputCls} resize-none`} />
          </Field>

          <div className="pt-1 border-t border-white/[0.05]">
            <FileSection files={photos} onChange={(p) => setValue('photos', p)} label={t('properties.form.photos')} />
          </div>

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
