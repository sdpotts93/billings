import { setHeader } from 'h3'
import { getApprovedStoriesKV, readApprovedStoriesFeed } from '../utils/approvedStories'
import { buildStoryImageUrl } from '../utils/storyImages'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')

  const kv = getApprovedStoriesKV(event)
  const feed = await readApprovedStoriesFeed(kv)

  return {
    stories: feed.stories.map(story => ({
      ...story,
      imageUrl: story.imageKey ? buildStoryImageUrl(story.imageKey) : undefined
    }))
  }
})
