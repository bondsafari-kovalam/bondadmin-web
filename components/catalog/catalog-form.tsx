'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { FaqEditor } from '@/components/catalog/faq-editor'
import { OfferingEditor } from '@/components/catalog/offering-editor'
import { ActivityImageField, GalleryField, ItineraryField, noGalleryChange, type FileChange, type GalleryChange } from '@/components/catalog/activity-file-fields'
import { ChipSelect } from '@/components/shared/chip-select'
import { FormSelect, optionsOf } from '@/components/shared/form-controls'
import { ListEditor } from '@/components/shared/list-editor'
import { Field, FormSection, textareaClass } from '@/components/shared/form-field'
import { useCatalog } from '@/hooks/use-catalog'
import { itemsFor, slugify, toFormValues } from '@/lib/catalog'
import type { ApiError } from '@/lib/api/errors'
import { validateCatalog, type CatalogErrors } from '@/lib/validation/catalog'
import { cn } from '@/lib/utils'
import { toCatalogItem, toCatalogPayload, type ActivityFile, type CatalogItemDto } from '@/services/catalog.service'
import { useAppDispatch } from '@/store/hooks'
import { addCourseGalleryImage, addGalleryImage, createCatalogItem, removeActivityFile, removeCourseGalleryImage, removeCourseImage, removeGalleryImage, updateCatalogItem, uploadActivityFile, uploadCourseImage } from '@/store/slices/catalog-slice'
import { activityCategories, activityNextSteps, activityTaxonomy, availabilityStatuses, courseCategories, courseLevels, currencies, difficultyLevels, durationUnits, monthNames, publicationStatuses, type ActivityCategory, type ActivityNextStep, type CatalogFormValues, type CatalogItem, type CatalogKind, type CourseLevel, type DifficultyLevel } from '@/types/catalog'
import type { Company } from '@/types/company'

export interface CatalogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The company the record belongs to — new records are created under this company only. */
  company: Company
  /** Record to edit; null to add a new one. */
  item: CatalogItem | null
  /** `warning` is set when the record saved but one of its files did not upload. */
  onSaved: (item: CatalogItem | null, mode: 'added' | 'updated', name: string, warning?: string) => void
}

const monthOptions = monthNames.map((label, i) => ({ value: i + 1, label }))
const nextStepOptions = (Object.keys(activityNextSteps) as ActivityNextStep[]).map((value) => ({ value, label: activityNextSteps[value] }))
const keep: FileChange = { kind: 'keep' }
/** Fields stack on phones and tablets and sit side by side on desktop. */
const row2 = 'grid grid-cols-1 gap-4 lg:grid-cols-2'
const row3 = 'grid grid-cols-1 gap-4 lg:grid-cols-3'

/** Free-text fields rendered with <Input> / <textarea>. */
type TextKey = 'name' | 'slug' | 'shortDescription' | 'description' | 'coverImage' | 'gallery' | 'price' | 'durationValue' | 'totalSlots' | 'minAge' | 'maxAltitude' | 'locations' | 'prerequisites' | 'instructor' | 'seoTitle' | 'seoDescription' | 'websiteCategory' | 'imageAlt' | 'groupSize' | 'sessionFormat' | 'swimmingRequirement' | 'healthRequirement' | 'safetyEquipment' | 'safetySupervision' | 'safetyWeather'

/** Backend error → form field. API paths such as `duration.value` or `modules.2` use the top-level name. */
function serverErrors(error: ApiError | undefined): CatalogErrors {
  const found: CatalogErrors = {}
  for (const [path, message] of Object.entries(error?.fieldErrors ?? {})) {
    const key = (path === 'duration' ? 'durationValue' : path) as keyof CatalogFormValues
    found[key] = message
  }
  // Duplicate name / slug come back as 409 CONFLICT with a message naming the field.
  if (error?.code === 'CONFLICT') {
    if (/slug/i.test(error.message)) found.slug = error.message
    else if (/name/i.test(error.message)) found.name = error.message
  }
  return found
}

/** Form order, so the first invalid field gets focus. */
const fieldOrder: (keyof CatalogFormValues)[] = ['name', 'slug', 'shortDescription', 'description', 'highlights', 'category', 'tags', 'level', 'durationValue', 'durationUnit', 'timeSlots', 'totalSlots', 'minAge', 'maxAltitude', 'difficulty', 'bestSeasonMonths', 'websiteCategory', 'imageAlt', 'skillLevel', 'groupSize', 'sessionFormat', 'swimmingRequirement', 'healthRequirement', 'learningOutcomes', 'inclusions', 'whatToBring', 'safetyEquipment', 'safetySupervision', 'safetyWeather', 'faqs', 'relatedSlugs', 'nextSteps', 'modules', 'prerequisites', 'instructor', 'price', 'currency', 'locations', 'offerings', 'coverImage', 'gallery', 'availability', 'publication', 'seoTitle', 'seoDescription']

function CatalogForm({ kind, open, onOpenChange, company, item, onSaved }: CatalogFormProps & { kind: CatalogKind }) {
  const { items } = useCatalog(company.id)
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [values, setValues] = useState<CatalogFormValues>(() => toFormValues(item, kind))
  const [errors, setErrors] = useState<CatalogErrors>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const [image, setImage] = useState<FileChange>(keep)
  const [itinerary, setItinerary] = useState<FileChange>(keep)
  const [gallery, setGallery] = useState<GalleryChange>(noGalleryChange)
  const [fileErrors, setFileErrors] = useState<{ image?: string, itinerary?: string, gallery?: string }>({})
  const [imageBusy, setImageBusy] = useState(false)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const preparing = imageBusy || galleryBusy
  const activity = item?.kind === 'activity' ? item : null
  const course = item?.kind === 'course' ? item : null
  const formRef = useRef<HTMLFormElement>(null)
  const noun = kind === 'activity' ? 'activity' : 'course'
  const id = (key: keyof CatalogFormValues) => `${kind}-${key}`

  // Load the selected record each time the form opens.
  useEffect(() => {
    if (!open) return
    setValues(toFormValues(item, kind))
    setErrors({})
    setFormError(null)
    setSlugTouched(item !== null)
    setImage(keep)
    setItinerary(keep)
    setGallery(noGalleryChange)
    setFileErrors({})
  }, [open, item, kind])

  const set = <K extends keyof CatalogFormValues>(key: K, value: CatalogFormValues[K]) => {
    // While the slug follows the name, a name change also replaces the slug — so clear its error too.
    const autoSlug = key === 'name' && !slugTouched
    setValues((current) => ({ ...current, [key]: value, ...(autoSlug ? { slug: slugify(String(value)) } : {}) }))
    setErrors((current) => (current[key] || (autoSlug && current.slug) ? { ...current, [key]: undefined, ...(autoSlug ? { slug: undefined } : {}) } : current))
  }

  /** A new master category keeps only the tags that belong to it. */
  const setCategory = (category: string) => {
    const allowed: readonly string[] = activityTaxonomy[category as ActivityCategory] ?? []
    setValues((current) => ({ ...current, category, tags: current.tags.filter((t) => allowed.includes(t)) }))
    setErrors((current) => ({ ...current, category: undefined, tags: undefined }))
  }

  // Files need the activity id, so they are sent after the activity is saved.
  const applyFiles = async (saved: CatalogItemDto): Promise<{ saved: CatalogItemDto, warning?: string }> => {
    const failed: string[] = []
    let latest = saved
    const changes: [ActivityFile, FileChange, string][] = [['image', image, 'image']]
    if (kind === 'activity') changes.push(['itinerary', itinerary, 'itinerary PDF'])
    for (const [file, change, label] of changes) {
      if (change.kind === 'keep') continue
      const args = { companyId: company.id, id: saved.id, file }
      const result = kind === 'course'
        ? change.kind === 'upload' ? await dispatch(uploadCourseImage({ companyId: company.id, id: saved.id, data: change.file })) : await dispatch(removeCourseImage({ companyId: company.id, id: saved.id }))
        : change.kind === 'upload' ? await dispatch(uploadActivityFile({ ...args, data: change.file })) : await dispatch(removeActivityFile(args))
      if (uploadActivityFile.fulfilled.match(result) || removeActivityFile.fulfilled.match(result)) latest = result.payload
      else if (uploadCourseImage.fulfilled.match(result) || removeCourseImage.fulfilled.match(result)) latest = result.payload
      else failed.push(`${label} (${result.payload?.message ?? 'please try again'})`)
    }
    // Gallery: removals first so the 8-image limit leaves room for the new ones.
    let galleryFailures = 0
    for (const imageId of gallery.removed) {
      const result = kind === 'course'
        ? await dispatch(removeCourseGalleryImage({ companyId: company.id, id: saved.id, imageId }))
        : await dispatch(removeGalleryImage({ companyId: company.id, id: saved.id, imageId }))
      if (removeGalleryImage.fulfilled.match(result) || removeCourseGalleryImage.fulfilled.match(result)) latest = result.payload
      else galleryFailures++
    }
    for (const added of gallery.added) {
      const result = kind === 'course'
        ? await dispatch(addCourseGalleryImage({ companyId: company.id, id: saved.id, data: added.file }))
        : await dispatch(addGalleryImage({ companyId: company.id, id: saved.id, data: added.file }))
      if (addGalleryImage.fulfilled.match(result) || addCourseGalleryImage.fulfilled.match(result)) latest = result.payload
      else galleryFailures++
    }
    if (galleryFailures) failed.push(`${galleryFailures} gallery image${galleryFailures === 1 ? '' : 's'}`)
    return { saved: latest, warning: failed.length ? `Saved, but the ${failed.join(' and ')} could not be updated.` : undefined }
  }

  const focus = (key: keyof CatalogFormValues) => formRef.current?.querySelector<HTMLElement>(`#${id(key)}`)?.focus()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || preparing) return
    const siblings = itemsFor(items, company.id, kind).filter((i) => i.id !== item?.id)
    const found = validateCatalog(kind, values, siblings)
    setErrors(found)
    setFormError(null)
    const first = fieldOrder.find((key) => found[key])
    if (first) return focus(first)

    setSubmitting(true)
    const payload = toCatalogPayload(kind, values, item)
    const action = item
      ? await dispatch(updateCatalogItem({ companyId: company.id, kind, id: item.id, payload }))
      : await dispatch(createCatalogItem({ companyId: company.id, kind, payload }))
    setSubmitting(false)

    if (createCatalogItem.fulfilled.match(action) || updateCatalogItem.fulfilled.match(action)) {
      setSubmitting(true)
      const { saved, warning } = await applyFiles(action.payload)
      setSubmitting(false)
      onSaved(toCatalogItem(saved), item ? 'updated' : 'added', saved.name, warning)
      onOpenChange(false)
      return
    }
    const fromServer = serverErrors(action.payload)
    setErrors(fromServer)
    setFormError(action.payload?.message ?? `Could not save the ${noun}. Please try again.`)
    const firstServer = fieldOrder.find((key) => fromServer[key])
    if (firstServer) focus(firstServer)
  }

  const describedBy = (key: keyof CatalogFormValues, hint = false) => (errors[key] ? `${id(key)}-error` : hint ? `${id(key)}-hint` : undefined)
  const text = (key: TextKey, props: { placeholder?: string, inputMode?: 'decimal' | 'numeric', hint?: boolean } = {}) =>
    <Input id={id(key)} value={values[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, props.hint)}
      placeholder={props.placeholder} inputMode={props.inputMode} autoComplete="off" className="h-10 rounded-xl text-sm" />
  const area = (key: TextKey, rows: number, placeholder?: string, hint = false) =>
    <textarea id={id(key)} value={values[key]} onChange={(e) => set(key, e.target.value)} rows={rows} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, hint)} placeholder={placeholder} className={textareaClass} />
  const count = (key: 'shortDescription' | 'seoTitle' | 'seoDescription', max: number) => `${values[key].trim().length}/${max}`

  const isActivity = kind === 'activity'
  const tagOptions = (activityTaxonomy[values.category as ActivityCategory] ?? []).map((t) => ({ value: t, label: t }))
  const relatedOptions = itemsFor(items, company.id, 'activity').filter((i) => i.id !== item?.id).map((i) => ({ value: i.slug, label: i.name }))
  const list = (key: 'learningOutcomes' | 'inclusions' | 'whatToBring', itemLabel: string, addLabel: string) =>
    <ListEditor id={id(key)} values={values[key]} onChange={(v) => set(key, v)} itemLabel={itemLabel} addLabel={addLabel} max={12} describedBy={describedBy(key)} invalid={!!errors[key]} />

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl gap-0 overflow-hidden bg-white p-0 lg:max-w-5xl">
      <form ref={formRef} onSubmit={submit} noValidate className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-slate-100 py-5 pr-14 pl-6">
          <DialogTitle className="text-lg font-semibold text-ink">{item ? `Edit ${item.name}` : `Add ${noun}`}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-500">For <span className="font-medium text-slate-700">{company.name}</span> only. Published records appear on the website; drafts stay private.</DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <FormSection title={isActivity ? 'Activity details' : 'Basics'}>
            <div className={row2}>
              <Field id={id('name')} label={isActivity ? 'Activity name' : 'Course title'} required error={errors.name}>{text('name', { placeholder: isActivity ? 'e.g. Sunset Kayak Tour' : 'e.g. Level 1 Paddle Course' })}</Field>
              <Field id={id('slug')} label="URL slug" required error={errors.slug} hint={`Used in the public link. ${slugTouched ? '' : 'Filled from the name until you edit it.'}`}>
                <Input id={id('slug')} value={values.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} aria-invalid={!!errors.slug} aria-describedby={describedBy('slug', true)} autoComplete="off" className="h-10 rounded-xl font-mono text-sm" />
              </Field>
            </div>
            <div className={row2}>
              <Field id={`${kind}-image`} label={`${isActivity ? 'Activity' : 'Course'} image`} error={fileErrors.image}>
                <ActivityImageField id={`${kind}-image`} currentUrl={(isActivity ? activity?.imageUrl : course?.imageUrl) ?? null} change={image} onChange={setImage} error={fileErrors.image}
                  onError={(message) => setFileErrors((c) => ({ ...c, image: message }))} disabled={submitting} onBusyChange={setImageBusy} />
              </Field>
              <Field id={id('shortDescription')} label="Short description" required error={errors.shortDescription} hint={`Shown on listing cards. ${count('shortDescription', 160)}`}>{area('shortDescription', 2, 'One or two sentences for listings', true)}</Field>
            </div>
            <div className={row2}>
              <Field id={id('description')} label={isActivity ? 'About the experience' : 'Full course description'} error={errors.description}>{area('description', 5, isActivity ? 'What guests will do, see and feel' : undefined)}</Field>
              {isActivity && <Field id={id('highlights')} label="Highlights" error={errors.highlights} hint="Short points, up to 12.">
                <ListEditor id={id('highlights')} values={values.highlights} onChange={(v) => set('highlights', v)} itemLabel="Highlight" addLabel="Add highlight" max={12}
                  placeholder="e.g. Sunrise view from the ridge" describedBy={describedBy('highlights', true)} invalid={!!errors.highlights} />
              </Field>}
              {!isActivity && <div className="grid gap-3 sm:grid-cols-2">
                <Field id={id('category')} label="Course category" required error={errors.category}>
                  <FormSelect id={id('category')} items={optionsOf<string>(courseCategories)} value={values.category} onChange={(v) => set('category', v)} placeholder="Choose a category" invalid={!!errors.category} describedBy={describedBy('category')} />
                </Field>
                <Field id={id('level')} label="Course level" required error={errors.level}>
                  <FormSelect id={id('level')} items={optionsOf(courseLevels)} value={values.level as CourseLevel | ''} onChange={(v) => set('level', v)} placeholder="Choose a level" invalid={!!errors.level} describedBy={describedBy('level')} />
                </Field>
              </div>}
            </div>
          </FormSection>

          {isActivity && <FormSection title="Category">
            <div className={row2}>
              <Field id={id('category')} label="Master category" required error={errors.category}>
                <FormSelect id={id('category')} items={optionsOf<string>(activityCategories)} value={values.category} onChange={setCategory} placeholder="Choose a master category" invalid={!!errors.category} describedBy={describedBy('category')} />
              </Field>
              <Field id={id('tags')} label="Category tags" error={errors.tags} hint="Up to 10. Website visitors can filter by these.">
                <ChipSelect id={id('tags')} label="Category tags" options={tagOptions} selected={values.tags} onChange={(v) => set('tags', v)} max={10}
                  describedBy={describedBy('tags', true)} invalid={!!errors.tags} emptyText="Choose a master category first." />
              </Field>
            </div>
          </FormSection>}

          <FormSection title={isActivity ? 'Duration & slots' : 'Duration'}>
            <div className={row3}>
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <Field id={id('durationValue')} label="Duration" required error={errors.durationValue}>{text('durationValue', { inputMode: 'decimal', placeholder: isActivity ? 'e.g. 2' : 'e.g. 3' })}</Field>
                <Field id={id('durationUnit')} label="Unit" required error={errors.durationUnit}>
                  <FormSelect id={id('durationUnit')} items={optionsOf(durationUnits)} value={values.durationUnit} onChange={(v) => set('durationUnit', v)} />
                </Field>
              </div>
              {isActivity && <>
                <Field id={id('timeSlots')} label="Time slots" error={errors.timeSlots} hint="Daily start times. Leave empty for flexible timing.">
                  <ListEditor id={id('timeSlots')} type="time" values={values.timeSlots} onChange={(v) => set('timeSlots', v)} itemLabel="Time slot" addLabel="Add time slot" max={12}
                    describedBy={describedBy('timeSlots', true)} invalid={!!errors.timeSlots} />
                </Field>
                <Field id={id('totalSlots')} label="Total slots" error={errors.totalSlots} hint="Seats per time slot. Leave empty if there is no fixed limit.">{text('totalSlots', { inputMode: 'numeric', placeholder: 'e.g. 12', hint: true })}</Field>
              </>}
            </div>
          </FormSection>

          {isActivity && <FormSection title="Requirements & season">
            <div className={row2}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id={id('minAge')} label="Min age" error={errors.minAge} hint="Years">{text('minAge', { inputMode: 'numeric', placeholder: 'e.g. 12', hint: true })}</Field>
                <Field id={id('maxAltitude')} label="Max altitude" error={errors.maxAltitude} hint="Metres">{text('maxAltitude', { inputMode: 'numeric', placeholder: 'e.g. 1868', hint: true })}</Field>
                <Field id={id('difficulty')} label="Difficulty level" error={errors.difficulty}>
                  <FormSelect id={id('difficulty')} items={optionsOf(difficultyLevels)} value={values.difficulty as DifficultyLevel | ''} onChange={(v) => set('difficulty', v)} placeholder="Not set" invalid={!!errors.difficulty} describedBy={describedBy('difficulty')} />
                  {values.difficulty && <button type="button" onClick={() => set('difficulty', '')} className="w-fit text-[11px] text-slate-500 hover:text-forest hover:underline">Clear</button>}
                </Field>
              </div>
              <Field id={id('bestSeasonMonths')} label="Best season" error={errors.bestSeasonMonths} hint="Select the best months to go.">
                <ChipSelect id={id('bestSeasonMonths')} label="Best season months" options={monthOptions} selected={values.bestSeasonMonths} onChange={(v) => set('bestSeasonMonths', v)}
                  describedBy={describedBy('bestSeasonMonths', true)} invalid={!!errors.bestSeasonMonths} />
              </Field>
            </div>
          </FormSection>}

          {isActivity && <FormSection title="Custom itinerary">
            <Field id="activity-itinerary" label="Itinerary PDF" error={fileErrors.itinerary}>
              <ItineraryField id="activity-itinerary" current={activity?.itinerary ?? null} change={itinerary} onChange={setItinerary} error={fileErrors.itinerary}
                onError={(message) => setFileErrors((c) => ({ ...c, itinerary: message }))} disabled={submitting} />
            </Field>
          </FormSection>}

          {isActivity && <FormSection title="Website details (optional)">
            <p className="-mt-2 text-[11px] text-slate-400">Only needed if this company’s website shows them. Leave empty otherwise.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field id={id('websiteCategory')} label="Website category" error={errors.websiteCategory} hint="Label and filter on the website.">{text('websiteCategory', { placeholder: 'e.g. Guided experience', hint: true })}</Field>
              <Field id={id('skillLevel')} label="Skill level" error={errors.skillLevel}>
                <FormSelect id={id('skillLevel')} items={optionsOf(courseLevels)} value={values.skillLevel as CourseLevel | ''} onChange={(v) => set('skillLevel', v)} placeholder="Not set" invalid={!!errors.skillLevel} describedBy={describedBy('skillLevel')} />
                {values.skillLevel && <button type="button" onClick={() => set('skillLevel', '')} className="w-fit text-[11px] text-slate-500 hover:text-forest hover:underline">Clear</button>}
              </Field>
              <Field id={id('groupSize')} label="Group size" error={errors.groupSize}>{text('groupSize', { placeholder: 'e.g. 2–8 guests' })}</Field>
              <Field id={id('sessionFormat')} label="Session format" error={errors.sessionFormat}>{text('sessionFormat', { placeholder: 'e.g. Guided group session' })}</Field>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
              <Field id={id('imageAlt')} label="Image description" error={errors.imageAlt} hint="Describes the activity image for screen readers.">{text('imageAlt', { placeholder: 'e.g. Paddler in an orange kayak beside the reeds', hint: true })}</Field>
              <label className="flex w-fit items-center gap-2 text-xs font-medium text-slate-700">
                <input id={id('featured')} type="checkbox" checked={values.featured} onChange={(e) => set('featured', e.target.checked)} className="size-4 accent-forest" />Feature on the website
              </label>
            </div>
            <div className={row2}>
              <Field id={id('swimmingRequirement')} label="Swimming ability" error={errors.swimmingRequirement}>{area('swimmingRequirement', 2)}</Field>
              <Field id={id('healthRequirement')} label="Physical & health requirements" error={errors.healthRequirement}>{area('healthRequirement', 2)}</Field>
            </div>
            <div className={row3}>
              <Field id={id('learningOutcomes')} label="Learning outcomes" error={errors.learningOutcomes}>{list('learningOutcomes', 'Learning outcome', 'Add outcome')}</Field>
              <Field id={id('inclusions')} label="What’s included" error={errors.inclusions}>{list('inclusions', 'Inclusion', 'Add inclusion')}</Field>
              <Field id={id('whatToBring')} label="What to bring" error={errors.whatToBring}>{list('whatToBring', 'Item to bring', 'Add item')}</Field>
            </div>
            <div className={row3}>
              <Field id={id('safetyEquipment')} label="Equipment & buoyancy aids" error={errors.safetyEquipment}>{area('safetyEquipment', 2)}</Field>
              <Field id={id('safetySupervision')} label="Guides & supervision" error={errors.safetySupervision}>{area('safetySupervision', 2)}</Field>
              <Field id={id('safetyWeather')} label="Weather & session closures" error={errors.safetyWeather}>{area('safetyWeather', 2)}</Field>
            </div>
            <Field id={id('faqs')} label="FAQs" error={errors.faqs}>
              <FaqEditor id={id('faqs')} values={values.faqs} onChange={(v) => set('faqs', v)} max={12} describedBy={describedBy('faqs')} invalid={!!errors.faqs} />
            </Field>
            <div className={row2}>
              <Field id={id('relatedSlugs')} label="Related activities" error={errors.relatedSlugs} hint="Up to 6 of this company’s other activities.">
                <ChipSelect id={id('relatedSlugs')} label="Related activities" options={relatedOptions} selected={values.relatedSlugs} onChange={(v) => set('relatedSlugs', v)} max={6}
                  describedBy={describedBy('relatedSlugs', true)} invalid={!!errors.relatedSlugs} emptyText="This company has no other activities yet." />
              </Field>
              <Field id={id('nextSteps')} label="Next steps" error={errors.nextSteps} hint="Links shown at the end of the activity page.">
                <ChipSelect id={id('nextSteps')} label="Next steps" options={nextStepOptions} selected={values.nextSteps} onChange={(v) => set('nextSteps', v)}
                  describedBy={describedBy('nextSteps', true)} invalid={!!errors.nextSteps} />
              </Field>
            </div>
          </FormSection>}

          <FormSection title={isActivity ? 'Price & location' : 'Pricing'}>
            <div className={row2}>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Field id={id('price')} label="Price" required error={errors.price} hint="Per guest. Use 0 for free.">{text('price', { inputMode: 'decimal', placeholder: '0', hint: true })}</Field>
                <Field id={id('currency')} label="Currency" required error={errors.currency}>
                  <FormSelect id={id('currency')} items={optionsOf(currencies)} value={values.currency} onChange={(v) => set('currency', v)} />
                </Field>
              </div>
              {isActivity && <Field id={id('locations')} label="Available locations" error={errors.locations} hint="Separate with commas.">{text('locations', { placeholder: 'e.g. Kovalam, Varkala', hint: true })}</Field>}
            </div>
            {isActivity && <Field id={id('offerings')} label="Location details" error={errors.offerings} hint="For websites that list each location separately. Empty price or duration uses the activity’s own.">
              <OfferingEditor id={id('offerings')} values={values.offerings} onChange={(v) => set('offerings', v)} max={20} currency={values.currency} describedBy={describedBy('offerings', true)} invalid={!!errors.offerings} />
            </Field>}
          </FormSection>

          {!isActivity && <FormSection title="Curriculum (optional)">
            <div className={row2}>
              <Field id={id('modules')} label="Modules" error={errors.modules} hint="Only if the course is taught in modules. Empty rows are ignored.">
                <ListEditor id={id('modules')} values={values.modules} onChange={(v) => set('modules', v)} itemLabel="Module" addLabel="Add module" max={30} numbered
                  describedBy={describedBy('modules', true)} invalid={!!errors.modules} />
              </Field>
              <div className="flex flex-col gap-4">
                <Field id={id('prerequisites')} label="Prerequisites" error={errors.prerequisites}>{area('prerequisites', 2, 'e.g. Able to swim 50 m')}</Field>
                <Field id={id('instructor')} label="Instructor" error={errors.instructor}>{text('instructor')}</Field>
              </div>
            </div>
          </FormSection>}

          <FormSection title="Gallery (optional)">
            <Field id={`${kind}-gallery`} label="Gallery images" error={fileErrors.gallery}>
              <GalleryField id={`${kind}-gallery`} current={(isActivity ? activity?.galleryImages : course?.galleryImages) ?? []} change={gallery} onChange={setGallery} error={fileErrors.gallery}
                onError={(message) => setFileErrors((c) => ({ ...c, gallery: message }))} disabled={submitting} onBusyChange={setGalleryBusy} />
            </Field>
          </FormSection>

          <FormSection title="Availability & publishing">
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              <Field id={id('availability')} label="Availability" required error={errors.availability}>
                <FormSelect id={id('availability')} items={optionsOf(availabilityStatuses)} value={values.availability} onChange={(v) => set('availability', v)} />
              </Field>
              <Field id={id('publication')} label="Publication status" required error={errors.publication} hint="Drafts are hidden from customers.">
                <FormSelect id={id('publication')} items={optionsOf(publicationStatuses)} value={values.publication} onChange={(v) => set('publication', v)} describedBy={describedBy('publication', true)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="SEO (optional)">
            <div className={row2}>
              <Field id={id('seoTitle')} label="SEO title" error={errors.seoTitle} hint={count('seoTitle', 60)}>{text('seoTitle', { hint: true })}</Field>
              <Field id={id('seoDescription')} label="SEO description" error={errors.seoDescription} hint={count('seoDescription', 160)}>{area('seoDescription', 2, undefined, true)}</Field>
            </div>
          </FormSection>

          {(formError || Object.values(errors).some(Boolean)) && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError ?? 'Please fix the highlighted fields.'}</p>}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" disabled={submitting} className="h-10 rounded-full px-5 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={submitting || preparing} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light">{submitting ? 'Saving…' : item ? 'Save changes' : `Add ${noun}`}</Button>
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
