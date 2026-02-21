<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

type Story = {
  id: string
  author: string
  message: string
  initials: string
  photoUrl?: string
}

type ApiStory = {
  id: string
  author: string
  message: string
  createdAt: string
  imageUrl?: string
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) {
    return 'US'
  }

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

useSeoMeta({
  title: 'Share Your Story | Billings',
  ogTitle: 'Share Your Story | Billings',
  description: 'Community stories about healthcare experiences in the United States.',
  ogDescription: 'Community stories about healthcare experiences in the United States.'
})

const allStories = ref<Story[]>([])
const visibleStories = ref<Story[]>([])
const loadSentinel = ref<HTMLElement | null>(null)
const batchSize = 30
const loadedCount = ref(0)
const isFeedLoading = ref(true)
const isLoadingMore = ref(false)
const isSubmitting = ref(false)
const isMobileFormOpen = ref(false)
const selectedPhoto = ref<File | null>(null)
const selectedPhotoPreview = ref<string | null>(null)
const submitNotice = ref('')
const skeletonCardIds = Array.from({ length: 6 }, (_, index) => `story-skeleton-${index}`)

const formState = reactive({
  name: '',
  message: ''
})

const hasMoreStories = computed(() => loadedCount.value < allStories.value.length)
const showStoriesSkeleton = computed(() => {
  return isFeedLoading.value || (visibleStories.value.length === 0 && isLoadingMore.value)
})

const toClientStory = (story: ApiStory): Story => {
  return {
    id: story.id,
    author: story.author,
    message: story.message,
    initials: getInitials(story.author),
    photoUrl: story.imageUrl
  }
}

const hydrateStories = async (stories: ApiStory[]) => {
  allStories.value = stories.map(story => toClientStory(story))
  visibleStories.value = []
  loadedCount.value = 0
  await loadMoreStories()
}

const loadStoriesFromFeed = async () => {
  isFeedLoading.value = true

  try {
    const response = await $fetch<{ stories: ApiStory[] }>('/api/approved-stories')
    await hydrateStories(response.stories ?? [])
  } catch {
    allStories.value = []
    visibleStories.value = []
    loadedCount.value = 0
    submitNotice.value = 'Could not load the live feed. Please try again.'
    clearSubmitNotice()
  } finally {
    isFeedLoading.value = false
  }
}

const buildCenteredImageDataUrl = async (file: File): Promise<string> => {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read image file.'))
      img.src = objectUrl
    })

    const size = 200
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not initialize image processing context.')
    }

    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const offsetX = (size - drawWidth) / 2
    const offsetY = (size - drawHeight) / 2

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.clearRect(0, 0, size, size)
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

    return canvas.toDataURL('image/webp', 0.9)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const loadMoreStories = async () => {
  if (isLoadingMore.value || !hasMoreStories.value) {
    return
  }

  isLoadingMore.value = true
  await delay(320)

  const nextStories = allStories.value.slice(loadedCount.value, loadedCount.value + batchSize)
  visibleStories.value.push(...nextStories)
  loadedCount.value += nextStories.length
  isLoadingMore.value = false
}

const clearSubmitNotice = () => {
  if (!submitNotice.value) {
    return
  }

  setTimeout(() => {
    submitNotice.value = ''
  }, 2500)
}

const clearSelectedPhotoPreview = () => {
  if (!selectedPhotoPreview.value) {
    return
  }

  URL.revokeObjectURL(selectedPhotoPreview.value)
  selectedPhotoPreview.value = null
}

const resetForm = () => {
  formState.name = ''
  formState.message = ''
  selectedPhoto.value = null
}

const submitStory = async () => {
  if (isSubmitting.value) {
    return
  }

  const name = formState.name.trim()
  const message = formState.message.trim()

  if (!name || !message) {
    return
  }

  isSubmitting.value = true

  try {
    let imageDataUrl: string | undefined

    if (selectedPhoto.value) {
      imageDataUrl = await buildCenteredImageDataUrl(selectedPhoto.value)
    }

    const response = await $fetch<{ story: ApiStory }>('/api/share-story', {
      method: 'POST',
      body: {
        name,
        message,
        imageDataUrl
      }
    })

    const createdStory = toClientStory(response.story)
    allStories.value.unshift(createdStory)
    visibleStories.value.unshift(createdStory)
    loadedCount.value += 1

    submitNotice.value = 'Story posted to the top of the feed.'

    resetForm()

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) {
      isMobileFormOpen.value = false
    }
  } catch {
    submitNotice.value = 'Could not post your story. Please try again.'
  } finally {
    isSubmitting.value = false
    clearSubmitNotice()
  }
}

const openMobileForm = () => {
  isMobileFormOpen.value = true
}

const closeMobileForm = () => {
  isMobileFormOpen.value = false
}

let intersectionObserver: IntersectionObserver | null = null

onMounted(async () => {
  await loadStoriesFromFeed()

  intersectionObserver = new IntersectionObserver((entries) => {
    const isNearBottom = entries.some(entry => entry.isIntersecting)

    if (isNearBottom) {
      void loadMoreStories()
    }
  }, {
    rootMargin: '0rem 0rem 75rem 0rem',
    threshold: 0.01
  })

  if (loadSentinel.value) {
    intersectionObserver.observe(loadSentinel.value)
  }
})

watch(isMobileFormOpen, (open) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.style.overflow = open ? 'hidden' : ''
})

watch(selectedPhoto, (file) => {
  clearSelectedPhotoPreview()

  if (!file) {
    return
  }

  selectedPhotoPreview.value = URL.createObjectURL(file)
})

onBeforeUnmount(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = ''
  }

  clearSelectedPhotoPreview()
})
</script>

<template>
  <div class="story-page">
    <main class="page-shell">
      <section class="hero">
        <p class="eyebrow">
          Community voices
        </p>
        <h1>What people are experiencing in U.S. healthcare</h1>
        <p>
          Read patient and caregiver stories, then add your own. New stories load continuously as you scroll.
        </p>
      </section>

      <section class="content-grid">
        <div class="stories-feed">
          <div class="stories-columns">
            <template v-if="showStoriesSkeleton">
              <article
                v-for="skeletonCardId in skeletonCardIds"
                :key="skeletonCardId"
                class="story-card story-card--skeleton"
                aria-hidden="true"
              >
                <div class="story-message-skeleton">
                  <span class="skeleton-line skeleton-line--long" />
                  <span class="skeleton-line skeleton-line--medium" />
                  <span class="skeleton-line skeleton-line--short" />
                </div>

                <footer class="story-footer">
                  <span class="story-avatar skeleton-block" />
                  <div class="story-author-skeleton skeleton-block" />
                </footer>
              </article>
            </template>

            <template v-else>
              <article
                v-for="story in visibleStories"
                :key="story.id"
                class="story-card"
              >
                <p class="story-message">
                  {{ story.message }}
                </p>

                <footer class="story-footer">
                  <img
                    v-if="story.photoUrl"
                    :src="story.photoUrl"
                    :alt="`${story.author} photo`"
                    class="story-photo"
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    v-else
                    class="story-avatar"
                  >
                    {{ story.initials }}
                  </span>

                  <div>
                    <p class="story-author">
                      {{ story.author }}
                    </p>
                  </div>
                </footer>
              </article>
            </template>
          </div>

          <p
            v-if="showStoriesSkeleton"
            class="feed-status"
          >
            Loading stories...
          </p>
          <p
            v-else-if="isLoadingMore"
            class="feed-status"
          >
            Loading more stories...
          </p>
          <p
            v-else-if="!hasMoreStories && allStories.length > 0"
            class="feed-status"
          >
            You reached the end of submitted stories.
          </p>
          <p
            v-else-if="!hasMoreStories"
            class="feed-status"
          >
            No stories yet. Be the first to share yours.
          </p>
          <div
            ref="loadSentinel"
            class="load-sentinel"
            aria-hidden="true"
          />
        </div>

        <aside
          id="share-story-form"
          class="share-panel"
          :class="{ 'is-mobile-open': isMobileFormOpen }"
        >
          <button
            type="button"
            class="mobile-close"
            @click="closeMobileForm"
          >
            Close
          </button>

          <h2>Share your story</h2>
          <p>
            Tell us what happened and how it impacted you.
          </p>

          <form
            class="share-form"
            @submit.prevent="submitStory"
          >
            <label for="story-name">Name</label>
            <input
              id="story-name"
              v-model="formState.name"
              type="text"
              placeholder="Your name"
              autocomplete="name"
              required
            >

            <label for="story-message">Message</label>
            <textarea
              id="story-message"
              v-model="formState.message"
              rows="6"
              placeholder="Share your healthcare experience in the U.S."
              required
            />

            <label
              class="upload-label"
              for="story-photo"
            >
              Upload a picture (optional)
            </label>
            <UFileUpload
              id="story-photo"
              v-slot="{ open, removeFile }"
              v-model="selectedPhoto"
              accept="image/*"
              class="photo-upload"
            >
              <div class="photo-upload-row">
                <UAvatar
                  size="lg"
                  :src="selectedPhotoPreview ?? undefined"
                  icon="i-lucide-image"
                  class="photo-upload-avatar"
                />

                <div class="photo-upload-actions">
                  <UButton
                    type="button"
                    :label="selectedPhoto ? 'Change image' : 'Upload image'"
                    color="neutral"
                    size="xs"
                    variant="outline"
                    @click="open()"
                  />

                  <UButton
                    v-if="selectedPhoto"
                    type="button"
                    label="Remove"
                    color="error"
                    variant="link"
                    size="xs"
                    class="photo-remove"
                    @click="removeFile()"
                  />
                </div>
              </div>

              <p
                v-if="selectedPhoto"
                class="photo-name"
              >
                {{ selectedPhoto.name }}
              </p>
            </UFileUpload>

            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Posting...' : 'Post story' }}
            </button>
          </form>

          <p
            v-if="submitNotice"
            class="submit-notice"
          >
            {{ submitNotice }}
          </p>
        </aside>
      </section>
    </main>

    <div
      v-if="isMobileFormOpen"
      class="mobile-backdrop"
      @click="closeMobileForm"
    />

    <button
      type="button"
      class="mobile-share-cta"
      @click="openMobileForm"
    >
      Share your story
    </button>
  </div>
</template>

<style scoped>
.story-page {
  min-height: 100vh;
  background: var(--theme-color-bg);
  color: var(--theme-color-text);
  font-family: var(--theme-font-text);
}

.page-shell {
  width: 100%;
  max-width: 1220px;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.top-nav {
  border-bottom: 1px solid var(--theme-color-line);
  backdrop-filter: blur(0.25rem);
  background: var(--theme-color-bg);
  position: sticky;
  top: 0;
  z-index: 20;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.nav-links a {
  color: var(--theme-color-muted);
  text-decoration: none;
  font-size: var(--theme-font-size-brand);
  font-weight: 600;
}

.nav-cta {
  border: 0;
  border-radius: 999px;
  background: var(--theme-color-accent);
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
}

.hero {
  text-align: center;
  padding: 2.8rem 0 1.25rem;
}

.eyebrow {
  margin: 0;
  font-size: var(--theme-font-size-sm-plus);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--muted-13);
}

.hero h1 {
  margin: 0.45rem auto 0;
  max-width: 29ch;
  font-family: var(--theme-font-title);
  font-size: var(--theme-font-size-hero-xl);
  line-height: 1;
}

.hero p {
  margin: 0.9rem auto 0;
  max-width: 50ch;
  color: var(--theme-color-muted);
  line-height: 1.5;
  font-size: var(--theme-font-size-brand);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) 340px;
  align-items: start;
  gap: var(--space-4);
  padding-bottom: 5rem;
}

.stories-feed {
  min-width: 0;
}

.stories-columns {
  column-count: 2;
  column-gap: 0.875rem;
}

.story-card {
  position: relative;
  break-inside: avoid;
  margin-bottom: 0.875rem;
  border: 1px solid var(--theme-color-line);
  border-radius: var(--radius-md);
  background: var(--theme-color-surface);
  padding: var(--space-8) var(--space-4) var(--space-4);
  box-shadow: 0 0.625rem 1.5rem rgba(31, 24, 39, 0.04);
}

.story-card::before {
  content: '”';
  position: absolute;
  top: 0.55rem;
  right: 0.62rem;
  font-family: var(--theme-font-title);
  font-size: var(--theme-font-size-quote-mark);
  line-height: 1;
  color: var(--theme-color-text);
  pointer-events: none;
}

.story-card--skeleton::before {
  content: '';
}

.story-message {
  margin: 0;
  color: var(--theme-color-accent-contrast);
  font-family: var(--theme-font-text);
  font-size: var(--theme-font-size-brand);
  line-height: 1.5;
  letter-spacing: -0.005em;
  text-wrap: pretty;
  padding-right: 1.2rem;
}

.story-message::after {
  content: '”';
  color: var(--theme-color-text);
}

.story-footer {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.story-message-skeleton {
  display: grid;
  gap: var(--space-2);
  padding-right: 1.2rem;
}

.skeleton-line,
.skeleton-block {
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--theme-color-line), white 34%) 25%,
    color-mix(in oklab, var(--theme-color-line), white 54%) 50%,
    color-mix(in oklab, var(--theme-color-line), white 34%) 75%
  );
  background-size: 200% 100%;
  animation: story-skeleton-wave 1.2s ease-in-out infinite;
}

.skeleton-line {
  display: block;
  height: 0.875rem;
  border-radius: 999px;
}

.skeleton-line--long {
  width: 100%;
}

.skeleton-line--medium {
  width: 84%;
}

.skeleton-line--short {
  width: 63%;
}

.story-author-skeleton {
  width: 7.25rem;
  height: 0.875rem;
  border-radius: 999px;
}

.story-avatar,
.story-photo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.story-avatar {
  background: white;
  color: var(--theme-color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--theme-font-size-xs);
  font-weight: 760;
}

.story-photo {
  object-fit: cover;
  border: 1px solid var(--theme-color-line-photo);
}

.story-author {
  margin: 0;
  font-size: var(--theme-font-size-btn);
  font-weight: 740;
  color: var(--theme-color-link-soft);
  letter-spacing: 0.01em;
}

.feed-status {
  margin: 0.2rem 0 0;
  color: var(--theme-color-muted-2);
  font-size: var(--theme-font-size-btn);
}

@keyframes story-skeleton-wave {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

.load-sentinel {
  width: 100%;
  height: 0.125rem;
}

.share-panel {
  position: sticky;
  top: 5.5rem;
  border: 1px solid var(--theme-color-line);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.share-panel h2 {
  margin: 0;
  font-family: var(--theme-font-title);
  font-size: var(--theme-font-size-panel-title);
  letter-spacing: -0.02em;
}

.share-panel p {
  margin: 0.5rem 0 0;
  color: var(--theme-color-accent);
  font-size: var(--theme-font-size-brand);
  line-height: 1.5;
}

.share-form {
  margin-top: var(--space-3);
  display: grid;
  gap: var(--space-2);
}

.share-form label {
  font-size: var(--theme-font-size-brand);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--theme-color-text);
}

.share-form input,
.share-form textarea {
  width: 100%;
  border: 1px solid var(--theme-color-line-strong);
  border-radius: var(--radius-sm);
  background: var(--theme-color-surface);
  padding: var(--space-2) var(--space-3);
  font-size: var(--theme-font-size-form);
  color: var(--theme-color-accent-contrast);
}

.share-form textarea {
  resize: vertical;
  max-height: 6rem;
}

.upload-label {
  margin-top: 0.2rem;
}

.photo-upload {
  margin-top: 0.14rem;
  --ui-error: #ee565b;
}

.photo-upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.photo-upload-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.photo-upload-avatar {
  border: 1px solid var(--theme-color-line-photo);
  background: var(--theme-color-surface);
}

.photo-name {
  margin: 0;
  color: var(--theme-color-muted-2);
  font-size: var(--theme-font-size-label);
}

::v-deep(.photo-remove) {
  padding: 0 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.0625rem !important;
  color: #ee565b !important;
}

.submit-btn {
  margin-top: 0.3rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--theme-color-text);
  color: white;
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  text-transform: uppercase;
}

.submit-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.mobile-close {
  display: none;
}

.mobile-backdrop,
.mobile-share-cta {
  display: none;
}

p.submit-notice {
  margin: var(--space-3) 0 0;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  color: var(--ui-error);
  font-size: var(--theme-font-size-sm);
}

@media screen and (max-width: 1280px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }

  .page-shell {
    padding-inline: var(--space-5);
  }
}

@media screen and (max-width: 1024px) {
  .nav-links,
  .nav-cta {
    display: none;
  }

  .hero {
    padding-top: 2rem;
  }

  .hero h1 {
    font-size: var(--theme-font-size-hero-mobile);
  }

  .content-grid {
    grid-template-columns: 1fr;
    padding-bottom: var(--space-30);
  }

  .stories-columns {
    column-count: 1;
  }

  .share-panel {
    position: fixed;
    inset: auto 0 0 0;
    top: auto;
    z-index: 60;
    border-radius: 1.125rem 1.125rem 0 0;
    border-bottom: 0;
    transform: translateY(106%);
    transition: transform 220ms ease;
    max-height: 84vh;
    overflow-y: auto;
    padding: var(--space-4) var(--space-4) var(--space-8);
    background-color: white;
  }

  .share-panel p {
    color: var(--theme-color-accent-contrast);
  }
  .share-panel.is-mobile-open {
    transform: translateY(0);
  }

  .mobile-close {
    display: block;
    border: 0;
    margin-left: auto;
    border-radius: 999px;
    background: var(--theme-color-mobile-close-bg);
    color: var(--theme-color-muted-2);
    font-size: var(--theme-font-size-label);
    font-weight: 700;
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
  }

  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(17, 15, 20, 0.42);
  }

  .mobile-share-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: var(--space-8);
    right: var(--space-8);
    bottom: var(--space-4);
    z-index: 40;
    border: 0;
    border-radius: 999px;
    background: var(--theme-color-accent-contrast);
    color: var(--theme-color-accent);
    font-size: var(--theme-font-size-mobile-cta);
    line-height: 1.5;
    font-weight: 760;
    letter-spacing: 0.01em;
    min-height: 3.25rem;
    box-shadow: 0 0.875rem 2.125rem rgba(205, 83, 45, 0.34);
    cursor: pointer;
  }
}

@media screen and (max-width: 767px) {
  .page-shell {
    padding-inline: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .share-panel {
    transition: none;
  }

  .skeleton-line,
  .skeleton-block {
    animation: none;
  }
}
</style>
