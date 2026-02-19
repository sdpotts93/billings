import { createError } from 'h3'
import type { H3Event } from 'h3'

export type ApprovedStory = {
  id: string
  author: string
  message: string
  createdAt: string
  imageKey?: string
}

type ApprovedStoriesFeed = {
  stories: ApprovedStory[]
}

type KVBinding = {
  get: (key: string, type?: 'text') => Promise<string | null>
  put: (key: string, value: string) => Promise<void>
}

const FEED_KEY = 'approved_stories_feed'
const MAX_STORIES = 500

const isKVBinding = (value: unknown): value is KVBinding => {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as KVBinding).get === 'function'
    && typeof (value as KVBinding).put === 'function'
  )
}

const isApprovedStory = (value: unknown): value is ApprovedStory => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybeStory = value as Record<string, unknown>
  return (
    typeof maybeStory.id === 'string'
    && typeof maybeStory.author === 'string'
    && typeof maybeStory.message === 'string'
    && typeof maybeStory.createdAt === 'string'
    && (typeof maybeStory.imageKey === 'undefined' || typeof maybeStory.imageKey === 'string')
  )
}

export const getApprovedStoriesKV = (event: H3Event): KVBinding => {
  const cloudflareContext = event.context.cloudflare as { env?: Record<string, unknown> } | undefined
  const kv = cloudflareContext?.env?.APPROVED_STORIES

  if (!isKVBinding(kv)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing KV binding: APPROVED_STORIES'
    })
  }

  return kv
}

export const readApprovedStoriesFeed = async (kv: KVBinding): Promise<ApprovedStoriesFeed> => {
  const rawFeed = await kv.get(FEED_KEY, 'text')

  if (!rawFeed) {
    return { stories: [] }
  }

  try {
    const parsedFeed = JSON.parse(rawFeed) as { stories?: unknown }

    if (!Array.isArray(parsedFeed.stories)) {
      return { stories: [] }
    }

    const stories = parsedFeed.stories.filter(isApprovedStory)
    return { stories }
  } catch {
    return { stories: [] }
  }
}

export const writeApprovedStoriesFeed = async (kv: KVBinding, stories: ApprovedStory[]) => {
  await kv.put(FEED_KEY, JSON.stringify({ stories }))
}

export const appendApprovedStory = async (kv: KVBinding, story: ApprovedStory) => {
  const feed = await readApprovedStoriesFeed(kv)
  feed.stories.unshift(story)
  feed.stories = feed.stories.slice(0, MAX_STORIES)
  await writeApprovedStoriesFeed(kv, feed.stories)
  return feed.stories
}
