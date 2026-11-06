'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipSelectProps<T extends string | number> {
  id: string
  /** Accessible group name. */
  label: string
  options: readonly { value: T, label: string }[]
  selected: readonly T[]
  onChange: (selected: T[]) => void
  max?: number
  describedBy?: string
  invalid?: boolean
  emptyText?: string
}

/** Multi-select as toggle chips (tags, months). Keeps the options' order in the result. */
export function ChipSelect<T extends string | number>({ id, label, options, selected, onChange, max, describedBy, invalid, emptyText }: ChipSelectProps<T>) {
  if (options.length === 0) return <p id={id} tabIndex={-1} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{emptyText}</p>
  const toggle = (value: T) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)))
  }
  const full = max !== undefined && selected.length >= max
  return <div role="group" aria-label={label} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="flex flex-wrap gap-1.5">
    {options.map((o, i) => {
      const on = selected.includes(o.value)
      return <button key={String(o.value)} id={i === 0 ? id : undefined} type="button" aria-pressed={on} disabled={!on && full} onClick={() => toggle(o.value)}
        className={cn('inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-40',
          on ? 'border-forest bg-forest text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-forest/40',
          invalid && !on && 'border-red-200')}>
        {on && <Check className="size-3" />}{o.label}
      </button>
    })}
  </div>
}
