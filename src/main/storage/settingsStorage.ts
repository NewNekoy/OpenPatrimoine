import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  ownerName: string
  ownerAddress: string
  ownerPostalCode: string
  ownerCity: string
  ownerPhone: string
  ownerEmail: string
  language: 'fr' | 'en'
}

const DEFAULT: AppSettings = {
  ownerName: '', ownerAddress: '', ownerPostalCode: '',
  ownerCity: '', ownerPhone: '', ownerEmail: '', language: 'fr'
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'data', 'settings.json')
}

async function ensureDir(): Promise<void> {
  const dir = join(app.getPath('userData'), 'data')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

export async function readSettings(): Promise<AppSettings> {
  await ensureDir()
  const path = settingsPath()
  if (!existsSync(path)) return { ...DEFAULT }
  const raw = await readFile(path, 'utf-8')
  return { ...DEFAULT, ...JSON.parse(raw) } as AppSettings
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await ensureDir()
  await writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}
