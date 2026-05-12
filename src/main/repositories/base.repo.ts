import { randomUUID } from 'crypto'
import { readCollection, writeCollection } from '../storage/fileStorage'

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export function createRepo<T extends BaseEntity>(collectionName: string) {
  return {
    async getAll(): Promise<T[]> {
      return readCollection<T>(collectionName)
    },

    async getById(id: string): Promise<T | null> {
      const items = await readCollection<T>(collectionName)
      return items.find((i) => i.id === id) ?? null
    },

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const items = await readCollection<T>(collectionName)
      const now = new Date().toISOString()
      const item = { ...data, id: randomUUID(), createdAt: now, updatedAt: now } as T
      await writeCollection(collectionName, [...items, item])
      return item
    },

    async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | null> {
      const items = await readCollection<T>(collectionName)
      const idx = items.findIndex((i) => i.id === id)
      if (idx === -1) return null
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() }
      await writeCollection(collectionName, items)
      return items[idx]
    },

    async delete(id: string): Promise<boolean> {
      const items = await readCollection<T>(collectionName)
      const filtered = items.filter((i) => i.id !== id)
      if (filtered.length === items.length) return false
      await writeCollection(collectionName, filtered)
      return true
    }
  }
}
