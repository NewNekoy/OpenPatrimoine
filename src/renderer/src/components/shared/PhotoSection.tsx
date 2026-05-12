import { ImagePlus, X, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { photosService } from '@/services/photos.service'
import { fileToUrl } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface PhotoSectionProps {
  photos: string[]
  onChange: (photos: string[]) => void
  disabled?: boolean
}

export function PhotoSection({ photos, onChange, disabled }: PhotoSectionProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const handleAdd = async () => {
    const newPaths = await photosService.pick()
    if (newPaths.length > 0) onChange([...photos, ...newPaths])
  }

  const handleRemove = async (path: string) => {
    await photosService.delete(path)
    onChange(photos.filter((p) => p !== path))
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/40">
            Photos{photos.length > 0 ? ` (${photos.length})` : ''}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={disabled ? undefined : handleAdd}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-lg border border-dashed border-white/[0.08] text-white/20 hover:border-violet-500/30 hover:text-white/40 transition-colors disabled:cursor-default"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[11px]">Cliquer pour ajouter des photos</span>
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((path) => (
              <div key={path} className="group relative aspect-square rounded-lg overflow-hidden bg-white/[0.04]">
                <img
                  src={fileToUrl(path)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setLightbox(path)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(path)}
                      className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!disabled && (
              <button
                type="button"
                onClick={handleAdd}
                className="aspect-square rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center text-white/20 hover:border-violet-500/30 hover:text-white/40 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="bg-black/90 border-white/10 p-2 max-w-3xl">
          {lightbox && (
            <img
              src={fileToUrl(lightbox)}
              alt=""
              className="w-full h-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
