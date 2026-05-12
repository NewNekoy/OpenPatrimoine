import type { Property, CreateProperty, UpdateProperty } from '../types/entities'

const ipc = window.electron.ipcRenderer

export const propertiesService = {
  getAll: (): Promise<Property[]> => ipc.invoke('properties:getAll'),
  getById: (id: string): Promise<Property | null> => ipc.invoke('properties:getById', id),
  create: (data: CreateProperty): Promise<Property> => ipc.invoke('properties:create', data),
  update: (id: string, data: UpdateProperty): Promise<Property | null> =>
    ipc.invoke('properties:update', id, data),
  delete: (id: string): Promise<boolean> => ipc.invoke('properties:delete', id)
}
