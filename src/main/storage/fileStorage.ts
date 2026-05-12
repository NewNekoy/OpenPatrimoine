import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

let _dataDir: string | null = null

function dataDir(): string {
  if (!_dataDir) _dataDir = join(app.getPath('userData'), 'data')
  return _dataDir
}

async function ensureDir(): Promise<void> {
  const dir = dataDir()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

export async function readCollection<T>(name: string): Promise<T[]> {
  await ensureDir()
  const path = join(dataDir(), `${name}.json`)
  if (!existsSync(path)) return []
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw) as T[]
}

export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  await ensureDir()
  const path = join(dataDir(), `${name}.json`)
  await writeFile(path, JSON.stringify(items, null, 2), 'utf-8')
}
