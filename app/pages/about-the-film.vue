<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type HeroFigure = {
  name: string
  role: string
  initials: string
  pose: 'sit' | 'stand'
  tone: string
}

type TeamMember = {
  name: string
  role: string
  badge: string
  bio: string
  initials: string
  tone: string
}

const heroFigures: HeroFigure[] = [
  {
    name: 'Ralph',
    role: 'Co-founder / MD',
    initials: 'RA',
    pose: 'sit',
    tone: '#d2bca8'
  },
  {
    name: 'Julian',
    role: 'Co-founder / CD',
    initials: 'JU',
    pose: 'stand',
    tone: '#aec2d1'
  },
  {
    name: 'Pablo',
    role: 'Designer',
    initials: 'PA',
    pose: 'sit',
    tone: '#d7b2b1'
  },
  {
    name: 'Johann',
    role: 'Senior Designer',
    initials: 'JO',
    pose: 'stand',
    tone: '#c9c8ac'
  },
  {
    name: 'Nina',
    role: 'Store Help',
    initials: 'NI',
    pose: 'stand',
    tone: '#c7cad9'
  },
  {
    name: 'Sophie',
    role: 'Designer',
    initials: 'SO',
    pose: 'sit',
    tone: '#d3c7a8'
  },
  {
    name: 'Senna',
    role: 'Store Manager',
    initials: 'SE',
    pose: 'stand',
    tone: '#d3bca8'
  },
  {
    name: 'Faye',
    role: 'Designer',
    initials: 'FA',
    pose: 'sit',
    tone: '#c6a7c5'
  },
  {
    name: 'Nikita',
    role: 'Brand',
    initials: 'NK',
    pose: 'stand',
    tone: '#adc8ce'
  },
  {
    name: 'Liam',
    role: 'Strategy',
    initials: 'LI',
    pose: 'sit',
    tone: '#cdc7b2'
  }
]

const teamMembers: TeamMember[] = [
  {
    name: 'Ralph',
    role: 'Co-founder / MD',
    badge: 'NL/SR',
    bio: 'Leads operations, planning, and partnerships across product and studio work.',
    initials: 'RA',
    tone: '#d2bca8'
  },
  {
    name: 'Julian',
    role: 'Co-founder / CD',
    badge: 'NL',
    bio: 'Drives creative direction, design craft, and visual quality from concept to launch.',
    initials: 'JU',
    tone: '#aec2d1'
  },
  {
    name: 'Johann',
    role: 'Senior Designer',
    badge: 'DE',
    bio: 'Builds interaction systems and expressive layouts with strong product discipline.',
    initials: 'JO',
    tone: '#c9c8ac'
  },
  {
    name: 'Senna',
    role: 'Store Manager',
    badge: 'NL/SR',
    bio: 'Runs day-to-day delivery and keeps production moving across every team lane.',
    initials: 'SE',
    tone: '#d3bca8'
  },
  {
    name: 'Nina',
    role: 'Store Help',
    badge: 'NL/SR',
    bio: 'Supports studio operations and maintains smooth handoffs between disciplines.',
    initials: 'NI',
    tone: '#c7cad9'
  },
  {
    name: 'Sophie',
    role: 'Designer',
    badge: 'NL/PT',
    bio: 'Shapes brand expression and interface details with a clear editorial eye.',
    initials: 'SO',
    tone: '#d3c7a8'
  },
  {
    name: 'Faye',
    role: 'Designer',
    badge: 'NL/GR',
    bio: 'Leads product UI explorations and visual prototyping for new initiatives.',
    initials: 'FA',
    tone: '#c6a7c5'
  },
  {
    name: 'Pablo',
    role: 'Designer',
    badge: 'ES',
    bio: 'Designs expressive systems for campaigns, storytelling pages, and launches.',
    initials: 'PA',
    tone: '#d7b2b1'
  }
]

useSeoMeta({
  title: 'About the Film | Billings',
  ogTitle: 'About the Film | Billings',
  description: 'A cinematic, scroll-driven walkthrough of the team and process behind Billings.',
  ogDescription: 'A cinematic, scroll-driven walkthrough of the team and process behind Billings.'
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

const fadeWindow = (fadeInStart: number, fadeInEnd: number, fadeOutStart: number, fadeOutEnd: number) => {
  return segment(fadeInStart, fadeInEnd) * (1 - segment(fadeOutStart, fadeOutEnd))
}

const heroPanX = computed(() => {
  return -56 * segment(0, 0.4)
})

const heroOpacity = computed(() => {
  return 1 - segment(0.34, 0.56)
})

const heroScale = computed(() => {
  return 1 - segment(0.34, 0.56) * 0.08
})

const headlineOpacity = computed(() => {
  return fadeWindow(0.16, 0.33, 0.5, 0.66)
})

const splitOpacity = computed(() => {
  return fadeWindow(0.44, 0.61, 0.82, 0.95)
})

const splitOffsetY = computed(() => {
  return (1 - segment(0.44, 0.61)) * 50
})

const manifestoReveal = computed(() => {
  return segment(0.49, 0.72)
})

const railShiftY = computed(() => {
  return -44 * segment(0.54, 0.83)
})

const nextOpacity = computed(() => {
  return segment(0.78, 0.93)
})

const nextOffsetY = computed(() => {
  return (1 - segment(0.78, 0.93)) * 28
})

const previewPointerX = ref<number | null>(null)
const previewPointerY = ref<number | null>(null)
const previewRevealStart = 0.6

const isPreviewFollowing = computed(() => {
  return previewPointerX.value !== null && previewPointerY.value !== null
})

const shouldShowPreview = computed(() => {
  return isPreviewFollowing.value && stageProgress.value >= previewRevealStart
})

const previewStyle = computed(() => {
  if (previewPointerX.value === null || previewPointerY.value === null) {
    return {}
  }

  const offsetX = 20
  const offsetY = -20

  return {
    left: `${previewPointerX.value + offsetX}px`,
    top: `${previewPointerY.value + offsetY}px`
  }
})

let requestId = 0
let reduceMotionQuery: MediaQueryList | null = null
let reduceMotionListener: (() => void) | null = null

const resetStagePointer = () => {
  previewPointerX.value = null
  previewPointerY.value = null
}

const handleGlobalPointerMove = (event: PointerEvent) => {
  if (prefersReducedMotion.value) {
    return
  }

  if (event.pointerType === 'touch') {
    resetStagePointer()
    return
  }

  previewPointerX.value = event.clientX
  previewPointerY.value = event.clientY
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
    resetStagePointer()
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

  window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true })
  window.addEventListener('pointerleave', resetStagePointer, { passive: true })
  window.addEventListener('scroll', scheduleProgressSync, { passive: true })
  window.addEventListener('resize', scheduleProgressSync, { passive: true })
  scheduleProgressSync()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', handleGlobalPointerMove)
    window.removeEventListener('pointerleave', resetStagePointer)
    window.removeEventListener('scroll', scheduleProgressSync)
    window.removeEventListener('resize', scheduleProgressSync)
  }

  if (requestId !== 0 && typeof window !== 'undefined') {
    window.cancelAnimationFrame(requestId)
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
      <div class="story-sticky shell">
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
            <article
              v-for="figure in heroFigures"
              :key="`${figure.name}-${figure.role}`"
              class="hero-figure"
              :class="`is-${figure.pose}`"
              :style="{ '--tone': figure.tone }"
            >
              <div class="hero-figure-body">
                <span class="hero-figure-role">{{ figure.role }}</span>
                <span class="hero-figure-name">{{ figure.name }}</span>
                <span class="hero-figure-initials">{{ figure.initials }}</span>
              </div>
            </article>
          </div>
        </div>

        <div
          class="headline-layer"
          :style="{
            opacity: headlineOpacity.toFixed(3),
            transform: `translateY(${(1 - headlineOpacity) * 32}px)`
          }"
        >
          <h2>
            Join our team
            <span>See jobs</span>
          </h2>
        </div>

        <div
          class="split-layer"
          :style="{
            opacity: splitOpacity.toFixed(3),
            transform: `translateY(${splitOffsetY}px)`
          }"
        >
          <div class="manifesto-copy">
            <p class="manifesto-full">
              We work hand in hand with a diverse set of professionals and standout individuals, encouraging a familial bond within our team.
            </p>
            <p class="manifesto-short">
              We work hand in hand with a diverse team of standout professionals.
            </p>
            <span
              class="manifesto-reveal"
              :style="{ transform: `scaleX(${manifestoReveal})` }"
            />
          </div>

          <span class="split-divider" />

          <div class="team-rail-wrap">
            <div
              class="team-rail"
              :style="{ transform: `translateY(${railShiftY}%)` }"
            >
              <article
                v-for="member in teamMembers"
                :key="`${member.name}-${member.role}`"
                class="team-card"
              >
                <div
                  class="team-avatar"
                  :style="{ '--tone': member.tone }"
                >
                  <span>{{ member.initials }}</span>
                </div>
                <div class="team-card-copy">
                  <p class="person">
                    {{ member.name }}
                    <span>{{ member.badge }}</span>
                  </p>
                  <p class="role">
                    {{ member.role }}
                  </p>
                  <p class="bio">
                    {{ member.bio }}
                  </p>
                </div>
              </article>
            </div>

            <div
              class="floating-preview-anchor"
              aria-hidden="true"
            />
          </div>
        </div>

        <div
          class="next-layer"
          :style="{
            opacity: nextOpacity.toFixed(3),
            transform: `translateY(${nextOffsetY}px)`
          }"
        >
          <h3>
            Next chapter
            <span>Expertise</span>
          </h3>
          <div class="chapter-card">
            <span class="scanline" />
            <p>
              Product strategy
              <br>
              Visual systems
              <br>
              Webflow delivery
              <br>
              Motion direction
            </p>
          </div>
        </div>
      </div>
    </section>

    <div
      v-show="shouldShowPreview"
      class="floating-preview"
      :style="previewStyle"
      aria-hidden="true"
    >
      <div class="preview-card">
        <p>Analogue Agency crafts meaningful digital experiences.</p>
      </div>
    </div>

    <section class="after-note shell">
      <h4>Built as interaction, not video.</h4>
      <p>
        This version is now fully native HTML/CSS/JS, so we can tune timing, copy, and behavior directly in the site.
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-film-page {
  --page-bg: #e7e7e9;
  --ink: #101015;
  --muted: #5f6068;
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
  letter-spacing: -0.03em;
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
  min-height: 360vh;
}

.story-sticky {
  position: sticky;
  top: 76px;
  min-height: calc(100vh - 78px);
  overflow: hidden;
  display: grid;
  align-items: center;
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
  transition: opacity 220ms linear;
}

.hero-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(180px, 220px);
  align-items: end;
  gap: 1.2rem;
  will-change: transform;
}

.hero-figure {
  border-radius: 24px 24px 34px 34px;
  border: 1px solid color-mix(in oklab, #cfd0d3, transparent 25%);
  background: color-mix(in oklab, var(--tone), white 19%);
  overflow: hidden;
  box-shadow: 0 26px 38px rgba(42, 42, 50, 0.11);
  position: relative;
}

.hero-figure-body {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 17%, color-mix(in oklab, var(--tone), white 56%) 0, color-mix(in oklab, var(--tone), white 40%) 16%, transparent 16.5%),
    linear-gradient(180deg, color-mix(in oklab, var(--tone), black 2%) 0%, color-mix(in oklab, var(--tone), black 12%) 72%, color-mix(in oklab, #c9cace, black 15%) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0.78rem;
}

.hero-figure-role {
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #30343e;
  opacity: 0.68;
}

.hero-figure-name {
  margin-top: 0.08rem;
  font-size: 0.93rem;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.hero-figure-initials {
  position: absolute;
  top: 0.66rem;
  right: 0.66rem;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: color-mix(in oklab, #0f1219, var(--tone) 30%);
  color: #f7f7fb;
  font-size: 0.68rem;
  font-weight: 760;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hero-figure.is-stand {
  height: min(56vh, 540px);
}

.hero-figure.is-sit {
  height: min(46vh, 440px);
}

.headline-layer {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.headline-layer h2 {
  margin: 0;
  text-align: center;
  font-size: clamp(2.1rem, 6.4vw, 6.1rem);
  line-height: 0.93;
  letter-spacing: -0.03em;
  font-family: var(--theme-font-title);
}

.headline-layer h2 span {
  display: block;
  color: color-mix(in oklab, var(--ink), #90939d 55%);
  font-weight: 500;
}

.split-layer {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) 1px minmax(0, 0.95fr);
  align-items: center;
  gap: 1.4rem;
  padding-top: 2.8rem;
}

.manifesto-copy {
  padding-right: clamp(0.4rem, 2vw, 1.8rem);
  position: relative;
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

.manifesto-reveal {
  position: absolute;
  left: 0;
  right: 18%;
  top: 0;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(180deg, rgba(210, 211, 217, 0.46), rgba(210, 211, 217, 0));
  pointer-events: none;
  mix-blend-mode: multiply;
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
  gap: 0.8rem;
  will-change: transform;
}

.team-card {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 0.65rem;
  align-items: center;
}

.team-avatar {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  border: 1px solid color-mix(in oklab, #d8d9de, transparent 15%);
  background:
    radial-gradient(circle at 50% 18%, color-mix(in oklab, var(--tone), white 58%) 0, color-mix(in oklab, var(--tone), white 39%) 16%, transparent 16.5%),
    linear-gradient(180deg, color-mix(in oklab, var(--tone), white 12%) 0%, color-mix(in oklab, var(--tone), black 8%) 64%, color-mix(in oklab, #d8d9de, black 10%) 100%);
  position: relative;
}

.team-avatar span {
  position: absolute;
  right: 0.56rem;
  bottom: 0.56rem;
  min-width: 34px;
  min-height: 34px;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: color-mix(in oklab, #0f1117, var(--tone) 20%);
  color: #f7f8fb;
  font-size: 0.68rem;
  font-weight: 740;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.team-card-copy .person {
  margin: 0;
  font-size: clamp(1.08rem, 1.6vw, 1.6rem);
  line-height: 1.08;
  font-weight: 730;
}

.team-card-copy .person span {
  margin-left: 0.36rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.1rem;
  padding: 0 0.42rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.56rem;
  letter-spacing: 0.05em;
  font-weight: 700;
  transform: translateY(-0.2em);
}

.team-card-copy .role {
  margin: 0.22rem 0 0;
  font-size: clamp(0.95rem, 1.35vw, 1.45rem);
  color: color-mix(in oklab, #3c3d42, #90939d 35%);
  line-height: 1.1;
}

.team-card-copy .bio {
  margin: 0.43rem 0 0;
  color: color-mix(in oklab, var(--muted), #9da0a9 30%);
  font-size: 0.83rem;
  line-height: 1.42;
}

.floating-preview-anchor {
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.floating-preview {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
  pointer-events: none;
  will-change: left, top;
}

.preview-card {
  width: clamp(152px, 16vw, 228px);
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  background: linear-gradient(140deg, #0f1014, #181a21 55%, #0f1014);
  border: 1px solid #2b2e38;
  color: #f1f3f8;
  padding: 0.7rem;
  font-size: 0.74rem;
  line-height: 1.35;
  position: relative;
  overflow: hidden;
}

.preview-card::after {
  content: '';
  position: absolute;
  inset: -35%;
  background: linear-gradient(120deg, transparent 40%, rgba(255, 255, 255, 0.24), transparent 58%);
  transform: rotate(8deg);
  animation: previewSweep 4s linear infinite;
}

.preview-card p {
  margin: 0;
  position: relative;
  z-index: 1;
}

.next-layer {
  position: absolute;
  inset: 0;
  z-index: 9;
  display: grid;
  place-items: center;
}

.next-layer h3 {
  margin: 0;
  text-align: center;
  font-size: clamp(2.05rem, 5.4vw, 5rem);
  line-height: 0.93;
  letter-spacing: -0.028em;
  font-family: var(--theme-font-title);
}

.next-layer h3 span {
  display: block;
  color: color-mix(in oklab, #3a3b40, #9b9ea6 47%);
  font-weight: 500;
}

.chapter-card {
  position: absolute;
  right: clamp(1rem, 4vw, 4rem);
  top: 24%;
  width: clamp(176px, 16vw, 246px);
  border-radius: 14px;
  border: 1px solid #2a2d34;
  background: #101218;
  color: #f0f2f6;
  padding: 0.9rem 0.85rem;
  overflow: hidden;
}

.chapter-card .scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(64, 97, 255, 0.15), transparent);
  animation: scanline 2.7s ease-in-out infinite;
}

.chapter-card p {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
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

@keyframes previewSweep {
  from {
    transform: translateX(-36%) rotate(8deg);
  }

  to {
    transform: translateX(48%) rotate(8deg);
  }
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
    grid-auto-columns: minmax(168px, 206px);
  }

  .team-card {
    grid-template-columns: 140px minmax(0, 1fr);
  }
}

@media (max-width: 1023px) {
  .story-stage {
    min-height: 300vh;
  }

  .story-sticky {
    top: 74px;
    min-height: calc(100vh - 76px);
  }

  .studio-nav-pill strong {
    font-size: 1.6rem;
  }

  .hero-track {
    grid-auto-columns: minmax(146px, 168px);
    gap: 0.9rem;
  }

  .split-layer {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    padding-top: 3.2rem;
    align-content: center;
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

  .team-card-copy .bio {
    display: none;
  }

  .chapter-card {
    right: 0.7rem;
    top: 14%;
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
    min-height: 275vh;
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

  .hero-figure {
    border-radius: 18px 18px 24px 24px;
  }

  .hero-figure.is-stand {
    height: min(42vh, 360px);
  }

  .hero-figure.is-sit {
    height: min(35vh, 300px);
  }

  .headline-layer h2 {
    margin-top: 0.95rem;
  }

  .next-layer h3 {
    margin-top: 1.5rem;
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

  .preview-card::after,
  .chapter-card .scanline {
    animation: none;
  }
}
</style>
