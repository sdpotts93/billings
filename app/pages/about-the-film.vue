<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

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
const stageProgress = ref(0)
const prefersReducedMotion = ref(false)

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const segment = (start: number, end: number) => {
  return clamp((stageProgress.value - start) / (end - start), 0, 1)
}

const heroPanX = computed(() => {
  return -50 * segment(0, 0.94)
})

const heroOpacity = computed(() => {
  return 1
})

const heroScale = computed(() => {
  return 1
})

const storyFlowLift = computed(() => {
  if (prefersReducedMotion.value) {
    return 0
  }

  return -128 * segment(0.94, 1)
})

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

const syncProgressFromViewport = () => {
  requestId = 0

  if (prefersReducedMotion.value) {
    stageProgress.value = 0.64
    return
  }

  const section = stageSection.value

  if (!section || typeof window === 'undefined') {
    return
  }

  const rect = section.getBoundingClientRect()
  const scrollRange = Math.max(1, rect.height - window.innerHeight)
  stageProgress.value = clamp(-rect.top / scrollRange, 0, 1)
}

const scheduleProgressSync = () => {
  if (requestId !== 0 || typeof window === 'undefined') {
    return
  }

  requestId = window.requestAnimationFrame(syncProgressFromViewport)
}

const applyMotionPreference = () => {
  prefersReducedMotion.value = Boolean(reduceMotionQuery?.matches)

  if (prefersReducedMotion.value) {
    uninsuredPeopleCount.value = uninsuredPeopleTotal
    hasAnimatedUninsuredMetric = true
  }

  scheduleProgressSync()
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

  applyMotionPreference()

  window.addEventListener('scroll', scheduleProgressSync, { passive: true })
  window.addEventListener('resize', scheduleProgressSync, { passive: true })
  scheduleProgressSync()

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
    window.removeEventListener('scroll', scheduleProgressSync)
    window.removeEventListener('resize', scheduleProgressSync)
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
          :style="{
            opacity: heroOpacity.toFixed(3),
            transform: `translateY(${(1 - heroOpacity) * 34}px) scale(${heroScale})`
          }"
        >
          <div
            class="hero-track"
            :style="{ transform: `translateX(${heroPanX}%)` }"
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
                <img
                  :src="heroMissionImageSrc"
                  alt="Medical team collaborating in a hospital hallway"
                  loading="eager"
                >
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
      class="story-flow shell"
      :style="{ marginTop: `${storyFlowLift}px` }"
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
                <img
                  :src="member.imageSrc"
                  :alt="member.imageAlt"
                  :style="{ objectPosition: member.imagePosition ?? 'top' }"
                  loading="lazy"
                >
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
  --page-bg: var(--theme-color-bg);
  --ink: var(--theme-color-text);
  --line: #111217;
  --card: #efeff1;
  --soft: #d5d6da;
  --accent: #2f58ff;
  min-height: 100vh;
  background: var(--page-bg);
  color: var(--ink);
  font-family: var(--theme-font-text);
}

.shell {
  width: 100%;
  max-width: 1380px;
  margin-inline: auto;
  padding-inline: 20px;
}

.about-intro {
  padding-top: 2.6rem;
  padding-bottom: 1rem;
  text-align: center;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #6e7077;
  font-weight: 700;
}

.about-intro h1 {
  margin: 0.68rem auto 0;
  max-width: 980px;
  font-size: clamp(1.8rem, 4.3vw, 3.75rem);
  line-height: 0.98;
  font-family: var(--theme-font-title);
}

.about-intro p {
  margin: 0.9rem auto 0;
  max-width: 760px;
  font-size: 0.96rem;
  line-height: 1.55;
  color: var(--muted);
}

.story-stage {
  min-height: 290vh;
}

.story-sticky {
  position: sticky;
  top: 76px;
  min-height: calc(100vh - 78px);
  overflow: hidden;
  display: grid;
  align-items: center;
}

.story-flow {
  display: grid;
  gap: 120px;
  padding-block: clamp(0.25rem, 1.2vh, 1.1rem) clamp(2.4rem, 6vh, 5rem);
}

.studio-nav-pill {
  position: absolute;
  top: 0.7rem;
  left: 50%;
  transform: translateX(-50%);
  height: 44px;
  min-width: min(92vw, 480px);
  border-radius: 999px;
  background: color-mix(in oklab, #f7f7f8, transparent 7%);
  border: 1px solid color-mix(in oklab, #f0f0f2, #d6d7dc 45%);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 20;
  backdrop-filter: blur(7px);
}

.studio-nav-pill span {
  font-size: 0.72rem;
  color: #696c75;
  letter-spacing: 0.09em;
}

.studio-nav-pill strong {
  font-size: 2.05rem;
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
  width: min(90vw, 1700px);
  height: clamp(420px, calc(100vh - 150px), 760px);
  border-radius: 8px;
  background: linear-gradient(180deg, #f1f2f4 0%, #ececef 100%);
  box-shadow: 0 28px 42px rgba(35, 37, 45, 0.1);
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
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent-contrast);
  letter-spacing: 0.08em;
}

.hero-mission-title {
  margin: 0.9rem 0 0;
  max-width: 16ch;
  font-family: var(--theme-font-title);
  font-size: clamp(1.9rem, 3.5vw, 3.7rem);
  line-height: 0.98;
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
  width: min(96vw, 1760px);
  position: relative;
  height: clamp(420px, calc(100vh - 150px), 760px);
  border-radius: 8px;
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
  background-size: 12px 12px;
  opacity: 1;
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
    max-width: 620px;
    color: var(--ink);
    line-height: 1.45;
    font-size: var(--fs-brand);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.hero-metric-number {
  margin: 0;
  font-family: var(--theme-font-title);
  font-size: 10rem;
  line-height: 0.9;
  letter-spacing: -0.034em;
  color: var(--muted);
}

.hero-metric-label {
  margin: 0.7rem auto 0;
  max-width: 24ch;
  font-size: clamp(0.78rem, 1.2vw, 1.02rem);
  line-height: 1.35;
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
  line-height: 0.93;
  font-family: var(--theme-font-title);
}

.headline-layer h2 span {
  display: block;
  color: color-mix(in oklab, var(--ink), #90939d 55%);
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
  top: 92px;
  align-self: start;
}

.manifesto-full {
  margin: 0;
  font-size: clamp(1.4rem, 3.5vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  max-width: 780px;
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
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 2rem;
  align-items: flex-start;
}

.team-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: #d6d9de;
  box-shadow: 10px 10px 0 var(--muted);
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
  line-height: 1.08;
  font-weight: 700;
  font-family: var(--theme-font-title);
  color: var(--muted);
}

.team-card-copy .role {
  margin: 0.22rem 0 0;
  font-size: 1rem;
  line-height: 1.1;
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
  line-height: 0.93;
  letter-spacing: -0.028em;
  font-family: var(--theme-font-title);
}

.next-layer h3 span {
  display: block;
  color: color-mix(in oklab, var(--ink), #90939d 55%);
  font-weight: 500;
}

.chapter-card {
  position: relative;
  right: auto;
  top: auto;
  margin-left: auto;
  width: clamp(176px, 16vw, 246px);
  border-radius: 14px;
  background: var(--muted);
  color: var(--accent-contrast);
  padding: 0.9rem 0.85rem;
  overflow: hidden;
}


.chapter-card p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 2;
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
  max-width: 680px;
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

@media (max-width: 1240px) {
  .hero-track {
    margin-left: 0;
    grid-auto-columns: 100vw;
  }

  .team-card {
    grid-template-columns: 140px minmax(0, 1fr);
  }
}

@media (max-width: 1023px) {
  .story-stage {
    min-height: 250vh;
  }

  .story-sticky {
    top: 74px;
    min-height: calc(100vh - 76px);
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
    height: clamp(410px, calc(100vh - 150px), 700px);
    grid-template-columns: 1fr;
    border-radius: 8px;
  }

  .hero-mission-copy {
    padding-block: 1.4rem 1.2rem;
  }

  .hero-mission-title {
    margin-top: 0.55rem;
    max-width: 20ch;
    font-size: clamp(1.8rem, 5.4vw, 2.9rem);
  }

  .hero-mission-image {
    min-height: clamp(220px, 40vw, 330px);
  }

  .hero-metric-panel {
    width: 96vw;
    height: clamp(410px, calc(100vh - 150px), 700px);
    border-radius: 8px;
  }

  .hero-metric-number {
    font-size: clamp(2.4rem, 11vw, 4.8rem);
  }

  .hero-metric-label {
    max-width: 30ch;
    font-size: 0.8rem;
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
    line-height: 1.02;
    letter-spacing: -0.03em;
    font-family: var(--theme-font-title);
  }

  .manifesto-reveal,
  .split-divider {
    display: none;
  }

  .team-rail-wrap {
    min-height: 52vh;
  }

  .team-card {
    grid-template-columns: 108px minmax(0, 1fr);
    gap: 0.58rem;
  }

  .next-layer {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chapter-card {
    margin-left: 0;
    width: 162px;
  }
}

@media (max-width: 768px) {
  .shell {
    padding-inline: 16px;
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
    min-width: min(94vw, 372px);
    height: 40px;
  }

  .studio-nav-pill span {
    font-size: 0.62rem;
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
    height: clamp(370px, calc(100vh - 145px), 560px);
    border-radius: 8px;
  }

  .hero-mission-panel {
    width: 94vw;
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
    font-size: 0.78rem;
  }

  .hero-metric-number {
    font-size: clamp(2rem, 13vw, 3.4rem);
  }

  .hero-metric-label {
    font-size: 0.74rem;
    line-height: 1.34;
  }

  .hero-metric-source {
    font-size: 0.58rem;
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
    min-height: 260px;
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
