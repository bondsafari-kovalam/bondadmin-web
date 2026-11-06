'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormSelect, optionsOf } from '@/components/shared/form-controls'
import { offeringStatuses, type Currency, type OfferingFormValues } from '@/types/catalog'

interface OfferingEditorProps {
  /** Id of the first input, so a <Field> label and error focus land on it. */
  id: string
  values: OfferingFormValues[]
  onChange: (values: OfferingFormValues[]) => void
  max: number
  currency: Currency
  describedBy?: string
  invalid?: boolean
}

/** New rows start as Preview so nothing is shown as bookable until someone confirms it. */
const newRow: OfferingFormValues = { locationSlug: '', status: 'Preview', price: '', duration: '', meetingPoint: '' }

/** One row per website location, with its own status, price, duration and meeting point. */
export function OfferingEditor({ id, values, onChange, max, currency, describedBy, invalid }: OfferingEditorProps) {
  const update = (index: number, change: Partial<OfferingFormValues>) => onChange(values.map((row, i) => (i === index ? { ...row, ...change } : row)))
  return <div className="flex flex-col gap-2">
    {values.length > 0 && <ol className="flex flex-col gap-3" aria-describedby={describedBy}>
      {values.map((row, i) => <li key={i} className="flex items-start gap-2 rounded-xl border border-slate-100 p-2.5">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <Input id={i === 0 ? id : undefined} aria-label={`Location slug ${i + 1}`} aria-invalid={invalid || undefined} value={row.locationSlug} placeholder="Location slug, e.g. kovalam" autoComplete="off"
            onChange={(e) => update(i, { locationSlug: e.target.value.toLowerCase() })} className="h-10 rounded-xl font-mono text-sm" />
          <FormSelect id={`${id}-status-${i}`} items={optionsOf(offeringStatuses)} value={row.status} onChange={(status) => update(i, { status })} />
          <Input aria-label={`Price ${i + 1}`} inputMode="decimal" value={row.price} placeholder={`Price (${currency})`} onChange={(e) => update(i, { price: e.target.value })} className="h-10 rounded-xl text-sm" />
          <Input aria-label={`Duration ${i + 1}`} value={row.duration} placeholder="Duration, e.g. 2 hours" onChange={(e) => update(i, { duration: e.target.value })} className="h-10 rounded-xl text-sm" />
          <Input aria-label={`Meeting point ${i + 1}`} value={row.meetingPoint} placeholder="Meeting point" onChange={(e) => update(i, { meetingPoint: e.target.value })} className="h-10 rounded-xl text-sm sm:col-span-2" />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove location ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}><Trash2 className="size-4 text-slate-400" /></Button>
      </li>)}
    </ol>}
    <Button id={values.length === 0 ? id : undefined} type="button" variant="outline" size="sm" disabled={values.length >= max} aria-describedby={values.length === 0 ? describedBy : undefined}
      className="h-8 w-fit rounded-full px-3 text-xs" onClick={() => onChange([...values, newRow])}><Plus data-icon="inline-start" />Add location</Button>
  </div>
}
