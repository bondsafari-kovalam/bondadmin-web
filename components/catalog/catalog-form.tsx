'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useCatalog } from '@/components/providers/catalog-provider'
import { FormSelect, optionsOf } from '@/components/shared/form-controls'
import { Field, FormSection, textareaClass } from '@/components/shared/form-field'
import { itemsFor, slugify, toFormValues } from '@/lib/catalog'
import { validateCatalog, type CatalogErrors } from '@/lib/validation/catalog'
import { cn } from '@/lib/utils'
import { activityCategories, availabilityStatuses, courseCategories, courseLevels, currencies, durationUnits, publicationStatuses, type CatalogFormValues, type CatalogItem, type CatalogKind, type CourseLevel } from '@/types/catalog'
import type { Company } from '@/types/company'

export interface CatalogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The company the record belongs to — new records are created under this company only. */
  company: Company
  /** Record to edit; null to add a new one. */
  item: CatalogItem | null
  onSaved: (item: CatalogItem | null, mode: 'added' | 'updated', name: string) => void
}

/** Free-text fields rendered with <Input> / <textarea>. */
type TextKey = 'name' | 'slug' | 'shortDescription' | 'description' | 'coverImage' | 'gallery' | 'price' | 'durationValue' | 'capacity' | 'locations' | 'prerequisites' | 'instructor' | 'seoTitle' | 'seoDescription'

const fieldOrder: (keyof CatalogFormValues)[] = ['name', 'slug', 'shortDescription', 'description', 'category', 'level', 'coverImage', 'gallery', 'price', 'currency', 'durationValue', 'durationUnit', 'capacity', 'locations', 'modules', 'prerequisites', 'instructor', 'availability', 'publication', 'seoTitle', 'seoDescription']

function CatalogForm({ kind, open, onOpenChange, company, item, onSaved }: CatalogFormProps & { kind: CatalogKind }) {
  const { items, create, update } = useCatalog()
  const [values, setValues] = useState<CatalogFormValues>(() => toFormValues(item, kind))
  const [errors, setErrors] = useState<CatalogErrors>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const noun = kind === 'activity' ? 'activity' : 'course'
  const id = (key: keyof CatalogFormValues) => `${kind}-${key}`

  // Load the selected record each time the form opens.
  useEffect(() => {
    if (!open) return
    setValues(toFormValues(item, kind))
    setErrors({})
    setSlugTouched(item !== null)
  }, [open, item, kind])

  const set = <K extends keyof CatalogFormValues>(key: K, value: CatalogFormValues[K]) => {
    // While the slug follows the name, a name change also replaces the slug — so clear its error too.
    const autoSlug = key === 'name' && !slugTouched
    setValues((current) => ({ ...current, [key]: value, ...(autoSlug ? { slug: slugify(String(value)) } : {}) }))
    setErrors((current) => (current[key] || (autoSlug && current.slug) ? { ...current, [key]: undefined, ...(autoSlug ? { slug: undefined } : {}) } : current))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const siblings = itemsFor(items, company.id, kind).filter((i) => i.id !== item?.id)
    const found = validateCatalog(kind, values, siblings)
    setErrors(found)
    const first = fieldOrder.find((key) => found[key])
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${id(first)}`)?.focus()
      return
    }
    if (item) {
      update(company.id, item.id, values)
      onSaved(item, 'updated', values.name.trim())
    } else {
      onSaved(create(kind, company.id, values), 'added', values.name.trim())
    }
    onOpenChange(false)
  }

  const describedBy = (key: keyof CatalogFormValues, hint = false) => (errors[key] ? `${id(key)}-error` : hint ? `${id(key)}-hint` : undefined)
  const text = (key: TextKey, props: { placeholder?: string, inputMode?: 'decimal' | 'numeric', hint?: boolean } = {}) =>
    <Input id={id(key)} value={values[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, props.hint)}
      placeholder={props.placeholder} inputMode={props.inputMode} autoComplete="off" className="h-10 rounded-xl text-sm" />
  const area = (key: TextKey, rows: number, placeholder?: string, hint = false) =>
    <textarea id={id(key)} value={values[key]} onChange={(e) => set(key, e.target.value)} rows={rows} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, hint)} placeholder={placeholder} className={textareaClass} />
  const count = (key: 'shortDescription' | 'seoTitle' | 'seoDescription', max: number) => `${values[key].trim().length}/${max}`

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl gap-0 overflow-hidden bg-white p-0">
      <form ref={formRef} onSubmit={submit} noValidate className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-slate-100 py-5 pr-14 pl-6">
          <DialogTitle className="text-lg font-semibold text-ink">{item ? `Edit ${item.name}` : `Add ${noun}`}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-500">For <span className="font-medium text-slate-700">{company.name}</span> only. Demo — changes are kept in this browser session and are not saved to a server.</DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <FormSection title="Basics">
            <Field id={id('name')} label={kind === 'activity' ? 'Activity name' : 'Course title'} required error={errors.name}>{text('name', { placeholder: kind === 'activity' ? 'e.g. Sunset Kayak Tour' : 'e.g. Level 1 Paddle Course' })}</Field>
            <Field id={id('slug')} label="URL slug" required error={errors.slug} hint={`Used in the public link. ${slugTouched ? '' : 'Filled from the name until you edit it.'}`}>
              <Input id={id('slug')} value={values.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} aria-invalid={!!errors.slug} aria-describedby={describedBy('slug', true)} autoComplete="off" className="h-10 rounded-xl font-mono text-sm" />
            </Field>
            <Field id={id('shortDescription')} label="Short description" required error={errors.shortDescription} hint={count('shortDescription', 160)}>{area('shortDescription', 2, 'One or two sentences for listings', true)}</Field>
            <Field id={id('description')} label={kind === 'activity' ? 'Full description' : 'Full course description'} error={errors.description}>{area('description', 5)}</Field>
            <div className={cn('grid gap-3', kind === 'course' && 'sm:grid-cols-2')}>
              <Field id={id('category')} label={kind === 'activity' ? 'Activity category' : 'Course category'} required error={errors.category}>
                <FormSelect id={id('category')} items={optionsOf<string>(kind === 'activity' ? activityCategories : courseCategories)} value={values.category} onChange={(v) => set('category', v)} placeholder="Choose a category" invalid={!!errors.category} describedBy={describedBy('category')} />
              </Field>
              {kind === 'course' && <Field id={id('level')} label="Course level" required error={errors.level}>
                <FormSelect id={id('level')} items={optionsOf(courseLevels)} value={values.level as CourseLevel | ''} onChange={(v) => set('level', v)} placeholder="Choose a level" invalid={!!errors.level} describedBy={describedBy('level')} />
              </Field>}
            </div>
          </FormSection>

          <FormSection title="Images">
            <Field id={id('coverImage')} label={kind === 'activity' ? 'Cover image URL' : 'Thumbnail URL'} error={errors.coverImage} hint="https://… or a site path such as /images/kayak.jpg. File upload needs the backend.">{text('coverImage', { placeholder: 'https://', hint: true })}</Field>
            <Field id={id('gallery')} label="Gallery images" error={errors.gallery} hint="One URL per line, up to 8.">{area('gallery', 3, undefined, true)}</Field>
          </FormSection>

          <FormSection title="Price & duration">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field id={id('price')} label="Price" required error={errors.price} hint="Per guest. Use 0 for free.">{text('price', { inputMode: 'decimal', placeholder: '0', hint: true })}</Field>
              <Field id={id('currency')} label="Currency" required error={errors.currency}>
                <FormSelect id={id('currency')} items={optionsOf(currencies)} value={values.currency} onChange={(v) => set('currency', v)} />
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <Field id={id('durationValue')} label="Duration" required error={errors.durationValue}>{text('durationValue', { inputMode: 'decimal', placeholder: kind === 'activity' ? 'e.g. 2' : 'e.g. 3' })}</Field>
              <Field id={id('durationUnit')} label="Unit" required error={errors.durationUnit}>
                <FormSelect id={id('durationUnit')} items={optionsOf(durationUnits)} value={values.durationUnit} onChange={(v) => set('durationUnit', v)} />
              </Field>
            </div>
            {kind === 'activity' && <>
              <Field id={id('capacity')} label="Participant limit" error={errors.capacity} hint="Per session. Leave empty if there is no fixed limit.">{text('capacity', { inputMode: 'numeric', hint: true })}</Field>
              <Field id={id('locations')} label="Available locations" error={errors.locations} hint="Separate with commas.">{text('locations', { placeholder: 'e.g. Kovalam, Varkala', hint: true })}</Field>
            </>}
          </FormSection>

          {kind === 'course' && <FormSection title="Curriculum (optional)">
            <Field id={id('modules')} label="Modules" error={errors.modules} hint="Only if the course is taught in modules. Empty rows are ignored.">
              <ol className="flex flex-col gap-2" aria-describedby={describedBy('modules', true)}>
                {values.modules.map((title, i) => <li key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-slate-400">{i + 1}.</span>
                  <Input id={i === 0 ? id('modules') : undefined} aria-label={`Module ${i + 1} title`} value={title} onChange={(e) => set('modules', values.modules.map((m, j) => (j === i ? e.target.value : m)))} className="h-10 flex-1 rounded-xl text-sm" />
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove module ${i + 1}`} onClick={() => set('modules', values.modules.filter((_, j) => j !== i))}><Trash2 className="size-4 text-slate-400" /></Button>
                </li>)}
              </ol>
              <Button type="button" variant="outline" size="sm" className="h-8 w-fit rounded-full px-3 text-xs" onClick={() => set('modules', [...values.modules, ''])}><Plus data-icon="inline-start" />Add module</Button>
            </Field>
            <Field id={id('prerequisites')} label="Prerequisites" error={errors.prerequisites}>{area('prerequisites', 2, 'e.g. Able to swim 50 m')}</Field>
            <Field id={id('instructor')} label="Instructor" error={errors.instructor}>{text('instructor')}</Field>
          </FormSection>}

          <FormSection title="Availability & publishing">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={id('availability')} label="Availability" required error={errors.availability}>
                <FormSelect id={id('availability')} items={optionsOf(availabilityStatuses)} value={values.availability} onChange={(v) => set('availability', v)} />
              </Field>
              <Field id={id('publication')} label="Publication status" required error={errors.publication} hint="Drafts are hidden from customers.">
                <FormSelect id={id('publication')} items={optionsOf(publicationStatuses)} value={values.publication} onChange={(v) => set('publication', v)} describedBy={describedBy('publication', true)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="SEO (optional)">
            <Field id={id('seoTitle')} label="SEO title" error={errors.seoTitle} hint={count('seoTitle', 60)}>{text('seoTitle', { hint: true })}</Field>
            <Field id={id('seoDescription')} label="SEO description" error={errors.seoDescription} hint={count('seoDescription', 160)}>{area('seoDescription', 2, undefined, true)}</Field>
          </FormSection>

          {Object.values(errors).some(Boolean) && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Please fix the highlighted fields.</p>}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" className="h-10 rounded-full px-5 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light">{item ? 'Save changes' : `Add ${noun}`}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}

export function ActivityForm(props: CatalogFormProps) {
  return <CatalogForm kind="activity" {...props} />
}

export function CourseForm(props: CatalogFormProps) {
  return <CatalogForm kind="course" {...props} />
}
