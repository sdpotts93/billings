import { createError } from 'h3'
import type { H3Event } from 'h3'

type R2Object = {
  arrayBuffer: () => Promise<ArrayBuffer>
  httpMetadata?: {
    contentType?: string
  }
}

type R2BucketBinding = {
  get: (key: string) => Promise<R2Object | null>
  put: (
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: {
        contentType?: string
      }
    }
  ) => Promise<void>
}

const VALID_IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
const MAX_IMAGE_BYTES = 256 * 1024

const isR2BucketBinding = (value: unknown): value is R2BucketBinding => {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as R2BucketBinding).get === 'function'
    && typeof (value as R2BucketBinding).put === 'function'
  )
}

const decodeBase64 = (base64: string) => {
  if (typeof atob === 'function') {
    const decoded = atob(base64)
    const bytes = new Uint8Array(decoded.length)

    for (let i = 0; i < decoded.length; i += 1) {
      bytes[i] = decoded.charCodeAt(i)
    }

    return bytes
  }

  const bufferImpl = (globalThis as { Buffer?: { from: (value: string, encoding: string) => Uint8Array } }).Buffer

  if (bufferImpl) {
    return Uint8Array.from(bufferImpl.from(base64, 'base64'))
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Unable to decode image payload.'
  })
}

export const getStoryImagesBucket = (event: H3Event): R2BucketBinding => {
  const cloudflareContext = event.context.cloudflare as { env?: Record<string, unknown> } | undefined
  const bucket = cloudflareContext?.env?.STORY_IMAGES

  if (!isR2BucketBinding(bucket)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing R2 binding: STORY_IMAGES'
    })
  }

  return bucket
}

export const parseImageDataUrl = (imageDataUrl: string) => {
  const match = imageDataUrl.match(VALID_IMAGE_DATA_URL)

  if (!match) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image must be a base64 data URL for jpeg, png, or webp.'
    })
  }

  const mimeType = match[1]
  const base64Data = match[2]

  if (!mimeType || !base64Data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image payload.'
    })
  }

  const bytes = decodeBase64(base64Data)

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image payload must be between 1 byte and 256KB.'
    })
  }

  return { bytes, mimeType }
}

export const buildStoryImageUrl = (imageKey: string) => `/api/story-image/${encodeURIComponent(imageKey)}`
