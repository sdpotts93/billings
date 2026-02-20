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

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
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
    rootMargin: '0px 0px 1200px 0px',
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
                  >
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
            Tell us what happened and how it impacted you. Your post appears in the feed right away.
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
  --ink: var(--theme-color-text);
  --muted: var(--theme-color-muted);
  --muted-13: var(--theme-color-muted-13);
  --muted-14: var(--theme-color-muted-14);
  --muted-15: var(--theme-color-muted-15);
  --muted-16: var(--theme-color-muted-16);
  --muted-17: var(--theme-color-muted-17);
  --muted-18: var(--theme-color-muted-18);
  --line: var(--theme-color-line);
  --line-strong: var(--theme-color-line-strong);
  --line-photo: var(--theme-color-line-photo);
  --paper: var(--theme-color-surface);
  --surface: var(--theme-color-bg);
  --bg-glow-1: var(--theme-color-bg-glow-1);
  --bg-glow-2: var(--theme-color-bg-glow-2);
  --accent: var(--theme-color-accent);
  --accent-contrast: var(--theme-color-accent-contrast);
  --quote-mark: var(--ink);
  --notice-bg: var(--theme-color-notice-bg);
  --notice-text: var(--theme-color-notice-text);
  --mobile-close-bg: var(--theme-color-mobile-close-bg);
  --font-title: var(--theme-font-title);
  --font-text: var(--theme-font-text);
  --fs-caption: var(--theme-font-size-caption);
  --fs-xs: var(--theme-font-size-xs);
  --fs-note-plus: var(--theme-font-size-note-plus);
  --fs-label: var(--theme-font-size-label);
  --fs-sm: var(--theme-font-size-sm);
  --fs-sm-plus: var(--theme-font-size-sm-plus);
  --fs-btn: var(--theme-font-size-btn);
  --fs-md: var(--theme-font-size-md);
  --fs-md-plus: var(--theme-font-size-md-plus);
  --fs-body: var(--theme-font-size-body);
  --fs-body-lg: var(--theme-font-size-body-lg);
  --fs-brand: var(--theme-font-size-brand);
  --fs-mobile-cta: var(--theme-font-size-mobile-cta);
  --fs-quote-mark: var(--theme-font-size-quote-mark);
  --fs-panel-title: var(--theme-font-size-panel-title);
  --fs-hero-lg: var(--theme-font-size-hero-lg);
  --fs-hero-mobile: var(--theme-font-size-hero-mobile);
  min-height: 100vh;
  background:var(--theme-color-bg);
  color: var(--ink);
  font-family: var(--font-text);
}

.page-shell {
  width: 100%;
  max-width: 1220px;
  margin-inline: auto;
  padding-inline: 24px;
}

.top-nav {
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(4px);
  background: var(--theme-color-bg);
  position: sticky;
  top: 0;
  z-index: 20;
}

.nav-shell {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.brand {
  color: var(--ink);
  text-decoration: none;
  font-size: 2.5rem;
  /* font-weight: 800; */
  letter-spacing: -0.02em;
  font-family: var(--font-title);
  line-height: 1;
  letter-spacing: 0.009em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.35rem;
}

.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: var(--fs-brand);
  font-weight: 600;
}

.nav-cta {
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: var(--fs-btn);
  font-weight: 700;
  padding: 0.52rem 0.92rem;
  cursor: pointer;
}

.hero {
  text-align: center;
  padding: 2.8rem 0 1.25rem;
}

.eyebrow {
  margin: 0;
  font-size: var(--fs-sm-plus);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--muted-13);
}

.hero h1 {
  margin: 0.45rem auto 0;
  max-width: 720px;
  font-family: var(--font-title);
  font-size: var(--fs-hero-lg);
  line-height: 1.02;
}

.hero p {
  margin: 0.9rem auto 0;
  max-width: 620px;
  color: var(--muted);
  line-height: 1.45;
  font-size: var(--fs-brand);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 1.05rem;
  padding-bottom: 5rem;
}

.stories-feed {
  min-width: 0;
}

.stories-columns {
  column-count: 2;
  column-gap: 14px;
}

.story-card {
  position: relative;
  break-inside: avoid;
  margin-bottom: 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--paper);
  padding: 1.9rem 1rem 1rem;
  box-shadow: 0 10px 24px rgba(31, 24, 39, 0.04);
}

.story-card::before {
  content: '”';
  position: absolute;
  top: 0.55rem;
  right: 0.62rem;
  font-family: var(--font-title);
  font-size: var(--fs-quote-mark);
  line-height: 1;
  color: var(--quote-mark);
  pointer-events: none;
}

.story-card--skeleton::before {
  content: '';
}

.story-message {
  margin: 0;
  color: var(--theme-color-accent-contrast);
  font-family: var(--font-text);
  font-size: var(--fs-body-lg);
  line-height: 1.5;
  letter-spacing: -0.005em;
  text-wrap: pretty;
  padding-right: 1.2rem;
}

.story-message::after {
  content: '”';
  color: var(--quote-mark);
}

.story-footer {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.68rem;
}

.story-message-skeleton {
  display: grid;
  gap: 0.45rem;
  padding-right: 1.2rem;
}

.skeleton-line,
.skeleton-block {
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--line), white 34%) 25%,
    color-mix(in oklab, var(--line), white 54%) 50%,
    color-mix(in oklab, var(--line), white 34%) 75%
  );
  background-size: 200% 100%;
  animation: story-skeleton-wave 1.2s ease-in-out infinite;
}

.skeleton-line {
  display: block;
  height: 0.92rem;
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
  width: 116px;
  height: 0.86rem;
  border-radius: 999px;
}

.story-avatar,
.story-photo {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  flex-shrink: 0;
}

.story-avatar {
  background: white;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  font-weight: 760;
}

.story-photo {
  object-fit: cover;
  border: 1px solid var(--line-photo);
}

.story-author {
  margin: 0;
  font-size: var(--fs-btn);
  font-weight: 740;
  color: var(--theme-color-link-soft);
  letter-spacing: 0.01em;
}

.feed-status {
  margin: 0.2rem 0 0;
  color: var(--muted-14);
  font-size: var(--fs-btn);
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
  height: 2px;
}

.share-panel {
  position: sticky;
  top: 88px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1rem;
}

.share-panel h2 {
  margin: 0;
  font-family: var(--font-title);
  font-size: var(--fs-panel-title);
  letter-spacing: -0.02em;
}

.share-panel p {
  margin: 0.5rem 0 0;
  color: var(--theme-color-accent);
  font-size: var(--fs-md);
  line-height: 1.44;
}

.share-form {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.56rem;
}

.share-form label {
  font-size: var(--fs-brand);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.share-form input,
.share-form textarea {
  width: 100%;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: var(--paper);
  padding: 0.6rem 0.7rem;
  font-size: var(--fs-brand);
  color: var(--accent-contrast);
}

.share-form textarea {
  resize: vertical;
  min-height: 130px;
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
  border: 1px solid var(--line-photo);
  background: var(--paper);
}

.photo-name {
  margin: 0;
  color: var(--muted-17);
  font-size: var(--fs-label);
}

::v-deep(.photo-remove) {
  padding: 0 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  color: #ee565b !important;
}

.submit-btn {
  margin-top: 0.3rem;
  border: 0;
  border-radius: 8px;
  background: var(--ink);
  color: white;
  font-size: var(--fs-body);
  font-weight: 700;
  padding: 0.7rem 0.8rem;
  cursor: pointer;
  text-transform: uppercase;
}

.submit-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.submit-notice {
  margin: 0.72rem 0 0;
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
  background: var(--notice-bg);
  color: var(--notice-text);
  font-size: var(--fs-sm);
  font-weight: 600;
}

.mobile-close {
  display: none;
}

.mobile-backdrop,
.mobile-share-cta {
  display: none;
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .page-shell {
    padding-inline: 20px;
  }
}

@media (max-width: 1023px) {
  .nav-links,
  .nav-cta {
    display: none;
  }

  .hero {
    padding-top: 2rem;
  }

  .hero h1 {
    font-size: var(--fs-hero-mobile);
  }

  .content-grid {
    grid-template-columns: 1fr;
    padding-bottom: 7.4rem;
  }

  .stories-columns {
    column-count: 1;
  }

  .share-panel {
    position: fixed;
    inset: auto 0 0 0;
    top: auto;
    z-index: 60;
    border-radius: 18px 18px 0 0;
    border-bottom: 0;
    transform: translateY(106%);
    transition: transform 220ms ease;
    max-height: 84vh;
    overflow-y: auto;
    padding: 0.9rem 0.9rem 2rem;
    background-color: white;
  }

  .share-panel p {
    color: var(--accent-contrast);
  }
  .share-panel.is-mobile-open {
    transform: translateY(0);
  }

  .mobile-close {
    display: block;
    border: 0;
    margin-left: auto;
    border-radius: 999px;
    background: var(--mobile-close-bg);
    color: var(--muted-18);
    font-size: var(--fs-label);
    font-weight: 700;
    padding: 0.34rem 0.65rem;
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
    left: 2rem;
    right: 2rem;
    bottom: 1rem;
    z-index: 40;
    border: 0;
    border-radius: 999px;
    background: var(--accent-contrast);
    color: var(--accent);
    font-size: var(--fs-mobile-cta);
    font-weight: 760;
    letter-spacing: 0.01em;
    min-height: 52px;
    box-shadow: 0 14px 34px rgba(205, 83, 45, 0.34);
    cursor: pointer;
  }
}

@media (max-width: 768px) {
  .page-shell {
    padding-inline: 16px;
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
