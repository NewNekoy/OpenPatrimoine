import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '../i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fileToUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return `app-file://${encodeURIComponent(normalized)}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
