import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron'
import { mkdir, copyFile, unlink, writeFile, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { propertiesRepo } from '../repositories/properties.repo'
import { tenantsRepo } from '../repositories/tenants.repo'
import { rentsRepo } from '../repositories/rents.repo'
import { accountingRepo } from '../repositories/accounting.repo'
import { readSettings, writeSettings } from '../storage/settingsStorage'
import { readCollection, writeCollection } from '../storage/fileStorage'

export function registerHandlers(): void {
  // Properties
  ipcMain.handle('properties:getAll', () => propertiesRepo.getAll())
  ipcMain.handle('properties:getById', (_, id: string) => propertiesRepo.getById(id))
  ipcMain.handle('properties:create', (_, data) => propertiesRepo.create(data))
  ipcMain.handle('properties:update', (_, id: string, data) => propertiesRepo.update(id, data))
  ipcMain.handle('properties:delete', (_, id: string) => propertiesRepo.delete(id))

  // Tenants
  ipcMain.handle('tenants:getAll', () => tenantsRepo.getAll())
  ipcMain.handle('tenants:getById', (_, id: string) => tenantsRepo.getById(id))
  ipcMain.handle('tenants:create', (_, data) => tenantsRepo.create(data))
  ipcMain.handle('tenants:update', (_, id: string, data) => tenantsRepo.update(id, data))
  ipcMain.handle('tenants:delete', (_, id: string) => tenantsRepo.delete(id))

  // Rents
  ipcMain.handle('rents:getAll', () => rentsRepo.getAll())
  ipcMain.handle('rents:getById', (_, id: string) => rentsRepo.getById(id))
  ipcMain.handle('rents:create', (_, data) => rentsRepo.create(data))
  ipcMain.handle('rents:update', (_, id: string, data) => rentsRepo.update(id, data))
  ipcMain.handle('rents:delete', (_, id: string) => rentsRepo.delete(id))

  // Accounting
  ipcMain.handle('accounting:getAll', () => accountingRepo.getAll())
  ipcMain.handle('accounting:getById', (_, id: string) => accountingRepo.getById(id))
  ipcMain.handle('accounting:create', (_, data) => accountingRepo.create(data))
  ipcMain.handle('accounting:update', (_, id: string, data) => accountingRepo.update(id, data))
  ipcMain.handle('accounting:delete', (_, id: string) => accountingRepo.delete(id))

  // Files
  ipcMain.handle('files:pick', async (event) => {
    const win =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Documents & Images',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'heic', 'tiff', 'bmp']
        },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'tiff', 'bmp'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return []

    const filesDir = join(app.getPath('userData'), 'files')
    await mkdir(filesDir, { recursive: true })

    const saved: string[] = []
    for (const src of result.filePaths) {
      const ext = extname(src)
      const dest = join(filesDir, `${randomUUID()}${ext}`)
      await copyFile(src, dest)
      saved.push(dest)
    }
    return saved
  })

  ipcMain.handle('files:delete', async (_, filePath: string) => {
    try {
      await unlink(filePath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('files:open', async (_, filePath: string) => {
    const error = await shell.openPath(filePath)
    return error === ''
  })

  // Reset
  ipcMain.handle('data:reset', async () => {
    await Promise.all([
      writeCollection('properties', []),
      writeCollection('tenants', []),
      writeCollection('rents', []),
      writeCollection('accounting', []),
    ])
    return true
  })

  // Settings
  ipcMain.handle('settings:get', () => readSettings())
  ipcMain.handle('settings:set', (_, data) => writeSettings(data))

  // Export
  ipcMain.handle('data:export', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    const date = new Date().toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: `openpatrimoine-backup-${date}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return false
    const [properties, tenants, rents, accounting, settings] = await Promise.all([
      readCollection('properties'), readCollection('tenants'),
      readCollection('rents'), readCollection('accounting'), readSettings()
    ])
    const backup = { version: 1, exportedAt: new Date().toISOString(), data: { properties, tenants, rents, accounting, settings } }
    await writeFile(result.filePath, JSON.stringify(backup, null, 2), 'utf-8')
    return true
  })

  // Import
  ipcMain.handle('data:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePaths[0]) return { success: false }
    try {
      const raw = await readFile(result.filePaths[0], 'utf-8')
      const backup = JSON.parse(raw)
      if (backup.version !== 1 || !backup.data) return { success: false, error: 'Format invalide' }
      const { properties, tenants, rents, accounting, settings } = backup.data
      await Promise.all([
        writeCollection('properties', properties ?? []),
        writeCollection('tenants', tenants ?? []),
        writeCollection('rents', rents ?? []),
        writeCollection('accounting', accounting ?? []),
      ])
      if (settings) await writeSettings(settings)
      return { success: true }
    } catch {
      return { success: false, error: 'Fichier corrompu' }
    }
  })

  // Accounting CSV export
  ipcMain.handle('accounting:exportCsv', async (event, rows: { date: string; type: string; category: string; description: string; property: string; amount: number }[]) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    const date = new Date().toISOString().slice(0, 10)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: `comptabilite-${date}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (result.canceled || !result.filePath) return false
    const header = 'Date;Type;Catégorie;Description;Propriété;Montant (€)'
    const lines = rows.map((r) =>
      [r.date, r.type, r.category, `"${r.description.replace(/"/g, '""')}"`, r.property, r.amount.toFixed(2)].join(';')
    )
    await writeFile(result.filePath, '﻿' + [header, ...lines].join('\r\n'), 'utf-8')
    return true
  })

  // PDF receipt
  ipcMain.handle('pdf:receipt', async (_, htmlContent: string) => {
    const tmpDir = app.getPath('temp')
    const id = randomUUID()
    const htmlPath = join(tmpDir, `receipt-${id}.html`)
    const pdfPath = join(tmpDir, `receipt-${id}.pdf`)
    await writeFile(htmlPath, htmlContent, 'utf-8')
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false, javascript: false } })
    try {
      await win.loadFile(htmlPath)
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'none' }
      })
      await writeFile(pdfPath, pdfBuffer)
      await shell.openPath(pdfPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    } finally {
      win.close()
      unlink(htmlPath).catch(() => {})
    }
  })
}
