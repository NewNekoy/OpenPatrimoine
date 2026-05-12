import { createRepo } from './base.repo'

export interface TenantEntity {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  propertyId: string
  leaseStart: string
  leaseEnd?: string
  monthlyRent: number
  charges?: number
  deposit?: number
  notes?: string
  photos?: string[]
  createdAt: string
  updatedAt: string
}

export const tenantsRepo = createRepo<TenantEntity>('tenants')
