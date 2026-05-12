import { useState } from 'react'
import { FilePlus2, X, ZoomIn, ExternalLink, FileText, FileSpreadsheet, File, Image } from 'lucide-react'
import { toast } from 'sonner'
import { filesService } from '@/services/photos.service'
import { fileToUrl } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.heic'])

function ext(path: string): string {
  return path.slice(path.lastIndexOf('.')).toLowerCase()
}

function isImage(path: string): boolean {
  return IMAGE_EXTS.has(ext(path))
}

function filename(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() ?? path
}

function FileIcon({ path, className }: { path: string; className?: string }) {
  const e = ext(path)
  if (IMAGE_EXTS.has(e)) return <Image className={className} />
  if (e === '.pdf') return <FileText className={className} />
  if (e === '.xlsx' || e === '.xls' || e === '.csv') return <FileSpreadsheet className={className} />
  if (e === '.docx' || e === '.doc') return <FileText className={className} />
  return <File className={className} />
}

function extBadge(path: string): string {
  return ext(path).replace('.', '').toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FileSectionProps {
  files: string[]
  onChange: (files: string[]) => void
  disabled?: boolean
  label?: string
}

export function FileSection({ files, onChange, disabled, label = 'Fichiers' }: FileSectionProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const handleAdd = async () => {
    try {
      const newPaths = await filesService.pick()
      if (newPaths.length > 0) onChange([...files, ...newPaths])
    } catch {
      toast.error('Impossible d\'ouvrir le sélecteur de fichiers')
    }
  }

  const handleRemove = async (path: string) => {
    await filesService.delete(path)
    onChange(files.filter((f) => f !== path))
  }

  const handleOpen = async (path: string) => {
    const ok = await filesService.open(path)
    if (!ok) toast.error('Impossible d\'ouvrir le fichier')
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/40">
            {label}{files.length > 0 ? ` (${files.length})` : ''}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {/* Empty drop zone */}
        {files.length === 0 ? (
          <button
            type="button"
            onClick={disabled ? undefined : handleAdd}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-lg border border-dashed border-white/[0.08] text-white/20 hover:border-violet-500/30 hover:text-white/40 transition-all disabled:pointer-events-none"
          >
            <FilePlus2 className="w-5 h-5" />
            <span className="text-[11px]">Cliquer pour ajouter des fichiers</span>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {files.map((path) => (
              <div
                key={path}
                className="group relative aspect-square rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06]"
              >
                {isImage(path) ? (
                  /* Image thumbnail */
                  <img src={fileToUrl(path)} alt="" className="w-full h-full object-cover" />
                ) : (
                  /* File card */
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2">
                    <FileIcon path={path} className="w-7 h-7 text-white/30" />
                    <span className="text-[9px] font-bold text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded">
                      {extBadge(path)}
                    </span>
                    <span className="text-[9px] text-white/30 truncate w-full text-center leading-tight px-1">
                      {filename(path)}
                    </span>
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  {isImage(path) ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(path)}
                      className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      title="Agrandir"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpen(path)}
                      className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      title="Ouvrir"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(path)}
                      className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add more button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleAdd}
                className="aspect-square rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center text-white/20 hover:border-violet-500/30 hover:text-white/40 transition-all"
              >
                <FilePlus2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="bg-black/90 border-white/10 p-2 max-w-3xl">
          {lightbox && (
            <img
              src={fileToUrl(lightbox)}
              alt=""
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
