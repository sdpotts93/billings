<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

type TeamMember = {
  name: string
  role: string
  imageSrc: string
  imageAlt: string
  imagePosition?: 'top' | 'center'
}

const heroMissionImageSrc = '/images/why.jpg'
const uninsuredPeopleTotal = 27_200_000

const teamMembers: TeamMember[] = [
  {
    name: 'Alexander Ludwig',
    role: 'Writer, Director, "Easton"',
    imageSrc: '/images/alexander.jpg',
    imageAlt: 'Portrait of Alexander Ludwig'
  },
  {
    name: 'Rick Dougdale',
    role: 'Producer',
    imageSrc: '/images/rick.jpg',
    imageAlt: 'Portrait of Rick Dougdale'
  },
  {
    name: 'Sharlene Ludwig',
    role: 'Producer',
    imageSrc: '/images/sharlene.jpg',
    imageAlt: 'Portrait of Sharlene Ludwig',
    imagePosition: 'center'
  },
  {
    name: 'Grace Beedie',
    role: '"Doc"',
    imageSrc: '/images/grace.jpg',
    imageAlt: 'Portrait of Grace Beedie'
  },
  {
    name: 'James Jordan',
    role: '"Deputy Chief"',
    imageSrc: '/images/james.jpg',
    imageAlt: 'Portrait of James Jordan'
  },
  {
    name: 'Carla Gugino',
    role: '"Sheriff Gaby"',
    imageSrc: '/images/carla.jpg',
    imageAlt: 'Portrait of Carla Gugino',
    imagePosition: 'center'
  }
]

useSeoMeta({
  title: 'About the Film | Billings',
  ogTitle: 'About the Film | Billings',
  description: 'A scroll-driven story about health care access, uninsured families, and the team behind Billings.',
  ogDescription: 'A scroll-driven story about health care access, uninsured families, and the team behind Billings.'
})

const stageSection = ref<HTMLElement | null>(null)
const heroTrackRef = ref<HTMLElement | null>(null)
const storyFlowRef = ref<HTMLElement | null>(null)
const prefersReducedMotion = ref(false)

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const segment = (value: number, start: number, end: number) => {
  return clamp((value - start) / (end - start), 0, 1)
}

const uninsuredMetricRef = ref<HTMLElement | null>(null)
const uninsuredPeopleCount = ref(0)

const uninsuredPeopleFormatted = computed(() => {
  return uninsuredPeopleCount.value.toLocaleString('en-US')
})

let requestId = 0
let uninsuredObserver: IntersectionObserver | null = null
let uninsuredAnimationId = 0
let hasAnimatedUninsuredMetric = false
let reduceMotionQuery: MediaQueryList | null = null
let reduceMotionListener: (() => void) | null = null
let removeScrollListener: (() => void) | null = null
let moveHeroTrack: ((value: number) => void) | null = null
let moveStoryFlowY: ((value: number) => void) | null = null
let stageProgress = 0
let stageStart = 0
let stageScrollLength = 1
let lastKnownScrollPosition = 0
let ticking = false
let scrollSource: Window | HTMLElement | null = null

const xSwiperAdvantages = (item: HTMLElement) => gsap.quickTo(item, 'xPercent', { duration: 0.1 })
const yStoryFlow = (item: HTMLElement) => gsap.quickTo(item, 'y', { duration: 0.1 })

const syncHeroTrack = () => {
  const heroTrack = heroTrackRef.value

  if (!heroTrack) {
    return
  }

  if (!moveHeroTrack) {
    moveHeroTrack = xSwiperAdvantages(heroTrack)
  }

  const heroPanX = -50 * segment(stageProgress, 0, 0.94)
  moveHeroTrack(heroPanX)
}

const syncStoryFlow = () => {
  const storyFlow = storyFlowRef.value

  if (!storyFlow) {
    return
  }

  if (!moveStoryFlowY) {
    moveStoryFlowY = yStoryFlow(storyFlow)
  }

  const storyFlowLift = prefersReducedMotion.value ? 0 : -128 * segment(stageProgress, 0.94, 1)
  moveStoryFlowY(storyFlowLift)
}

const animateUninsuredPeople = () => {
  if (hasAnimatedUninsuredMetric || typeof window === 'undefined') {
    return
  }

  hasAnimatedUninsuredMetric = true

  if (prefersReducedMotion.value) {
    uninsuredPeopleCount.value = uninsuredPeopleTotal
    return
  }

  const startTime = performance.now()
  const duration = 1400

  const step = (now: number) => {
    const progress = clamp((now - startTime) / duration, 0, 1)
    const eased = 1 - (1 - progress) ** 3
    uninsuredPeopleCount.value = Math.round(uninsuredPeopleTotal * eased)

    if (progress < 1) {
      uninsuredAnimationId = window.requestAnimationFrame(step)
      return
    }

    uninsuredPeopleCount.value = uninsuredPeopleTotal
    uninsuredAnimationId = 0
  }

  uninsuredAnimationId = window.requestAnimationFrame(step)
}

const calculateStageMetrics = () => {
  const section = stageSection.value

  if (!section || typeof window === 'undefined') {
    return
  }

  const containerTop = scrollSource instanceof HTMLElement ? scrollSource.getBoundingClientRect().top : 0
  const currentScroll = readScrollTop()
  const sectionTop = section.getBoundingClientRect().top
  stageStart = currentScroll + (sectionTop - containerTop)
  stageScrollLength = Math.max(1, section.offsetHeight - window.innerHeight)
}

const readScrollTop = () => {
  if (typeof window === 'undefined') {
    return 0
  }

  if (scrollSource instanceof HTMLElement) {
    return scrollSource.scrollTop
  }

  return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
}

const syncProgressFromScroll = () => {
  requestId = 0

  if (prefersReducedMotion.value) {
    stageProgress = 0.64
    syncHeroTrack()
    syncStoryFlow()
    return
  }

  stageProgress = clamp((lastKnownScrollPosition - stageStart) / stageScrollLength, 0, 1)
  syncHeroTrack()
  syncStoryFlow()
}

const queueScrollFrame = () => {
  if (requestId !== 0 || typeof window === 'undefined') {
    return
  }

  requestId = window.requestAnimationFrame(() => {
    syncProgressFromScroll()
    ticking = false
  })
}

const initScrollListener = () => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const scrollableContainer = stageSection.value?.closest('.scrollable')
  scrollSource = scrollableContainer instanceof HTMLElement ? scrollableContainer : window

  const scrollHandler = () => {
    lastKnownScrollPosition = readScrollTop()

    if (!ticking) {
      queueScrollFrame()
      ticking = true
    }
  }

  if (scrollSource instanceof HTMLElement) {
    scrollSource.addEventListener('scroll', scrollHandler, { passive: true })
  } else {
    window.addEventListener('scroll', scrollHandler, { passive: true })
  }

  return () => {
    if (scrollSource instanceof HTMLElement) {
      scrollSource.removeEventListener('scroll', scrollHandler)
    } else {
      window.removeEventListener('scroll', scrollHandler)
    }

    scrollSource = null
  }
}

const handleResize = () => {
  if (typeof window === 'undefined') {
    return
  }

  calculateStageMetrics()
  lastKnownScrollPosition = readScrollTop()

  if (!ticking) {
    queueScrollFrame()
    ticking = true
  }
}

const applyMotionPreference = () => {
  prefersReducedMotion.value = Boolean(reduceMotionQuery?.matches)

  if (prefersReducedMotion.value) {
    uninsuredPeopleCount.value = uninsuredPeopleTotal
    hasAnimatedUninsuredMetric = true
  }

  if (typeof window === 'undefined') {
    return
  }

  calculateStageMetrics()
  lastKnownScrollPosition = readScrollTop()

  if (!ticking) {
    queueScrollFrame()
    ticking = true
  }
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduceMotionListener = () => {
    applyMotionPreference()
  }

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', reduceMotionListener)
  } else {
    reduceMotionQuery.addListener(reduceMotionListener)
  }

  removeScrollListener = initScrollListener()
  window.addEventListener('resize', handleResize, { passive: true })
  applyMotionPreference()

  if (!prefersReducedMotion.value) {
    uninsuredPeopleCount.value = 0
    hasAnimatedUninsuredMetric = false
  }

  uninsuredObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0.42)) {
      animateUninsuredPeople()
      uninsuredObserver?.disconnect()
      uninsuredObserver = null
    }
  }, {
    threshold: [0.42, 0.56, 0.72]
  })

  if (uninsuredMetricRef.value) {
    uninsuredObserver.observe(uninsuredMetricRef.value)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    removeScrollListener?.()
    removeScrollListener = null
    window.removeEventListener('resize', handleResize)
  }

  if (requestId !== 0 && typeof window !== 'undefined') {
    window.cancelAnimationFrame(requestId)
  }

  if (uninsuredAnimationId !== 0 && typeof window !== 'undefined') {
    window.cancelAnimationFrame(uninsuredAnimationId)
  }

  if (uninsuredObserver) {
    uninsuredObserver.disconnect()
    uninsuredObserver = null
  }

  if (reduceMotionQuery && reduceMotionListener) {
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', reduceMotionListener)
    } else {
      reduceMotionQuery.removeListener(reduceMotionListener)
    }
  }

  moveHeroTrack = null
  moveStoryFlowY = null
  ticking = false
})
</script>

<template>
  <div class="about-film-page">
    <section
      ref="stageSection"
      class="story-stage"
    >
      <div class="story-sticky">
        <div
          class="hero-panorama"
        >
          <div
            ref="heroTrackRef"
            class="hero-track"
          >
            <article class="hero-mission-panel">
              <div class="hero-mission-copy">
                <p class="hero-mission-kicker">
                  Why this film
                </p>
                <h1 class="hero-mission-title">
                  To make health care access clearer, fairer, and more human for people across the United States.
                </h1>
              </div>

              <div class="hero-mission-image">
                <NuxtImg
                  :src="heroMissionImageSrc"
                  alt="Medical team collaborating in a hospital hallway"
                  loading="eager"
                />
              </div>
            </article>

            <article
              ref="uninsuredMetricRef"
              class="hero-metric-panel"
            >
              <p class="hero-metric-overline">
                Over
              </p>
              <p class="hero-metric-number">
                {{ uninsuredPeopleFormatted }}
              </p>
              <p class="hero-metric-label">
                people in the U.S. were uninsured in 2024
              </p>
              <p class="hero-metric-source">
                CDC / NHIS, 2024
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section
      ref="storyFlowRef"
      class="story-flow shell"
    >
      <div class="headline-layer">
        <h2>
          Join the conversation
          <span>Share your story</span>
        </h2>
      </div>

      <div class="split-layer">
        <div class="manifesto-copy">
          <p class="manifesto-full">
            We talked to patients, caregivers, clinicians, and advocates to document what healthcare access actually looks like.
          </p>
          <p class="manifesto-short">
            We talked to patients, caregivers, clinicians, and advocates to document what healthcare access actually looks like.
          </p>
          <span class="manifesto-reveal" />
        </div>

        <span class="split-divider" />

        <div class="team-rail-wrap">
          <div class="team-rail">
            <article
              v-for="member in teamMembers"
              :key="`${member.name}-${member.role}`"
              class="team-card"
            >
              <div class="team-avatar">
                <NuxtImg
                  :src="member.imageSrc"
                  :alt="member.imageAlt"
                  :style="{ objectPosition: member.imagePosition ?? 'top' }"
                  loading="lazy"
                />
              </div>
              <div class="team-card-copy">
                <p class="person">
                  {{ member.name }}
                </p>
                <p class="role">
                  {{ member.role }}
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="next-layer">
        <h3>
          Explore Our
          <span>Resources</span>
        </h3>
        <div class="chapter-card">
          <span class="scanline" />
          <p>
            Billings exists to humanize the health care access crisis and turn awareness into action by connecting real stories to practical support.
          </p>
        </div>
      </div>
    </section>

    <section class="after-note shell">
      <h4>Built to inform, not overwhelm.</h4>
      <p>
        This format lets us keep guidance and resources current as policy, coverage rules, and community needs change.
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-film-page {
  --line: #111217;
  --card: #efeff1;
  --soft: #d5d6da;
  --accent: #2f58ff;
  min-height: 100vh;
  background: var(--theme-color-bg);
  color: var(--theme-color-text);
  font-family: var(--theme-font-text);
}

.shell {
  width: 100%;
  max-width: 86.25rem;
  margin-inline: auto;
  padding-inline: var(--space-5);
}

.about-intro {
  padding-top: 2.6rem;
  padding-bottom: 1rem;
  text-align: center;
}

.eyebrow {
  margin: 0;
  font-size: var(--theme-font-size-caption);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #6e7077;
  font-weight: 700;
}

.about-intro h1 {
  margin: 0.68rem auto 0;
  max-width: 61.25rem;
  font-size: clamp(1.8rem, 4.3vw, 3.75rem);
  line-height: 1;
  font-family: var(--theme-font-title);
}

.about-intro p {
  margin: 0.9rem auto 0;
  max-width: 47.5rem;
  font-size: var(--theme-font-size-brand);
  line-height: 1.5;
  color: var(--muted);
}

.story-stage {
  min-height: 290vh;
}

.story-sticky {
  position: sticky;
  top: 4.75rem;
  min-height: calc(100vh - 4.875rem);
  overflow: hidden;
  display: grid;
  align-items: center;
}

.story-flow {
  display: grid;
  gap: var(--space-30);
  padding-block: clamp(0.25rem, 1.2vh, 1.1rem) clamp(2.4rem, 6vh, 5rem);
  will-change: transform;
}

.studio-nav-pill {
  position: absolute;
  top: 0.7rem;
  left: 50%;
  transform: translateX(-50%);
  height: 2.75rem;
  min-width: min(92vw, 30rem);
  border-radius: 999px;
  background: color-mix(in oklab, #f7f7f8, transparent 7%);
  border: 1px solid color-mix(in oklab, #f0f0f2, #d6d7dc 45%);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 20;
  backdrop-filter: blur(0.5rem);
}

.studio-nav-pill span {
  font-size: var(--theme-font-size-caption);
  color: #696c75;
  letter-spacing: 0.09em;
}

.studio-nav-pill strong {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1;
  font-family: var(--theme-font-title);
}

.hero-panorama {
  position: relative;
  z-index: 2;
  padding-block: clamp(0.35rem, 1.5vh, 0.9rem);
  transition: opacity 220ms linear;
}

.hero-track {
  width: max-content;
  margin-left: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 100vw;
  align-items: stretch;
  justify-items: center;
  gap: 0;
  will-change: transform;
}

.hero-mission-panel {
  width: min(90vw, 106.25rem);
  height: clamp(26.25rem, calc(100vh - 9.375rem), 47.5rem);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, #f1f2f4 0%, #ececef 100%);
  box-shadow: 0 1.75rem 2.625rem rgba(35, 37, 45, 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 0.5fr) minmax(0, 0.5fr);
}

.hero-mission-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: clamp(1.4rem, 3vw, 3rem);
  background:var(--muted);
}

.hero-mission-kicker {
  margin: 0;
  font-size: var(--fs-brand);
  font-weight: 700;
  color: var(--accent-contrast);
}

.hero-mission-title {
  margin: 0.9rem 0 0;
  max-width: 16ch;
  font-family: var(--theme-font-title);
  font-size: clamp(1.9rem, 3.5vw, 3.7rem);
  line-height: 1;
}

.hero-mission-image {
  position: relative;
  overflow: hidden;
}

.hero-mission-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.hero-metric-panel {
  width: min(96vw, 110rem);
  position: relative;
  height: clamp(26.25rem, calc(100vh - 9.375rem), 47.5rem);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  text-align: center;
  padding: clamp(1.2rem, 2.3vw, 2.1rem);
}

.hero-metric-panel::before {
  content: '';
  position: absolute;
  inset: 11% 10%;
  background-image: radial-gradient(circle, rgb(243 243 243 / 20%) 1px, #ffffff00 1.2px);
  background-size: 0.75rem 0.75rem;
  opacity: 0.2;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.hero-metric-panel > * {
  position: relative;
  z-index: 1;
}

.hero-metric-overline {
    margin: 0.9rem auto 0;
    max-width: 38.75rem;
    color: var(--theme-color-text);
    line-height: 1.5;
    font-size: var(--fs-brand);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.hero-metric-number {
  margin: 0;
  font-family: var(--theme-font-title);
  font-size: 10rem;
  line-height: 1;
  letter-spacing: -0.034em;
  color: var(--muted);
}

.hero-metric-label {
  margin: 0.7rem auto 0;
  max-width: 24ch;
  font-size: clamp(0.78rem, 1.2vw, 1.02rem);
  line-height: 1.5;
  color: var(--muted);
  text-transform: lowercase;
}

.hero-metric-source {
  margin: 0.55rem 0 0;
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #959595;
}

.headline-layer {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  margin-bottom: clamp(0.8rem, 2.2vh, 2rem);
}

.headline-layer h2 {
  margin: 0;
  text-align: center;
  max-width: 14ch;
  font-size: clamp(2.1rem, 6.4vw, 6.1rem);
  line-height: 1;
  font-family: var(--theme-font-title);
}

.headline-layer h2 span {
  display: block;
  color: color-mix(in oklab, var(--theme-color-text), #90939d 55%);
  font-weight: 500;
}

.split-layer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) 1px minmax(0, 0.95fr);
  align-items: start;
  gap: 1.4rem;
  padding-top: 0;
}

.manifesto-copy {
  padding-right: clamp(0.4rem, 2vw, 1.8rem);
  position: sticky;
  top: 5.75rem;
  align-self: start;
}

.manifesto-full {
  margin: 0;
  font-size: clamp(1.4rem, 3.5vw, 4.2rem);
  line-height: 1;
  letter-spacing: -0.03em;
  max-width: 48.75rem;
  font-family: var(--theme-font-title);
}

.manifesto-short {
  display: none;
}

.split-divider {
  width: 1px;
  height: 94%;
  background: color-mix(in oklab, var(--line), white 45%);
  display: block;
}

.team-rail-wrap {
  min-height: 72vh;
  position: relative;
}

.team-rail {
  display: grid;
  gap: 3rem;
  will-change: transform;
}

.team-card {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  gap: 2rem;
  align-items: flex-start;
}

.team-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #d6d9de;
  box-shadow: 0.625rem 0.625rem 0 var(--muted);
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  object-position: top;
}

.team-card-copy .person {
  margin: 0;
  font-size: 2rem;
  line-height: 1;
  font-weight: 700;
  font-family: var(--theme-font-title);
  color: var(--muted);
}

.team-card-copy .role {
  margin: 0.22rem 0 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #959595;;
}

.next-layer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: clamp(0.9rem, 2.4vw, 2.2rem);
  margin-top: clamp(0.8rem, 2.6vh, 2.4rem);
}

.next-layer h3 {
  margin: 0;
  text-align: left;
  font-size: clamp(2.05rem, 5.4vw, 5rem);
  line-height: 1;
  letter-spacing: -0.028em;
  font-family: var(--theme-font-title);
}

.next-layer h3 span {
  display: block;
  color: color-mix(in oklab, var(--theme-color-text), #90939d 55%);
  font-weight: 500;
}

.chapter-card {
  position: relative;
  right: auto;
  top: auto;
  margin-left: auto;
  width: clamp(11rem, 16vw, 15.5rem);
  border-radius: var(--radius-lg);
  background: var(--muted);
  color: var(--accent-contrast);
  padding: 0.9rem 0.85rem;
  overflow: hidden;
}

.chapter-card p {
  margin: 0;
  font-size: var(--theme-font-size-sm);
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

.after-note {
  padding-block: 2rem 4.2rem;
}

.after-note h4 {
  margin: 0;
  font-size: clamp(1.36rem, 2.7vw, 2.25rem);
  font-family: var(--theme-font-title);
  letter-spacing: -0.02em;
}

.after-note p {
  margin: 0.65rem 0 0;
  max-width: 42.5rem;
  color: var(--muted);
  line-height: 1.5;
}

@keyframes scanline {
  0% {
    transform: translateY(-65%);
  }

  50% {
    transform: translateY(45%);
  }

  100% {
    transform: translateY(165%);
  }
}

@media screen and (max-width: 1280px) {
  .hero-track {
    margin-left: 0;
    grid-auto-columns: 100vw;
  }

  .team-card {
    grid-template-columns: 8.75rem minmax(0, 1fr);
  }
}

@media screen and (max-width: 1024px) {
  .story-stage {
    min-height: 250vh;
  }

  .story-sticky {
    top: var(--layout-header-height);
    min-height: calc(100vh - 4.75rem);
  }

  .story-flow {
    margin-top: 0;
  }

  .studio-nav-pill strong {
    font-size: 1.6rem;
  }

  .hero-track {
    margin-left: 0;
    grid-auto-columns: 100vw;
    gap: 0;
  }

  .hero-mission-panel {
    width: 92vw;
    height: clamp(25.5rem, calc(100vh - 9.375rem), 43.75rem);
    grid-template-columns: 1fr;
    border-radius: var(--radius-sm);
  }

  .hero-mission-copy {
    padding-block: 1.4rem 1.2rem;
  }

  .hero-mission-title {
    margin-top: 0.55rem;
    max-width: 22ch;
    font-size: clamp(1.8rem, 5.4vw, 2.9rem);
  }

  .hero-mission-image {
    min-height: clamp(18.75rem, 40vw, 20.5rem);
  }

  .hero-metric-panel {
    width: 96vw;
    height: clamp(25.5rem, calc(100vh - 9.375rem), 43.75rem);
    border-radius: var(--radius-sm);
  }

  .hero-metric-number {
    font-size: clamp(5rem, 17vw, 5.4rem);
  }

  .hero-metric-label {
    max-width: 30ch;
    font-size: 1rem;
  }

  .split-layer {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    align-content: center;
  }

  .manifesto-copy {
    position: relative;
    top: auto;
  }

  .manifesto-full {
    display: none;
  }

  .manifesto-short {
    margin: 0;
    display: block;
    font-size: clamp(1.4rem, 6.2vw, 2.3rem);
    line-height: 1;
    /* letter-spacing: -0.03em; */
    font-family: var(--theme-font-title);
  }

  .story-flow {
    gap: var(--space-20);
  }

  .manifesto-reveal,
  .split-divider {
    display: none;
  }

  .team-avatar {
    border-radius: 0.375rem;
    box-shadow: 0.375rem 0.375rem 0 var(--muted);
  }

  .team-rail-wrap {
    min-height: 52vh;
  }

  .team-card {
    grid-template-columns: 6.75rem minmax(0, 1fr);
    gap: 1.5rem;
  }

  .team-card-copy .role {
    margin: 0.22rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #acacac;
  }

  .next-layer {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chapter-card {
    margin-left: 0;
    width: 100%;
  }

  .after-note {
    margin-top: -8rem;
  }
}

@media screen and (max-width: 767px) {
  .shell {
    padding-inline: var(--space-4);
  }

  .team-card-copy .person {
    font-size: 1.5rem;
  }
  .about-intro {
    padding-top: 2rem;
  }

  .story-stage {
    min-height: 230vh;
  }

  .story-flow {
    margin-top: 0;
  }

  .studio-nav-pill {
    top: 0.4rem;
    min-width: min(94vw, 23.25rem);
    height: 2.5rem;
  }

  .studio-nav-pill span {
    font-size: var(--theme-font-size-caption);
  }

  .studio-nav-pill strong {
    font-size: 1.3rem;
  }

  .hero-track {
    margin-left: 0;
    grid-auto-columns: 100vw;
  }

  .hero-mission-panel,
  .hero-metric-panel {
    height: calc(100svh - var(--layout-header-height) - 2rem);
    border-radius: var(--radius-sm);
  }

  .hero-panorama {
    padding-block: 1rem;
  }

  .hero-mission-panel {
    width: calc(100vw - 2rem);
  }

  .hero-metric-panel {
    width: 96vw;
  }

  .hero-mission-copy {
    padding-inline: 1rem;
  }

  .hero-mission-title {
    font-size: clamp(1.48rem, 8vw, 2.15rem);
  }

  .hero-metric-overline {
    font-size: var(--theme-font-size-sm);
  }

  .hero-metric-label {
    font-size: 1rem;
    line-height: 1.5;
    max-width: 23ch;
  }

  .hero-metric-source {
    font-size: var(--theme-font-size-caption);
  }

  .headline-layer h2,
  .next-layer h3 {
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-stage {
    min-height: auto;
  }

  .story-sticky {
    position: relative;
    top: 0;
    min-height: auto;
    gap: 1.1rem;
    padding-top: 1.7rem;
    padding-bottom: 1.2rem;
  }

  .hero-track,
  .team-rail {
    transform: none !important;
  }

  .hero-track {
    width: 100%;
    margin-left: 0;
    grid-auto-flow: row;
    grid-auto-columns: minmax(0, 1fr);
    gap: 0.9rem;
  }

  .hero-mission-panel,
  .hero-metric-panel {
    height: auto;
    min-height: 16.25rem;
  }

  .headline-layer,
  .split-layer,
  .next-layer {
    position: relative;
    inset: auto;
    opacity: 1 !important;
    transform: none !important;
  }

  .split-layer {
    padding-top: 0;
  }

  .chapter-card {
    position: relative;
    top: auto;
    right: auto;
    margin: 0.8rem auto 0;
  }

  .chapter-card .scanline {
    animation: none;
  }
}
</style>
