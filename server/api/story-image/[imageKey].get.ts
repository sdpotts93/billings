import { createError, getRouterParam, setHeader } from 'h3'
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

  const contentType = imageObject.httpMetadata?.contentType || 'image/webp'

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')

  return imageObject.arrayBuffer()
})
