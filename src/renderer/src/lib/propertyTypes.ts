import { z } from 'zod'

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Appartement', color: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  { value: 'house',     label: 'Maison',      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  { value: 'parking',   label: 'Parking',     color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20' },
  { value: 'commercial',label: 'Local commercial', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  { value: 'other',     label: 'Autre',       color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20' },
] as const

export type PropertyType = typeof PROPERTY_TYPE_OPTIONS[number]['value']

export const propertyTypeSchema = z.enum(
  PROPERTY_TYPE_OPTIONS.map((o) => o.value) as [PropertyType, ...PropertyType[]]
)

const byValue = Object.fromEntries(PROPERTY_TYPE_OPTIONS.map((o) => [o.value, o])) as Record<PropertyType, typeof PROPERTY_TYPE_OPTIONS[number]>

export const getPropertyTypeLabel = (type: PropertyType) => byValue[type].label
export const getPropertyTypeColor = (type: PropertyType) => byValue[type].color
