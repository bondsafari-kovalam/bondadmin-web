'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { textareaClass } from '@/components/shared/form-field'
import type { ActivityFaq } from '@/types/catalog'

interface FaqEditorProps {
  /** Id of the first input, so a <Field> label and error focus land on it. */
  id: string
  values: ActivityFaq[]
  onChange: (values: ActivityFaq[]) => void
  max: number
  describedBy?: string
  invalid?: boolean
}

/** Editable question-and-answer rows. Rows without a question or answer are ignored on save. */
export function FaqEditor({ id, values, onChange, max, describedBy, invalid }: FaqEditorProps) {
  const update = (index: number, change: Partial<ActivityFaq>) => onChange(values.map((faq, i) => (i === index ? { ...faq, ...change } : faq)))
  return <div className="flex flex-col gap-2">
    {values.length > 0 && <ol className="flex flex-col gap-3" aria-describedby={describedBy}>
      {values.map((faq, i) => <li key={i} className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:grid lg:grid-cols-2 lg:gap-3">
          <Input id={i === 0 ? id : undefined} aria-label={`Question ${i + 1}`} aria-invalid={invalid || undefined} value={faq.question} placeholder="Question"
            onChange={(e) => update(i, { question: e.target.value })} className="h-10 rounded-xl text-sm" />
          <textarea aria-label={`Answer ${i + 1}`} rows={2} value={faq.answer} placeholder="Answer" onChange={(e) => update(i, { answer: e.target.value })} className={textareaClass} />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remove FAQ ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}><Trash2 className="size-4 text-slate-400" /></Button>
      </li>)}
    </ol>}
    <Button id={values.length === 0 ? id : undefined} type="button" variant="outline" size="sm" disabled={values.length >= max} aria-describedby={values.length === 0 ? describedBy : undefined}
      className="h-8 w-fit rounded-full px-3 text-xs" onClick={() => onChange([...values, { question: '', answer: '' }])}><Plus data-icon="inline-start" />Add FAQ</Button>
  </div>
}
