import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface EntityOption {
  id: string
  label: string
  sublabel?: string
}

interface EntitySelectProps {
  options: EntityOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function EntitySelect({
  options,
  value,
  onValueChange,
  placeholder = 'Sélectionner...',
  className,
  disabled
}: EntitySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'bg-white/[0.04] border-white/[0.08] text-white focus:ring-violet-500/50',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[#1c1c28] border-white/[0.08] text-white">
        {options.map((opt) => (
          <SelectItem
            key={opt.id}
            value={opt.id}
            className="focus:bg-violet-500/20 focus:text-white"
          >
            <div className="flex flex-col">
              <span>{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[10px] text-white/40">{opt.sublabel}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
