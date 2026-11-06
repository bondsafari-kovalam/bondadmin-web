/** Raster types the browser can decode for compression. SVG is excluded (the backend rejects it). */
export const COMPRESSIBLE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'] as const

export interface CompressOptions {
  /** Longest side of the output, in pixels. Smaller images are never upscaled. */
  maxDimension: number
  /** Lossy quality for WebP, 0–1. */
  quality: number
}

export interface CompressedImage {
  file: File
  width: number
  height: number
  originalBytes: number
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Resizes and re-encodes an image in the browser. Output is WebP, or PNG where the browser
 * cannot encode WebP; both keep transparency, which logos often need. Returns the original
 * file when re-encoding would not make it smaller and it already fits.
 */
export async function compressImage(file: File, { maxDimension, quality }: CompressOptions): Promise<CompressedImage> {
  // 'from-image' applies EXIF rotation so phone photos are not sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Image compression is not supported in this browser.')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)

    // Browsers that cannot encode WebP silently return PNG, so check the result type.
    let blob = await canvasToBlob(canvas, 'image/webp', quality)
    if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/png')
    if (!blob) throw new Error('Could not process this image.')

    const keepOriginal = scale === 1 && file.size <= blob.size && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    if (keepOriginal) return { file, width, height, originalBytes: file.size }

    const ext = blob.type === 'image/webp' ? 'webp' : 'png'
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'logo'}.${ext}`
    return { file: new File([blob], name, { type: blob.type, lastModified: Date.now() }), width, height, originalBytes: file.size }
  } finally {
    bitmap.close()
  }
}
