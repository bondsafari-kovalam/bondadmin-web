'use client'

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { FileText, ImageUp, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fileSize } from '@/lib/format'
import { COMPRESSIBLE_IMAGE_TYPES, compressImage } from '@/lib/image/compress-image'
import { ACTIVITY_IMAGE_MAX_BYTES, GALLERY_MAX_IMAGES, ITINERARY_MAX_BYTES } from '@/services/catalog.service'
import type { GalleryImage, ItineraryFile } from '@/types/catalog'

/** Pending file change in the activity form; applied after the activity itself is saved. */
export type FileChange = { kind: 'keep' } | { kind: 'upload', file: File, originalBytes: number } | { kind: 'remove' }

/** Wide enough for full-width website banners while staying small. */
const IMAGE_MAX_DIMENSION = 1600
const IMAGE_QUALITY = 0.82
const IMAGE_SOURCE_MAX_BYTES = 20 * 1024 * 1024

/** Checks, resizes and re-encodes one picked image (main image and gallery use the same rules). */
async function prepareImage(picked: File): Promise<{ file?: File, originalBytes: number, error?: string }> {
  const originalBytes = picked.size
  if (!(COMPRESSIBLE_IMAGE_TYPES as readonly string[]).includes(picked.type)) return { originalBytes, error: `${picked.name}: use a PNG, JPG, WebP, GIF or AVIF image.` }
  if (picked.size > IMAGE_SOURCE_MAX_BYTES) return { originalBytes, error: `${picked.name}: the image must be ${fileSize(IMAGE_SOURCE_MAX_BYTES)} or smaller.` }
  try {
    const result = await compressImage(picked, { maxDimension: IMAGE_MAX_DIMENSION, quality: IMAGE_QUALITY })
    if (result.file.size > ACTIVITY_IMAGE_MAX_BYTES) return { originalBytes, error: `${picked.name}: still over 2 MB after compression. Try another image.` }
    return { file: result.file, originalBytes }
  } catch {
    return { originalBytes, error: `${picked.name}: this image couldn’t be read.` }
  }
}

interface FileFieldProps {
  id: string
  change: FileChange
  onChange: (change: FileChange) => void
  error?: string
  onError: (message: string | undefined) => void
  disabled?: boolean
  /** Lets the form hold off saving while a file is being prepared. */
  onBusyChange?: (busy: boolean) => void
}

function Hint({ id, error, children }: { id: string, error?: string, children: string }) {
  return error ? <p id={`${id}-error`} className="text-[11px] text-red-600">{error}</p> : <p id={`${id}-hint`} role="status" className="text-[11px] text-slate-400">{children}</p>
}

export function ActivityImageField({ id, currentUrl, change, onChange, error, onError, disabled, onBusyChange }: FileFieldProps & { currentUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const file = change.kind === 'upload' ? change.file : null
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  const shownUrl = previewUrl ?? (change.kind === 'remove' ? null : currentUrl)

  const pick = async (picked: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!picked) return
    onError(undefined)
    setBusy(true)
    onBusyChange?.(true)
    const result = await prepareImage(picked)
    setBusy(false)
    onBusyChange?.(false)
    if (result.file) onChange({ kind: 'upload', file: result.file, originalBytes: result.originalBytes })
    else onError(result.error)
  }

  const hint = busy ? 'Optimising image…'
    : change.kind === 'upload' ? `${change.file.name} · ${fileSize(change.file.size)}${change.file.size < change.originalBytes ? ` (was ${fileSize(change.originalBytes)})` : ''} · uploads when you save`
    : 'Resized to 1600px and compressed before upload. Landscape images work best.'

  return <div className="flex flex-col gap-2">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 sm:w-48">
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview or API-hosted image */}
        {shownUrl ? <img src={shownUrl} alt="" className="size-full object-cover" /> : <ImageUp className="size-6 text-slate-300" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button id={id} type="button" variant="outline" size="sm" disabled={disabled || busy} className="h-8 rounded-full px-3 text-xs" onClick={() => inputRef.current?.click()} aria-describedby={error ? `${id}-error` : `${id}-hint`}>
            <ImageUp data-icon="inline-start" />{busy ? 'Optimising…' : shownUrl ? 'Replace image' : 'Upload image'}
          </Button>
          {shownUrl && <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} className="h-8 rounded-full px-3 text-xs text-slate-500"
            onClick={() => { onError(undefined); onChange(currentUrl && change.kind !== 'remove' ? { kind: 'remove' } : { kind: 'keep' }) }}><X data-icon="inline-start" />Remove</Button>}
        </div>
        <Hint id={id} error={error}>{hint}</Hint>
      </div>
    </div>
    <input ref={inputRef} type="file" accept={COMPRESSIBLE_IMAGE_TYPES.join(',')} className="hidden" aria-label="Activity image file" onChange={(e) => void pick(e.target.files?.[0])} />
  </div>
}

/** Same check as the backend: a real PDF starts with "%PDF-". */
async function isPdf(file: File) {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  return String.fromCharCode(...head) === '%PDF-'
}

export function ItineraryField({ id, current, change, onChange, error, onError, disabled }: FileFieldProps & { current: ItineraryFile | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pending = change.kind === 'upload' ? change.file : null
  const shown = pending ? { name: pending.name, size: pending.size, url: null } : change.kind === 'remove' || !current ? null : { name: current.fileName, size: current.sizeBytes, url: current.url }

  const pick = async (picked: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!picked) return
    onError(undefined)
    if (picked.size > ITINERARY_MAX_BYTES) return onError('The PDF must be 5 MB or smaller.')
    if (!(await isPdf(picked))) return onError('Choose a PDF file.')
    // Some systems report an empty type; the upload must say application/pdf.
    const file = picked.type === 'application/pdf' ? picked : new File([picked], picked.name, { type: 'application/pdf' })
    onChange({ kind: 'upload', file, originalBytes: picked.size })
  }

  return <div className="flex flex-col gap-1.5">
    {shown && <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
      <FileText className="size-5 shrink-0 text-red-500" />
      <div className="min-w-0 flex-1">
        {shown.url ? <a href={shown.url} className="block truncate text-xs font-medium text-forest hover:underline">{shown.name}</a> : <span className="block truncate text-xs font-medium text-slate-700">{shown.name}</span>}
        <span className="text-[11px] text-slate-400">{fileSize(shown.size)}{pending ? ' · uploads when you save' : ''}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label="Remove itinerary" onClick={() => { onError(undefined); onChange(current && change.kind !== 'remove' ? { kind: 'remove' } : { kind: 'keep' }) }}><X className="size-4 text-slate-400" /></Button>
    </div>}
    <Button id={id} type="button" variant="outline" size="sm" disabled={disabled} className="h-8 w-fit rounded-full px-3 text-xs" onClick={() => inputRef.current?.click()} aria-describedby={error ? `${id}-error` : `${id}-hint`}>
      <Upload data-icon="inline-start" />{shown ? 'Replace PDF' : 'Upload PDF'}
    </Button>
    <Hint id={id} error={error}>PDF, up to 5 MB. Customers can download it from the website.</Hint>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" aria-label="Itinerary PDF file" onChange={(e) => void pick(e.target.files?.[0])} />
  </div>
}

/** Pending gallery edits; applied after the activity is saved (removals first, then uploads in order). */
export interface GalleryChange { removed: string[], added: { key: string, file: File }[] }
export const noGalleryChange: GalleryChange = { removed: [], added: [] }

let addedSequence = 0

interface GalleryFieldProps {
  id: string
  current: GalleryImage[]
  change: GalleryChange
  onChange: Dispatch<SetStateAction<GalleryChange>>
  error?: string
  onError: (message: string | undefined) => void
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

/** Several images picked from files, compressed like the main image. Up to 8 in total. */
export function GalleryField({ id, current, change, onChange, error, onError, disabled, onBusyChange }: GalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const previews = useMemo(() => change.added.map((a) => ({ key: a.key, url: URL.createObjectURL(a.file), file: a.file })), [change.added])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  const kept = current.filter((g) => !change.removed.includes(g.id))
  const remaining = GALLERY_MAX_IMAGES - kept.length - change.added.length

  const pick = async (files: FileList | null) => {
    const picked = Array.from(files ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (picked.length === 0) return
    onError(undefined)
    setBusy(true)
    onBusyChange?.(true)
    const problems: string[] = []
    const ready: GalleryChange['added'] = []
    for (const file of picked.slice(0, Math.max(0, remaining))) {
      const result = await prepareImage(file)
      if (result.file) ready.push({ key: `new-${++addedSequence}`, file: result.file })
      else if (result.error) problems.push(result.error)
    }
    if (picked.length > remaining) problems.push(`Only ${GALLERY_MAX_IMAGES} gallery images are allowed; ${picked.length - Math.max(0, remaining)} not added.`)
    setBusy(false)
    onBusyChange?.(false)
    onChange((c) => ({ ...c, added: [...c.added, ...ready] }))
    onError(problems.length ? problems.join(' ') : undefined)
  }

  const tile = 'relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50'
  const removeButton = (label: string, onClick: () => void) => <button type="button" aria-label={label} disabled={disabled || busy} onClick={onClick}
    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-red-600 disabled:opacity-50"><X className="size-3.5" /></button>

  return <div className="flex flex-col gap-2">
    {(kept.length > 0 || previews.length > 0) && <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Gallery images">
      {kept.map((g, i) => <li key={g.id} className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element -- API-hosted image */}
        <img src={g.url} alt={`Gallery image ${i + 1}`} loading="lazy" className="size-full object-cover" />
        {removeButton(`Remove gallery image ${i + 1}`, () => onChange((c) => ({ ...c, removed: [...c.removed, g.id] })))}
      </li>)}
      {previews.map((p, i) => <li key={p.key} className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
        <img src={p.url} alt={`New gallery image ${i + 1}`} className="size-full object-cover" />
        <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-1.5 text-[10px] font-medium text-slate-600">New · {fileSize(p.file.size)}</span>
        {removeButton(`Remove new gallery image ${i + 1}`, () => onChange((c) => ({ ...c, added: c.added.filter((a) => a.key !== p.key) })))}
      </li>)}
    </ul>}
    <Button id={id} type="button" variant="outline" size="sm" disabled={disabled || busy || remaining <= 0} className="h-8 w-fit rounded-full px-3 text-xs"
      onClick={() => inputRef.current?.click()} aria-describedby={error ? `${id}-error` : `${id}-hint`}>
      <ImageUp data-icon="inline-start" />{busy ? 'Optimising…' : 'Add images'}
    </Button>
    <Hint id={id} error={error}>{`${kept.length + change.added.length}/${GALLERY_MAX_IMAGES} images. Select several files at once; each is resized to 1600px and compressed. New images upload when you save.`}</Hint>
    <input ref={inputRef} type="file" multiple accept={COMPRESSIBLE_IMAGE_TYPES.join(',')} className="hidden" aria-label="Gallery image files" onChange={(e) => void pick(e.target.files)} />
  </div>
}
