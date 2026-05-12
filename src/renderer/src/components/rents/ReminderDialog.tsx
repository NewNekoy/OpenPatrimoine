import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { RentPayment, Tenant, Property, AppSettings } from '@/types/entities'

function period(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function buildReminder(
  tone: 'soft' | 'firm',
  rent: RentPayment,
  tenant: Tenant,
  property: Property,
  owner: AppSettings | undefined
): string {
  const ownerName = owner?.ownerName || '[Nom du propriétaire]'
  const tenantName = `${tenant.firstName} ${tenant.lastName}`
  const address = `${property.address}, ${property.city}`
  const amount = formatCurrency(rent.amount)
  const monthYear = period(rent.dueDate)
  const dueDate = formatDate(rent.dueDate)

  if (tone === 'soft') {
    return `Objet : Rappel de loyer — ${monthYear}

Madame, Monsieur ${tenantName},

Sauf erreur de ma part, je n'ai pas encore reçu le règlement de votre loyer du mois de ${monthYear} d'un montant de ${amount}, correspondant au logement situé au ${address} (échéance du ${dueDate}).

Je vous serais reconnaissant(e) de bien vouloir procéder à ce règlement dans les meilleurs délais.

Si vous avez déjà effectué ce virement, veuillez ignorer ce message et me le confirmer afin que je puisse mettre à jour votre dossier.

Restant à votre disposition pour tout renseignement complémentaire,

Cordialement,
${ownerName}`
  }

  return `Objet : Mise en demeure — Loyer impayé ${monthYear}

Madame, Monsieur ${tenantName},

Malgré le rappel qui vous a été adressé précédemment, je constate que le loyer du mois de ${monthYear} d'un montant de ${amount} pour le bien situé au ${address} (échéance du ${dueDate}) n'a toujours pas été réglé à ce jour.

Je vous mets en demeure de procéder au règlement de la somme de ${amount} dans un délai de 8 jours à compter de la réception du présent courrier.

À défaut de règlement dans ce délai, je me verrai contraint(e) d'engager les procédures légales en vigueur, notamment la procédure de recouvrement et, le cas échéant, la résiliation du bail pour défaut de paiement.

Je reste néanmoins disponible pour convenir d'un arrangement amiable si votre situation le justifie.

Cordialement,
${ownerName}`
}

interface ReminderDialogProps {
  open: boolean
  onClose: () => void
  rent: RentPayment | null
  tenant: Tenant | undefined
  property: Property | undefined
  owner: AppSettings | undefined
}

export function ReminderDialog({ open, onClose, rent, tenant, property, owner }: ReminderDialogProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState<'soft' | 'firm'>('soft')

  if (!rent || !tenant || !property) return null

  const handleCopy = async () => {
    const text = buildReminder(tone, rent, tenant, property, owner)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#16161f] border-white/[0.08] text-white max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <DialogTitle className="text-base font-semibold text-white">
              {t('rents.reminder.title', { name: `${tenant.firstName} ${tenant.lastName}` })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={tone} onValueChange={(v) => setTone(v as 'soft' | 'firm')} className="mt-2">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] h-8 w-full">
            <TabsTrigger value="soft" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white text-white/40">
              {t('rents.reminder.soft')}
            </TabsTrigger>
            <TabsTrigger value="firm" className="flex-1 text-xs data-[state=active]:bg-red-700 data-[state=active]:text-white text-white/40">
              {t('rents.reminder.firm')}
            </TabsTrigger>
          </TabsList>

          {(['soft', 'firm'] as const).map((tone) => (
            <TabsContent key={tone} value={tone} className="mt-3">
              <pre className="whitespace-pre-wrap text-xs text-white/70 leading-relaxed bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 font-sans max-h-72 overflow-y-auto">
                {buildReminder(tone, rent, tenant, property, owner)}
              </pre>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 mt-1">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/[0.06]">
            {t('common.close')}
          </Button>
          <Button size="sm" onClick={handleCopy} className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('rents.reminder.copied') : t('rents.reminder.copy')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
