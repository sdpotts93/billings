import { createError, readBody, setHeader } from 'h3'
import { appendApprovedStory, getApprovedStoriesKV } from '../utils/approvedStories'
import { buildStoryImageUrl, getStoryImagesBucket, parseImageDataUrl } from '../utils/storyImages'

type ShareStoryRequestBody = {
  name?: unknown
  message?: unknown
  imageDataUrl?: unknown
}

const extensionByMimeType: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png'
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')

  const body = await readBody<ShareStoryRequestBody>(event)
  const author = typeof body?.name === 'string' ? body.name.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl : ''

  if (author.length < 2 || author.length > 80) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name must be between 2 and 80 characters.'
    })
  }

  if (message.length < 10 || message.length > 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message must be between 10 and 2000 characters.'
    })
  }

  const story = {
    id: crypto.randomUUID(),
    author,
    message,
    createdAt: new Date().toISOString()
  } as const

  let imageKey: string | undefined

  if (imageDataUrl) {
    const { bytes, mimeType } = parseImageDataUrl(imageDataUrl)
    const extension = extensionByMimeType[mimeType]

    if (!extension) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported image type.'
      })
    }

    imageKey = `${story.id}.${extension}`
    const imagesBucket = getStoryImagesBucket(event)

    await imagesBucket.put(imageKey, bytes, {
      httpMetadata: {
        contentType: mimeType
      }
    })
  }

  const kv = getApprovedStoriesKV(event)
  await appendApprovedStory(kv, {
    ...story,
    imageKey
  })

  return {
    story: {
      ...story,
      imageUrl: imageKey ? buildStoryImageUrl(imageKey) : undefined
    }
  }
})
