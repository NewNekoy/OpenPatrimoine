import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller, useWatch } from 'react-hook-form'
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
import { useCreateAccountingEntry, useUpdateAccountingEntry } from '@/hooks/useAccounting'
import { useProperties } from '@/hooks/useProperties'
import type { AccountingEntry } from '@/types/entities'

const CATEGORY_CODES = {
  income: ['Loyer', 'Charges récupérées', 'Dépôt de garantie', 'Remboursement', 'Autre recette'],
  expense: ['Travaux / Réparations', 'Charges copropriété', 'Assurance', 'Taxe foncière', 'Frais agence', 'Intérêts emprunt', 'Autre dépense']
}

const schema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Requis'),
  amount: z.coerce.number().positive('Doit être > 0'),
  date: z.string().min(1, 'Requis'),
  propertyId: z.string().optional(),
  description: z.string().min(1, 'Requis')
})

type FormValues = z.output<typeof schema>

interface AccountingFormDialogProps {
  open: boolean
  onClose: () => void
  entry?: AccountingEntry | null
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

export function AccountingFormDialog({ open, onClose, entry }: AccountingFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!entry
  const create = useCreateAccountingEntry()
  const update = useUpdateAccountingEntry()
  const { data: properties = [] } = useProperties()
  const isPending = create.isPending || update.isPending

  const categoryLabels = {
    income: t('accounting.categories.income', { returnObjects: true }) as string[],
    expense: t('accounting.categories.expense', { returnObjects: true }) as string[],
  }

  const propertyOptions = [
    { id: '__none__', label: t('accounting.form.noProperty') },
    ...properties.map((p) => ({ id: p.id, label: p.name, sublabel: p.city }))
  ]

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: {
        type: 'income', category: '', amount: undefined,
        date: new Date().toISOString().split('T')[0],
        propertyId: '__none__', description: ''
      }
    })

  const currentType = useWatch({ control, name: 'type', defaultValue: 'income' })

  useEffect(() => {
    setValue('category', '')
  }, [currentType, setValue])

  useEffect(() => {
    if (!open) return
    reset(entry ? {
      type: entry.type, category: entry.category, amount: entry.amount,
      date: entry.date, propertyId: entry.propertyId ?? '__none__', description: entry.description
    } : {
      type: 'income', category: '', amount: undefined,
      date: new Date().toISOString().split('T')[0],
      propertyId: '__none__', description: ''
    })
  }, [open, entry, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      const data = { ...values, propertyId: values.propertyId === '__none__' ? undefined : values.propertyId }
      if (isEdit && entry) {
        await update.mutateAsync({ id: entry.id, data })
        toast.success(t('accounting.form.updated'))
      } else {
        await create.mutateAsync(data)
        toast.success(t('accounting.form.added'))
      }
      onClose()
    } catch {
      toast.error(t('common.error'))
    }
  }

  const codes = CATEGORY_CODES[currentType as 'income' | 'expense']
  const labels = categoryLabels[currentType as 'income' | 'expense']

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            {isEdit ? t('accounting.form.titleEdit') : t('accounting.form.titleAdd')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('accounting.form.type')} error={errors.type?.message}>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white focus:ring-violet-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c28] border-white/[0.08] text-white">
                    <SelectItem value="income" className="focus:bg-emerald-500/20 focus:text-white">{t('status.income')}</SelectItem>
                    <SelectItem value="expense" className="focus:bg-red-500/20 focus:text-white">{t('status.expense')}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label={t('accounting.form.category')} error={errors.category?.message}>
              <Controller name="category" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white focus:ring-violet-500/50">
                    <SelectValue placeholder={t('accounting.form.categoryPh')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c28] border-white/[0.08] text-white">
                    {codes.map((code, i) => (
                      <SelectItem key={code} value={code} className="focus:bg-violet-500/20 focus:text-white">
                        {labels[i] ?? code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('accounting.form.amount')} error={errors.amount?.message}>
              <Input {...register('amount')} type="number" placeholder="500" className={inputCls} />
            </Field>
            <Field label={t('accounting.form.date')} error={errors.date?.message}>
              <Input {...register('date')} type="date" className={`${inputCls} [color-scheme:dark]`} />
            </Field>
          </div>

          <Field label={t('accounting.form.property')} error={errors.propertyId?.message}>
            <Controller name="propertyId" control={control} render={({ field }) => (
              <EntitySelect options={propertyOptions} value={field.value ?? ''} onValueChange={field.onChange} placeholder={t('common.select')} />
            )} />
          </Field>

          <Field label={t('accounting.form.description')} error={errors.description?.message}>
            <Textarea {...register('description')} placeholder={t('accounting.form.descriptionPh')} rows={2} className={`${inputCls} resize-none`} />
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
