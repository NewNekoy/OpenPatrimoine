import { createRepo } from './base.repo'

export interface PropertyEntity {
  id: string
  name: string
  address: string
  city: string
  type: 'apartment' | 'house' | 'parking' | 'commercial' | 'other'
  surface: number
  rooms?: number
  purchasePrice?: number
  purchaseDate?: string
  notes?: string
  photos?: string[]
  createdAt: string
  updatedAt: string
}

export const propertiesRepo = createRepo<PropertyEntity>('properties')
