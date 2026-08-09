import { ChevronsUpDown, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  id?: string
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

const triggerClass =
  'flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-white px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function MultiSelect({
  id,
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  function toggle(optionValue: string) {
    onValueChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={0}
          className={cn(triggerClass, className)}
        >
          <span className="flex flex-wrap items-center gap-1">
            {value.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {value.map((item) => {
              const option = options.find((entry) => entry.value === item)
              return (
                <Badge key={item} variant="secondary" className="h-5 pr-1">
                  {option?.label ?? item}
                  <button
                    type="button"
                    aria-label={`Remove ${option?.label ?? item}`}
                    className="hover:bg-muted grid size-3.5 place-items-center rounded-full transition-colors"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      toggle(item)
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )
            })}
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-72 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1.5"
      >
        {options.length === 0 && (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">No options</p>
        )}
        {options.map((option) => {
          const checked = value.includes(option.value)
          return (
            <label
              key={option.value}
              className={cn(
                'hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                checked && 'bg-accent/60',
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => toggle(option.value)} />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          )
        })}
        {value.length > 0 && (
          <button
            type="button"
            className="text-destructive hover:bg-destructive/10 mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors"
            onClick={() => onValueChange([])}
          >
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
