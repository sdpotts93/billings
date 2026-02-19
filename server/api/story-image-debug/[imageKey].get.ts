import { createError, getRouterParam, setHeader } from 'h3'
import { getStoryImagesBucket } from '../../utils/storyImages'

const VALID_IMAGE_KEY = /^[0-9a-f-]+\.(webp|jpg|jpeg|png)$/i

const bytesToHex = (bytes: Uint8Array) => {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export default defineEventHandler(async (event) => {
  const imageKey = getRouterParam(event, 'imageKey')

  if (!imageKey || !VALID_IMAGE_KEY.test(imageKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image key.'
    })
  }

  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')

  const bucket = getStoryImagesBucket(event)
  const imageObject = await bucket.get(imageKey)

  if (!imageObject) {
    return {
      exists: false,
      imageKey
    }
  }

  let arrayBufferByteLength: number | null = null
  let first16BytesHex: string | null = null
  let arrayBufferError: string | null = null

  try {
    const bytes = new Uint8Array(await imageObject.arrayBuffer())
    arrayBufferByteLength = bytes.byteLength
    first16BytesHex = bytesToHex(bytes.slice(0, 16))
  } catch (error) {
    arrayBufferError = error instanceof Error ? error.message : 'Unknown arrayBuffer error'
  }

  return {
    exists: true,
    imageKey,
    hasBodyStream: Boolean(imageObject.body),
    sizeFromR2: imageObject.size ?? null,
    contentType: imageObject.httpMetadata?.contentType ?? null,
    arrayBufferByteLength,
    first16BytesHex,
    arrayBufferError
  }
})
