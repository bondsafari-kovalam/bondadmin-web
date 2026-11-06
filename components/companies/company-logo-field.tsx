'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompanyAvatar } from '@/components/companies/company-avatar'
import { fileSize } from '@/lib/format'
import { COMPRESSIBLE_IMAGE_TYPES, compressImage } from '@/lib/image/compress-image'
import { LOGO_MAX_BYTES } from '@/services/companies.service'

/** Pending logo change in the company form; applied after the company itself is saved. */
export type LogoChange = { kind: 'keep' } | { kind: 'upload', file: File, originalBytes: number } | { kind: 'remove' }

/** Logos are shown at most ~64px; 512px keeps them sharp on high-density screens. */
const LOGO_MAX_DIMENSION = 512
const LOGO_QUALITY = 0.85
/** Largest file accepted before compression (the compressed upload must still be ≤ 1 MB). */
const SOURCE_MAX_BYTES = 15 * 1024 * 1024

/** Checks the picked file, then resizes and re-encodes it so the upload is small. */
async function prepareLogo(file: File): Promise<{ change?: LogoChange, error?: string }> {
  if (!(COMPRESSIBLE_IMAGE_TYPES as readonly string[]).includes(file.type)) return { error: 'Use a PNG, JPG, WebP, GIF or AVIF image.' }
  if (file.size > SOURCE_MAX_BYTES) return { error: `The image must be ${fileSize(SOURCE_MAX_BYTES)} or smaller.` }
  try {
    const result = await compressImage(file, { maxDimension: LOGO_MAX_DIMENSION, quality: LOGO_QUALITY })
    if (result.file.size > LOGO_MAX_BYTES) return { error: 'This image is still over 1 MB after compression. Try a simpler image.' }
    return { change: { kind: 'upload', file: result.file, originalBytes: result.originalBytes } }
  } catch {
    return { error: 'This image couldn’t be read. Try another file.' }
  }
}

interface CompanyLogoFieldProps {
  /** Logo currently saved for the company, if any. */
  currentUrl?: string
  change: LogoChange
  onChange: (change: LogoChange) => void
  error?: string
  onError: (message: string | undefined) => void
  /** Fallback avatar while there is no logo. */
  code: string
  color: string
  disabled?: boolean
  /** Lets the form hold off saving until the picked image is ready. */
  onBusyChange?: (busy: boolean) => void
}

export function CompanyLogoField({ currentUrl, change, onChange, error, onError, code, color, disabled, onBusyChange }: CompanyLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [compressing, setCompressing] = useState(false)
  const file = change.kind === 'upload' ? change.file : null
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const shownUrl = previewUrl ?? (change.kind === 'remove' ? undefined : currentUrl)

  const pick = async (picked: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!picked) return
    onError(undefined)
    setCompressing(true)
    onBusyChange?.(true)
    const { change: next, error: problem } = await prepareLogo(picked)
    setCompressing(false)
    onBusyChange?.(false)
    onError(problem)
    if (next) onChange(next)
  }

  const hint = compressing ? 'Optimising image…'
    : change.kind === 'upload' ? `${change.file.name} · ${fileSize(change.file.size)}${change.file.size < change.originalBytes ? ` (was ${fileSize(change.originalBytes)})` : ''} · uploads when you save`
    : 'PNG, JPG, WebP, GIF or AVIF. It’s resized to 512px and compressed before upload.'

  return <div className="flex flex-col gap-1.5">
    <span id="company-logo-label" className="text-xs font-medium text-slate-700">Logo <span className="font-normal text-slate-400">(optional)</span></span>
    <div className="flex items-center gap-3">
      <CompanyAvatar company={{ name: '', code: code || '—', color, logoUrl: shownUrl }} size="lg" />
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled || compressing} className="h-8 rounded-full px-3 text-xs" onClick={() => inputRef.current?.click()} aria-describedby={error ? 'company-logo-error' : 'company-logo-hint'}>
            <ImageUp data-icon="inline-start" />{compressing ? 'Optimising…' : shownUrl ? 'Replace logo' : 'Upload logo'}
          </Button>
          {shownUrl && <Button type="button" variant="ghost" size="sm" disabled={disabled || compressing} className="h-8 rounded-full px-3 text-xs text-slate-500" onClick={() => { onError(undefined); onChange(currentUrl && change.kind !== 'remove' ? { kind: 'remove' } : { kind: 'keep' }) }}>
            <X data-icon="inline-start" />Remove
          </Button>}
        </div>
        {error ? <p id="company-logo-error" className="text-[11px] text-red-600">{error}</p>
          : <p id="company-logo-hint" role="status" className="text-[11px] text-slate-400">{hint}</p>}
      </div>
    </div>
    <input ref={inputRef} type="file" accept={COMPRESSIBLE_IMAGE_TYPES.join(',')} className="hidden" aria-labelledby="company-logo-label" onChange={(e) => void pick(e.target.files?.[0])} />
  </div>
}
