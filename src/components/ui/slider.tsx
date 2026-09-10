import * as React from 'react'

import { cn } from '@/lib/utils'

type SliderProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'min' | 'max'> & {
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled,
  ...props
}: SliderProps) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<number[]>(() => defaultValue ?? value ?? [min])

  const current = isControlled ? (value as number[]) : internal
  const single = current[0] ?? min

  const percent = max === min ? 0 : ((single - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    const arr = [next]
    if (!isControlled) setInternal(arr)
    onValueChange?.(arr)
  }

  return (
    <div
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        disabled && 'opacity-50',
        className,
      )}
    >
      <input
        type="range"
        data-slot="slider-input"
        min={min}
        max={max}
        step={step}
        value={single}
        disabled={disabled}
        onChange={handleChange}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={single}
        className={cn(
          'h-1.5 w-full appearance-none rounded-full bg-slate-200 transition-colors outline-none',
          // track fill via inline gradient below
          '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors active:[&::-webkit-slider-thumb]:cursor-grabbing active:[&::-webkit-slider-thumb]:border-slate-400',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm',
          'focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-slate-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        style={{
          background: `linear-gradient(to right, #334155 0%, #334155 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`,
        }}
        {...props}
      />
    </div>
  )
}

export { Slider }
