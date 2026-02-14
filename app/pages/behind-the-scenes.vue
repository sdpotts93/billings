<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const heroImageSrc = 'https://www.figma.com/api/mcp/asset/69508a6c-3ed3-44c7-aeee-35ddc2cb3af0'
const heroVideoHref = 'https://example.com'
const maxPullOffset = 12
const studioImages = {
  recordPlayer: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi_6.32600a9a.jpg&w=3840',
  officeLeft: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi_3.6aa8d03d.jpg&w=3840',
  officeRight: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi14.2d8c9216.jpg&w=3840',
  phones: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi_1.b380596a.jpg&w=3840',
  whiteShirt: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi9.b42a996b.jpg&w=3840',
  couchLaptop: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi23.850dbc72.jpg&w=3840',
  couchPortrait: 'https://aino.agency/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fi10.4d7eed27.jpg&w=3840'
}

const pointerOffsetX = ref(0)
const pointerOffsetY = ref(0)
const prefersReducedMotion = ref(false)

let reduceMotionQuery: MediaQueryList | null = null

useSeoMeta({
  title: 'Behind the Scenes | Billings',
  ogTitle: 'Behind the Scenes | Billings',
  description: 'Behind-the-scenes moments from the Billings documentary journey.',
  ogDescription: 'Behind-the-scenes moments from the Billings documentary journey.'
})

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const resetPointerPull = () => {
  pointerOffsetX.value = 0
  pointerOffsetY.value = 0
}

const updateReducedMotionPreference = () => {
  prefersReducedMotion.value = reduceMotionQuery?.matches ?? false

  if (prefersReducedMotion.value) {
    resetPointerPull()
  }
}

const handleMediaPointerMove = (event: PointerEvent) => {
  if (prefersReducedMotion.value || event.pointerType !== 'mouse') {
    return
  }

  const frame = event.currentTarget as HTMLElement | null
  if (!frame) {
    return
  }

  const bounds = frame.getBoundingClientRect()
  if (bounds.width === 0 || bounds.height === 0) {
    return
  }

  const relativeX = (event.clientX - bounds.left) / bounds.width
  const relativeY = (event.clientY - bounds.top) / bounds.height

  pointerOffsetX.value = clamp((relativeX - 0.5) * maxPullOffset * 2, -maxPullOffset, maxPullOffset)
  pointerOffsetY.value = clamp((relativeY - 0.5) * maxPullOffset * 2, -maxPullOffset, maxPullOffset)
}

const playButtonStyle = computed(() => {
  return {
    '--play-offset-x': `${pointerOffsetX.value.toFixed(2)}px`,
    '--play-offset-y': `${pointerOffsetY.value.toFixed(2)}px`
  }
})

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateReducedMotionPreference()
  reduceMotionQuery.addEventListener('change', updateReducedMotionPreference)
})

onBeforeUnmount(() => {
  reduceMotionQuery?.removeEventListener('change', updateReducedMotionPreference)
})
</script>

<template>
  <div class="behind-scenes-page">
    <main class="page-shell">
      <section class="hero">
        <div
          class="hero-media"
          @pointermove="handleMediaPointerMove"
          @pointerleave="resetPointerPull"
        >
          <h1 class="hero-title">
            why we did this
          </h1>

          <img
            :src="heroImageSrc"
            alt="Behind-the-scenes still"
            loading="eager"
            decoding="async"
          >

          <a
            class="hero-play"
            :href="heroVideoHref"
            :style="playButtonStyle"
            aria-label="Play behind-the-scenes video"
          >
            <UIcon name="i-lucide-play" />
          </a>
        </div>
      </section>

      <section class="intro-copy">
        <p class="eyebrow">
          Behind the scenes
        </p>
        <h2>What happened between filming and release</h2>
        <p>
          This page captures the process behind the documentary, from planning and interviews to edit decisions, pacing, and final delivery.
        </p>
      </section>

      <section
        class="studio-life"
        aria-label="Behind-the-scenes collage"
      >
        <div class="studio-life-copy">
          <p>
            We represent a new wave of creative agencies, built with technology in our DNA instead of middle management and outsourced developers. Thanks to the evolution of frameworks, we have the benefit to stay lean as a company while still maintaining a very high level of complexity and quality in our digital productions.
          </p>
          <p>
            So if you find yourself throwing money at a big agency and wondering who is really working on your project - we feel you. At Aino, you will get direct access to the people actually building your products, and we do that really well.
          </p>
        </div>

        <div class="studio-life-grid">
          <figure class="studio-tile tile-record-player">
            <img
              :src="studioImages.recordPlayer"
              alt="Record player and vinyl records"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-office-left">
            <img
              :src="studioImages.officeLeft"
              alt="People in a studio workspace"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-office-right">
            <img
              :src="studioImages.officeRight"
              alt="Team member working at a laptop"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-phones">
            <img
              :src="studioImages.phones"
              alt="Two coworkers looking at phones"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-white-shirt">
            <img
              :src="studioImages.whiteShirt"
              alt="Team member in a meeting room"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-couch-laptop">
            <img
              :src="studioImages.couchLaptop"
              alt="Team member typing on a laptop on a couch"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <figure class="studio-tile tile-couch-portrait">
            <img
              :src="studioImages.couchPortrait"
              alt="Coworkers sitting on a couch"
              loading="lazy"
              decoding="async"
            >
          </figure>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.behind-scenes-page {
  --frame-gap: clamp(8px, 1.15vw, 14px);
  --ink: var(--theme-color-text);
  --line: var(--theme-color-line);
  --surface: var(--theme-color-bg);
  --bg-glow-1: var(--theme-color-bg-glow-1);
  --bg-glow-2: var(--theme-color-bg-glow-2);
  --font-title: var(--theme-font-title);
  --font-text: var(--theme-font-text);
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-text);
  background:
    radial-gradient(circle at 10% 0%, var(--bg-glow-1) 0%, transparent 46%),
    radial-gradient(circle at 96% 0%, var(--bg-glow-2) 0%, transparent 48%),
    var(--surface);
}

.page-shell {
  width: 100%;
  max-width: none;
  margin-inline: auto;
  padding-inline: var(--frame-gap);
}

.hero {
  padding: var(--frame-gap) 0;
}

.intro-copy {
  margin-inline: auto;
  max-width: 860px;
  padding: clamp(2.1rem, 6vw, 4.2rem) 0 clamp(2.6rem, 7vw, 4.8rem);
  text-align: center;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--ink), white 48%);
  font-weight: 700;
}

.intro-copy h2 {
  margin: 0.58rem auto 0;
  max-width: 20ch;
  font-family: var(--font-title);
  font-size: clamp(1.65rem, 4.4vw, 3.1rem);
  line-height: 1.01;
  letter-spacing: -0.03em;
}

.intro-copy > p:not(.eyebrow) {
  margin: 0.85rem auto 0;
  max-width: 62ch;
  font-size: clamp(0.9rem, 1.25vw, 1.02rem);
  line-height: 1.55;
  color: color-mix(in oklab, var(--ink), white 38%);
}

.studio-life {
  background: #efefed;
  margin-inline: calc(var(--frame-gap) * -1);
  padding: clamp(0.5rem, 1.4vw, 0.95rem) var(--frame-gap) var(--frame-gap);
}

.studio-life-copy {
  max-width: 34ch;
  margin-left: calc(25% + (var(--frame-gap) * 0.5));
  margin-right: auto;
  color: #141414;
  font-size: clamp(0.95rem, 1vw, 1.03rem);
  line-height: 1.45;
  letter-spacing: -0.005em;
}

.studio-life-copy p {
  margin: 0;
}

.studio-life-copy p + p {
  margin-top: 1.7rem;
}

.studio-life-grid {
  margin-top: clamp(1.35rem, 2.4vw, 1.95rem);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--frame-gap);
}

.studio-tile {
  margin: 0;
  aspect-ratio: 1;
  overflow: hidden;
  background: #e8e8e4;
}

.studio-tile img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.tile-record-player {
  grid-column: 1;
  grid-row: 1;
}

.tile-office-left {
  grid-column: 3;
  grid-row: 1;
}

.tile-office-right {
  grid-column: 4;
  grid-row: 1;
}

.tile-phones {
  grid-column: 2;
  grid-row: 2;
}

.tile-white-shirt {
  grid-column: 4;
  grid-row: 2;
}

.tile-couch-laptop {
  grid-column: 1;
  grid-row: 3;
}

.tile-couch-portrait {
  grid-column: 2;
  grid-row: 3;
}

.hero-title {
  position: absolute;
  top: clamp(0.8rem, 2.4vw, 1.7rem);
  left: clamp(0.8rem, 2.6vw, 1.9rem);
  z-index: 3;
  margin: 0;
  max-width: min(78%, 10ch);
  font-family: var(--font-title);
  font-size: clamp(2.1rem, 8.8vw, 7.2rem);
  line-height: 0.9;
  letter-spacing: -0.05em;
  text-transform: lowercase;
  text-wrap: balance;
  color: #ffffff;
  text-shadow: 0 5px 22px rgba(4, 8, 12, 0.44);
}

.hero-media {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--line);
  width: 100%;
  height: calc(100vh - 68px - (var(--frame-gap) * 2));
  min-height: 380px;
  background: #d5ddd6;
  box-shadow: 0 26px 56px rgba(30, 28, 31, 0.14);
}

.hero-media::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(6, 7, 8, 0.04) 0%, rgba(6, 7, 8, 0.2) 100%);
}

.hero-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.hero-play {
  --play-offset-x: 0px;
  --play-offset-y: 0px;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 4;
  width: clamp(84px, 10vw, 132px);
  height: clamp(84px, 10vw, 132px);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: color-mix(in oklab, #101316, transparent 34%);
  color: #ffffff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 42px rgba(4, 6, 8, 0.35);
  backdrop-filter: blur(6px);
  transform: translate(
    calc(-50% + var(--play-offset-x)),
    calc(-50% + var(--play-offset-y))
  );
  transition: transform 170ms cubic-bezier(0.2, 0.75, 0.2, 1), background-color 170ms ease;
}

.hero-play :deep(.iconify) {
  width: clamp(34px, 3.5vw, 46px);
  height: clamp(34px, 3.5vw, 46px);
  margin-left: 0.15rem;
}

.hero-play:hover {
  background: color-mix(in oklab, #101316, white 8%);
}

.hero-play:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 4px;
}

@media (max-width: 1023px) {
  .hero-title {
    top: 0.75rem;
    left: 0.75rem;
    max-width: min(84%, 12ch);
    font-size: clamp(1.7rem, 9.8vw, 3.7rem);
    line-height: 0.92;
  }

  .hero-media {
    border-radius: 18px;
  }

  .studio-life-copy {
    margin-left: 0;
    margin-right: 0;
  }

  .studio-life-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .studio-tile {
    grid-column: auto !important;
    grid-row: auto !important;
  }
}

@media (max-width: 768px) {
  .hero-play {
    width: clamp(72px, 22vw, 92px);
    height: clamp(72px, 22vw, 92px);
  }

  .intro-copy {
    max-width: 100%;
    padding-top: 1.7rem;
    padding-bottom: 2.6rem;
  }

  .intro-copy h2 {
    max-width: 17ch;
  }

  .intro-copy > p:not(.eyebrow) {
    font-size: 0.92rem;
  }

  .studio-life {
    padding-top: 0.2rem;
  }

  .studio-life-copy {
    font-size: 0.92rem;
    max-width: 100%;
  }

  .studio-life-copy p + p {
    margin-top: 1.3rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-play {
    transition: background-color 170ms ease;
  }
}
</style>
