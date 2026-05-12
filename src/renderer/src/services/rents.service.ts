import type { RentPayment, CreateRentPayment, UpdateRentPayment } from '../types/entities'

const ipc = window.electron.ipcRenderer

export const rentsService = {
  getAll: (): Promise<RentPayment[]> => ipc.invoke('rents:getAll'),
  getById: (id: string): Promise<RentPayment | null> => ipc.invoke('rents:getById', id),
  create: (data: CreateRentPayment): Promise<RentPayment> => ipc.invoke('rents:create', data),
  update: (id: string, data: UpdateRentPayment): Promise<RentPayment | null> =>
    ipc.invoke('rents:update', id, data),
  delete: (id: string): Promise<boolean> => ipc.invoke('rents:delete', id)
}
