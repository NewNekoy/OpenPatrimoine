import type { AccountingEntry, CreateAccountingEntry, UpdateAccountingEntry } from '../types/entities'

const ipc = window.electron.ipcRenderer

type CsvRow = { date: string; type: string; category: string; description: string; property: string; amount: number }

export const accountingService = {
  getAll: (): Promise<AccountingEntry[]> => ipc.invoke('accounting:getAll'),
  getById: (id: string): Promise<AccountingEntry | null> => ipc.invoke('accounting:getById', id),
  create: (data: CreateAccountingEntry): Promise<AccountingEntry> =>
    ipc.invoke('accounting:create', data),
  update: (id: string, data: UpdateAccountingEntry): Promise<AccountingEntry | null> =>
    ipc.invoke('accounting:update', id, data),
  delete: (id: string): Promise<boolean> => ipc.invoke('accounting:delete', id),
  exportCsv: (rows: CsvRow[]): Promise<boolean> => ipc.invoke('accounting:exportCsv', rows)
}
