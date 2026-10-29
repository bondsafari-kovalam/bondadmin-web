'use client'

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FilterSelectProps<T extends string> {
  /** Accessible name, e.g. "Date range". */
  label: string
  /** value -> display label, in menu order. */
  items: Record<T, string>
  value: T
  onChange: (value: T) => void
  icon?: ReactNode
  disabled?: boolean
  title?: string
  className?: string
}

/** Rounded pill dropdown used for page-level filters. */
export function FilterSelect<T extends string>({ label, items, value, onChange, icon, disabled, title, className }: FilterSelectProps<T>) {
  return <Select items={items} value={value} onValueChange={(v) => v && onChange(v as T)} disabled={disabled}>
    {/* Select sets its height via data-[size=default]; match that selector so h-10 applies. */}
    <SelectTrigger aria-label={label} title={title} className={cn('h-10 rounded-full bg-white px-4 text-xs data-[size=default]:h-10', className)}>{icon}<SelectValue /></SelectTrigger>
    <SelectContent>{(Object.keys(items) as T[]).map((key) => <SelectItem key={key} value={key}>{items[key]}</SelectItem>)}</SelectContent>
  </Select>
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  size?: 'sm' | 'md'
  className?: string
}

export function SearchInput({ value, onChange, label, placeholder, size = 'md', className }: SearchInputProps) {
  return <div className={cn('relative', className)}>
    <Search className={cn('absolute text-slate-400', size === 'sm' ? 'top-2 left-3 size-3.5' : 'top-3 left-3.5 size-4')} />
    <Input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder={placeholder}
      className={cn('w-full rounded-full bg-white text-xs', size === 'sm' ? 'h-8 pl-8' : 'h-10 pl-9')} />
  </div>
}

interface SegmentedOption<T extends string> { value: T, label: ReactNode, count?: number }

/** Small pill toggle, e.g. Bookings / Revenue. */
export function SegmentedControl<T extends string>({ label, options, value, onChange, tone = 'forest' }: { label: string, options: SegmentedOption<T>[], value: T, onChange: (value: T) => void, tone?: 'forest' | 'white' }) {
  return <div role="group" aria-label={label} className="flex w-fit rounded-full bg-slate-100 p-1">
    {options.map((o) => {
      const active = o.value === value
      return <button key={o.value} type="button" aria-pressed={active} onClick={() => onChange(o.value)}
        className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', active ? (tone === 'forest' ? 'bg-forest text-white shadow-sm' : 'bg-white text-ink shadow-sm') : 'text-slate-500')}>
        {o.label}
        {o.count !== undefined && <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-gold-soft text-gold-dark' : 'bg-white/70 text-slate-500')}>{o.count}</span>}
      </button>
    })}
  </div>
}

interface FormSelectProps<T extends string> {
  id: string
  items: Record<T, string>
  value: T | ''
  onChange: (value: T) => void
  placeholder?: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

/** Full-width select for forms; pairs with <Field id=…>. */
export function FormSelect<T extends string>({ id, items, value, onChange, placeholder, invalid, describedBy, disabled }: FormSelectProps<T>) {
  return <Select items={items} value={value || null} onValueChange={(v) => v && onChange(v as T)} disabled={disabled}>
    <SelectTrigger id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy} className="h-10 w-full rounded-xl text-sm data-[size=default]:h-10"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{(Object.keys(items) as T[]).map((key) => <SelectItem key={key} value={key}>{items[key]}</SelectItem>)}</SelectContent>
  </Select>
}

/** Turns a readonly list of strings into a Select items record. */
export function optionsOf<T extends string>(values: readonly T[]): Record<T, string> {
  const items = {} as Record<T, string>
  for (const v of values) items[v] = v
  return items
}
