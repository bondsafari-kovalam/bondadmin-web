'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ListEditorProps {
  /** Id of the first input, so a <Field> label and error focus land on it. */
  id: string
  values: string[]
  onChange: (values: string[]) => void
  /** Accessible name of each row, e.g. "Highlight" → "Highlight 1". */
  itemLabel: string
  addLabel: string
  max: number
  type?: 'text' | 'time'
  placeholder?: string
  numbered?: boolean
  describedBy?: string
  invalid?: boolean
}

/** Editable list of short text (or time) values with add / remove buttons. Empty rows are ignored on save. */
export function ListEditor({ id, values, onChange, itemLabel, addLabel, max, type = 'text', placeholder, numbered = false, describedBy, invalid }: ListEditorProps) {
  return <div className="flex flex-col gap-2">
    {values.length > 0 && <ol className="flex flex-col gap-2" aria-describedby={describedBy}>
      {values.map((value, i) => <li key={i} className="flex items-center gap-2">
        {numbered ? <span className="w-5 text-right text-xs text-slate-400">{i + 1}.</span> : <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />}
        <Input id={i === 0 ? id : undefined} type={type} aria-label={`${itemLabel} ${i + 1}`} aria-invalid={invalid || undefined} value={value} placeholder={placeholder}
          onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))} className={cn('h-10 flex-1 rounded-xl text-sm', type === 'time' && 'max-w-40')} />
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}><Trash2 className="size-4 text-slate-400" /></Button>
      </li>)}
    </ol>}
    <Button id={values.length === 0 ? id : undefined} type="button" variant="outline" size="sm" disabled={values.length >= max} aria-describedby={values.length === 0 ? describedBy : undefined}
      className="h-8 w-fit rounded-full px-3 text-xs" onClick={() => onChange([...values, ''])}><Plus data-icon="inline-start" />{addLabel}</Button>
  </div>
}
