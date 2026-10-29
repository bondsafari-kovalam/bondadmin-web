import type { ReactNode } from 'react'

/** Styling for <textarea>, matching the Input component. */
export const textareaClass = 'w-full min-w-0 rounded-xl border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'

/** Label + control + error/hint line. Error and hint ids are `${id}-error` / `${id}-hint` for aria-describedby. */
export function Field({ id, label, hint, error, required, children }: { id: string, label: string, hint?: string, error?: string, required?: boolean, children: ReactNode }) {
  return <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-medium text-slate-700">{label}{required ? <span className="text-red-500"> *</span> : <span className="font-normal text-slate-400"> (optional)</span>}</label>
    {children}
    {error ? <p id={`${id}-error`} className="text-[11px] text-red-600">{error}</p> : hint && <p id={`${id}-hint`} className="text-[11px] text-slate-400">{hint}</p>}
  </div>
}

/** Titled group of fields inside a long form. */
export function FormSection({ title, children }: { title: string, children: ReactNode }) {
  return <fieldset className="flex flex-col gap-4 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
    <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">{title}</legend>
    {children}
  </fieldset>
}
