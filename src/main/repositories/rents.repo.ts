import { createRepo } from './base.repo'

export interface RentPaymentEntity {
  id: string
  tenantId: string
  propertyId: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'pending' | 'paid' | 'late' | 'partial'
  notes?: string
  createdAt: string
  updatedAt: string
}

export const rentsRepo = createRepo<RentPaymentEntity>('rents')
