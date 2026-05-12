import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Download, Upload, User, AlertTriangle, Trash2, FlaskConical, Globe } from 'lucide-react'
import { toast } from 'sonner'
import type { Resolver } from 'react-hook-form'
import PageShell from '../components/PageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings, useSaveSettings } from '@/hooks/useSettings'
import { settingsService } from '@/services/settings.service'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'
import { seedTemplateData } from '@/lib/seedData'
import i18n from '@/i18n'
import { cn } from '@/lib/utils'

const schema = z.object({
  ownerName: z.string().min(1, 'Requis'),
  ownerAddress: z.string().min(1, 'Requis'),
  ownerPostalCode: z.string().min(1, 'Requis'),
  ownerCity: z.string().min(1, 'Requis'),
  ownerPhone: z.string().optional().default(''),
  ownerEmail: z.string().optional().default('')
})

type FormValues = z.output<typeof schema>

const inputCls = 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-violet-500/50'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-white/60 text-xs">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle, variant = 'default' }: {
  icon: React.ElementType; title: string; subtitle?: string; variant?: 'default' | 'danger'
}) {
  const iconCls = variant === 'danger'
    ? 'bg-red-500/15 border-red-500/20 text-red-400'
    : 'bg-violet-500/15 border-violet-500/20 text-violet-400'
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconCls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/85">{title}</p>
        {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useSettings()
  const save = useSaveSettings()
  const qc = useQueryClient()
  const [importConfirm, setImportConfirm] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isChangingLang, setIsChangingLang] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: { ownerName: '', ownerAddress: '', ownerPostalCode: '', ownerCity: '', ownerPhone: '', ownerEmail: '' }
    })

  useEffect(() => {
    if (settings) reset(settings)
  }, [settings, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      await save.mutateAsync({ ...values, language: settings?.language ?? 'fr' })
      toast.success(t('settings.owner.saved'))
      reset(values)
    } catch {
      toast.error(t('settings.owner.saveError'))
    }
  }

  const handleLanguageChange = async (lang: 'fr' | 'en') => {
    if (!settings || isChangingLang) return
    setIsChangingLang(true)
    try {
      await save.mutateAsync({ ...settings, language: lang })
      await i18n.changeLanguage(lang)
    } finally {
      setIsChangingLang(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const ok = await settingsService.export()
      if (ok) toast.success(t('settings.data.exportSuccess'))
    } catch {
      toast.error(t('settings.data.exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      await seedTemplateData()
      await qc.invalidateQueries()
      toast.success(t('settings.debug.success'))
    } catch {
      toast.error(t('settings.debug.error'))
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResetConfirm = async () => {
    setResetConfirm(false)
    setIsResetting(true)
    try {
      await settingsService.reset()
      await qc.invalidateQueries()
      toast.success(t('settings.danger.resetSuccess'))
    } catch {
      toast.error(t('settings.danger.resetError'))
    } finally {
      setIsResetting(false)
    }
  }

  const handleImportConfirm = async () => {
    setImportConfirm(false)
    setIsImporting(true)
    try {
      const result = await settingsService.import()
      if (result.success) {
        await qc.invalidateQueries()
        toast.success(t('settings.data.importSuccess'))
      } else {
        toast.error(result.error ?? t('settings.data.importSuccess'))
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setIsImporting(false)
    }
  }

  const currentLang = settings?.language ?? 'fr'

  if (isLoading) return (
    <PageShell title={t('settings.title')} subtitle={t('settings.subtitle')} icon={Settings}>
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    </PageShell>
  )

  return (
    <PageShell title={t('settings.title')} subtitle={t('settings.subtitle')} icon={Settings}>
      <div className="max-w-2xl flex flex-col gap-6">

        {/* Owner info */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-7">
          <SectionTitle icon={User} title={t('settings.owner.title')} subtitle={t('settings.owner.subtitle')} />
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Field label={t('settings.owner.name')} error={errors.ownerName?.message}>
              <Input {...register('ownerName')} placeholder={t('settings.owner.namePh')} className={inputCls} />
            </Field>
            <Field label={t('settings.owner.address')} error={errors.ownerAddress?.message}>
              <Input {...register('ownerAddress')} placeholder={t('settings.owner.addressPh')} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('settings.owner.postalCode')} error={errors.ownerPostalCode?.message}>
                <Input {...register('ownerPostalCode')} placeholder={t('settings.owner.postalCodePh')} className={inputCls} />
              </Field>
              <Field label={t('settings.owner.city')} error={errors.ownerCity?.message}>
                <Input {...register('ownerCity')} placeholder={t('settings.owner.cityPh')} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('settings.owner.phone')} error={errors.ownerPhone?.message}>
                <Input {...register('ownerPhone')} placeholder={t('settings.owner.phonePh')} className={inputCls} />
              </Field>
              <Field label={t('settings.owner.email')} error={errors.ownerEmail?.message}>
                <Input {...register('ownerEmail')} placeholder={t('settings.owner.emailPh')} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={!isDirty || save.isPending} className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30">
                {save.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </div>

        {/* Language */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-7">
          <SectionTitle icon={Globe} title={t('settings.language.title')} subtitle={t('settings.language.subtitle')} />
          <div className="flex items-center gap-3">
            {(['fr', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                disabled={isChangingLang || currentLang === lang}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                  currentLang === lang
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20 cursor-default'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] cursor-pointer'
                )}
              >
                <span className="text-base">{lang === 'fr' ? 'FR' : 'EN'}</span>
                <span>{lang === 'fr' ? 'Français' : 'English'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data management */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-7">
          <SectionTitle icon={Download} title={t('settings.data.title')} subtitle={t('settings.data.subtitle')} />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div>
                <p className="text-sm font-medium text-white/80">{t('settings.data.exportTitle')}</p>
                <p className="text-xs text-white/35 mt-1">{t('settings.data.exportSub')}</p>
              </div>
              <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm" className="border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] gap-1.5 shrink-0">
                <Download className="w-3.5 h-3.5" />
                {isExporting ? t('common.exporting') : t('settings.data.exportBtn')}
              </Button>
            </div>

            <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div>
                <p className="text-sm font-medium text-white/80">{t('settings.data.importTitle')}</p>
                <p className="text-xs text-white/35 mt-1">{t('settings.data.importSub')}</p>
              </div>
              <Button onClick={() => setImportConfirm(true)} disabled={isImporting} variant="outline" size="sm" className="border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                {isImporting ? t('common.importing') : t('settings.data.importBtn')}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug / Template data */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-7">
          <SectionTitle icon={FlaskConical} title={t('settings.debug.title')} subtitle={t('settings.debug.subtitle')} />
          <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div>
              <p className="text-sm font-medium text-white/80">{t('settings.debug.subtitle')}</p>
              <p className="text-xs text-white/35 mt-1">{t('settings.debug.description')}</p>
            </div>
            <Button onClick={handleSeed} disabled={isSeeding} variant="outline" size="sm" className="border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] gap-1.5 shrink-0">
              <FlaskConical className="w-3.5 h-3.5" />
              {isSeeding ? t('settings.debug.btnPending') : t('settings.debug.btn')}
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-red-500/[0.04] border border-red-500/20 p-7">
          <SectionTitle icon={Trash2} title={t('settings.danger.title')} subtitle={t('settings.danger.subtitle')} variant="danger" />
          <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-red-500/[0.06] border border-red-500/15">
            <div>
              <p className="text-sm font-medium text-white/80">{t('settings.danger.resetTitle')}</p>
              <p className="text-xs text-white/35 mt-1">{t('settings.danger.resetSub')}</p>
            </div>
            <Button onClick={() => setResetConfirm(true)} disabled={isResetting} variant="outline" size="sm" className="border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-1.5 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
              {isResetting ? t('settings.danger.resetBtnPending') : t('settings.danger.resetBtn')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={(v) => !v && setResetConfirm(false)}
        title={t('settings.danger.resetConfirmTitle')}
        description={
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{t('settings.danger.resetConfirmDesc')}</span>
          </span>
        }
        onConfirm={handleResetConfirm}
      />
      <ConfirmDialog
        open={importConfirm}
        onOpenChange={(v) => !v && setImportConfirm(false)}
        title={t('settings.data.importConfirmTitle')}
        description={
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{t('settings.data.importConfirmDesc')}</span>
          </span>
        }
        onConfirm={handleImportConfirm}
      />
    </PageShell>
  )
}
