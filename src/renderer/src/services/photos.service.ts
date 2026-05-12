const ipc = window.electron.ipcRenderer

export const filesService = {
  pick: (): Promise<string[]> => ipc.invoke('files:pick'),
  delete: (filePath: string): Promise<boolean> => ipc.invoke('files:delete', filePath),
  open: (filePath: string): Promise<boolean> => ipc.invoke('files:open', filePath)
}

// backward compat alias
export const photosService = filesService
