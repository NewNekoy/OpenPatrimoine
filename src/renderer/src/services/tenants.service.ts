import type { Tenant, CreateTenant, UpdateTenant } from '../types/entities'

const ipc = window.electron.ipcRenderer

export const tenantsService = {
  getAll: (): Promise<Tenant[]> => ipc.invoke('tenants:getAll'),
  getById: (id: string): Promise<Tenant | null> => ipc.invoke('tenants:getById', id),
  create: (data: CreateTenant): Promise<Tenant> => ipc.invoke('tenants:create', data),
  update: (id: string, data: UpdateTenant): Promise<Tenant | null> =>
    ipc.invoke('tenants:update', id, data),
  delete: (id: string): Promise<boolean> => ipc.invoke('tenants:delete', id)
}
