import { createError, getRouterParam } from 'h3'
import { getStoryImagesBucket } from '../../utils/storyImages'

const VALID_IMAGE_KEY = /^[0-9a-f-]+\.(webp|jpg|jpeg|png)$/i

export default defineEventHandler(async (event) => {
  const imageKey = getRouterParam(event, 'imageKey')

  if (!imageKey || !VALID_IMAGE_KEY.test(imageKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image key.'
    })
  }

  const bucket = getStoryImagesBucket(event)
  const imageObject = await bucket.get(imageKey)

  if (!imageObject) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found.'
    })
  }

  const body = imageObject.body

  if (!body) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image body is empty.'
    })
  }

  const contentType = imageObject.httpMetadata?.contentType || 'image/webp'
  const size = imageObject.size
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': contentType,
    'X-Robots-Tag': 'noindex, nofollow, noarchive'
  })

  if (typeof size === 'number' && size >= 0) {
    headers.set('Content-Length', String(size))
  }

  return new Response(body, {
    headers
  })
})
