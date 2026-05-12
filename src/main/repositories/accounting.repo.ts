import { createRepo } from './base.repo'

export interface AccountingEntryEntity {
  id: string
  propertyId?: string
  type: 'income' | 'expense'
  category: string
  amount: number
  date: string
  description: string
  createdAt: string
  updatedAt: string
}

export const accountingRepo = createRepo<AccountingEntryEntity>('accounting')
