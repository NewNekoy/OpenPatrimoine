import type { AppSettings } from '../types/entities'

const ipc = window.electron.ipcRenderer

export const settingsService = {
  get: (): Promise<AppSettings> => ipc.invoke('settings:get'),
  set: (data: AppSettings): Promise<void> => ipc.invoke('settings:set', data),
  export: (): Promise<boolean> => ipc.invoke('data:export'),
  import: (): Promise<{ success: boolean; error?: string }> => ipc.invoke('data:import'),
  generatePdf: (html: string): Promise<{ success: boolean; error?: string }> => ipc.invoke('pdf:receipt', html),
  reset: (): Promise<boolean> => ipc.invoke('data:reset')
}
