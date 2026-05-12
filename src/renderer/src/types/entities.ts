import type { PropertyType } from '@/lib/propertyTypes'

export interface Property {
  id: string
  name: string
  address: string
  city: string
  type: PropertyType
  surface: number
  rooms?: number
  purchasePrice?: number
  purchaseDate?: string
  notes?: string
  photos?: string[]
  createdAt: string
  updatedAt: string
}

export interface Tenant {
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
  documents?: string[]
  createdAt: string
  updatedAt: string
}

export interface RentPayment {
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

export interface AccountingEntry {
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

export interface AppSettings {
  ownerName: string
  ownerAddress: string
  ownerPostalCode: string
  ownerCity: string
  ownerPhone: string
  ownerEmail: string
  language: 'fr' | 'en'
}

export type CreateProperty = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProperty = Partial<CreateProperty>
export type CreateTenant = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTenant = Partial<CreateTenant>
export type CreateRentPayment = Omit<RentPayment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateRentPayment = Partial<CreateRentPayment>
export type CreateAccountingEntry = Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAccountingEntry = Partial<CreateAccountingEntry>
