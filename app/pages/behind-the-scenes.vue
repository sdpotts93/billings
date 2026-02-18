<script setup lang="ts">
import { Flip } from 'gsap/Flip'
import { gsap } from 'gsap'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const heroImageSrc = '/images/behind-the-scenes.jpg'
const heroVideoHref = 'https://example.com'
const maxPullOffset = 12
const enableStudioGridAnimation = false
const studioMoveDuration = 0.34
const studioMovePauseMs = 70
const studioGridColumnCount = 4
const studioGridRowCount = 3
const studioCopySlotIndex = ((studioGridRowCount - 1) * studioGridColumnCount) + (studioGridColumnCount - 2)
const studioReservedSlotOccupant = '__studio-copy__'
const studioGridSlots = Array.from({ length: studioGridColumnCount * studioGridRowCount }, (_, index) => {
  return {
    column: (index % studioGridColumnCount) + 1,
    row: Math.floor(index / studioGridColumnCount) + 1
  }
})
const studioInitialSlotOrder = [0, 2, 3, 5, 7, 8, 9] as const
const studioTargetSlotOrder = [1, 6, 2, 9, 3, 4, 8] as const

type StudioTile = {
  id: string
  src: string
  alt: string
}

type StudioMove = {
  from: number
  to: number
  tileId: string
}

const studioTiles: StudioTile[] = [
  {
    id: 'bts-1',
    src: '/images/bts_1.jpg',
    alt: 'Behind-the-scenes moment from the Billings production'
  },
  {
    id: 'bts-2',
    src: '/images/bts_2.jpg',
    alt: 'Crew coordinating on set during filming'
  },
  {
    id: 'bts-3',
    src: '/images/bts_3.jpg',
    alt: 'Cast and crew preparing a scene'
  },
  {
    id: 'bts-4',
    src: '/images/bts_4.jpg',
    alt: 'Production team reviewing footage'
  },
  {
    id: 'bts-5',
    src: '/images/bts_5.jpg',
    alt: 'On-set collaboration during the Billings shoot'
  },
  {
    id: 'bts-6',
    src: '/images/bts_6.jpg',
    alt: 'Filmmakers working through a setup between takes'
  },
  {
    id: 'bts-7',
    src: '/images/bts_7.jpg',
    alt: 'Behind-the-scenes portrait from production'
  }
]
const studioMovePlan: StudioMove[] = [
  { tileId: 'bts-1', from: 0, to: 1 },
  { tileId: 'bts-2', from: 2, to: 6 },
  { tileId: 'bts-3', from: 3, to: 2 },
  { tileId: 'bts-5', from: 7, to: 3 },
  { tileId: 'bts-6', from: 8, to: 4 },
  { tileId: 'bts-7', from: 9, to: 8 },
  { tileId: 'bts-4', from: 5, to: 9 }
]

const pointerOffsetX = ref(0)
const pointerOffsetY = ref(0)
const prefersReducedMotion = ref(false)
const studioGridRef = ref<HTMLElement | null>(null)
const hasStudioGridAnimated = ref(false)
const studioInitialSlotsById = studioTiles.reduce<Record<string, number>>((accumulator, tile, index) => {
  accumulator[tile.id] = studioInitialSlotOrder[index] ?? 0
  return accumulator
}, {})
const studioTargetSlotsById = studioTiles.reduce<Record<string, number>>((accumulator, tile, index) => {
  accumulator[tile.id] = studioTargetSlotOrder[index] ?? 0
  return accumulator
}, {})
const studioTileSlotsById = ref<Record<string, number>>(
  enableStudioGridAnimation ? { ...studioInitialSlotsById } : { ...studioTargetSlotsById }
)

let reduceMotionQuery: MediaQueryList | null = null
let studioGridObserver: IntersectionObserver | null = null

gsap.registerPlugin(Flip)

useSeoMeta({
  title: 'Behind the Scenes | Billings',
  ogTitle: 'Behind the Scenes | Billings',
  description: 'Behind-the-scenes moments from the Billings movie about a cystic fibrosis patient and her family.',
  ogDescription: 'Behind-the-scenes moments from the Billings movie about a cystic fibrosis patient and her family.'
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

const waitForMs = (durationMs: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

const getStudioTileStyle = (tileId: string) => {
  const slotIndex = studioTileSlotsById.value[tileId] ?? studioInitialSlotsById[tileId] ?? 0
  const slot = studioGridSlots[slotIndex] ?? studioGridSlots[0]

  return {
    gridColumn: String(slot?.column ?? 1),
    gridRow: String(slot?.row ?? 1)
  }
}

const buildStudioMoveSequence = () => {
  const occupancy: Array<string | null> = Array.from({ length: studioGridSlots.length }, () => null)
  occupancy[studioCopySlotIndex] = studioReservedSlotOccupant

  for (const tile of studioTiles) {
    const slotIndex = studioInitialSlotsById[tile.id]
    if (slotIndex === undefined) {
      return []
    }

    occupancy[slotIndex] = tile.id
  }

  const builtSequence: StudioMove[] = []
  for (const plannedMove of studioMovePlan) {
    const sourceSlot = studioGridSlots[plannedMove.from]
    const targetSlot = studioGridSlots[plannedMove.to]
    const movingTileCurrentIndex = occupancy.indexOf(plannedMove.tileId)

    if (!sourceSlot || !targetSlot || movingTileCurrentIndex !== plannedMove.from) {
      return []
    }

    if (occupancy[plannedMove.to] !== null) {
      return []
    }

    const columnDistance = Math.abs(sourceSlot.column - targetSlot.column)
    const rowDistance = Math.abs(sourceSlot.row - targetSlot.row)
    if (columnDistance + rowDistance !== 1) {
      return []
    }

    builtSequence.push(plannedMove)
    occupancy[plannedMove.from] = null
    occupancy[plannedMove.to] = plannedMove.tileId
  }

  return builtSequence
}

const animateStudioGrid = async () => {
  if (!enableStudioGridAnimation || hasStudioGridAnimated.value || !studioGridRef.value || prefersReducedMotion.value) {
    return
  }

  hasStudioGridAnimated.value = true
  const moveSequence = buildStudioMoveSequence()

  for (let moveIndex = 0; moveIndex < moveSequence.length; moveIndex += 1) {
    const move = moveSequence[moveIndex]
    if (!move) {
      continue
    }

    if (prefersReducedMotion.value) {
      studioTileSlotsById.value = { ...studioTargetSlotsById }
      return
    }

    const movingTileElement = studioGridRef.value.querySelector<HTMLElement>(`[data-tile-id="${move.tileId}"]`)
    if (!movingTileElement) {
      continue
    }

    const state = Flip.getState(movingTileElement)

    studioTileSlotsById.value = {
      ...studioTileSlotsById.value,
      [move.tileId]: move.to
    }
    await nextTick()

    await new Promise<void>((resolve) => {
      Flip.from(state, {
        absolute: true,
        duration: studioMoveDuration,
        ease: 'power1.inOut',
        onComplete: resolve
      })
    })

    if (moveIndex < moveSequence.length - 1) {
      await waitForMs(studioMovePauseMs)
    }
  }

  studioTileSlotsById.value = { ...studioTargetSlotsById }
}

const startStudioGridObserver = () => {
  if (
    typeof window === 'undefined'
    || !enableStudioGridAnimation
    || !studioGridRef.value
    || hasStudioGridAnimated.value
  ) {
    return
  }

  studioGridObserver = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some(entry => entry.isIntersecting)
      if (!isVisible) {
        return
      }

      studioGridObserver?.disconnect()
      studioGridObserver = null

      if (prefersReducedMotion.value) {
        studioTileSlotsById.value = { ...studioTargetSlotsById }
        hasStudioGridAnimated.value = true
        return
      }

      void animateStudioGrid()
    },
    {
      threshold: 0.35
    }
  )

  studioGridObserver.observe(studioGridRef.value)
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateReducedMotionPreference()
  reduceMotionQuery.addEventListener('change', updateReducedMotionPreference)

  if (!enableStudioGridAnimation) {
    studioTileSlotsById.value = { ...studioTargetSlotsById }
    hasStudioGridAnimated.value = true
    return
  }

  startStudioGridObserver()
})

onBeforeUnmount(() => {
  reduceMotionQuery?.removeEventListener('change', updateReducedMotionPreference)
  studioGridObserver?.disconnect()
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
            why this story matters
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
          Behind the movie
        </p>
        <h2>How this movie was made</h2>
        <p>
          Here are some behind-the-scenes moments from Billings, a movie about a cystic fibrosis patient and her family as they navigate the strain, uncertainty, and care barriers built into the U.S. health system.
        </p>
      </section>

      <section
        class="studio-life"
        aria-label="Behind-the-scenes collage"
      >
        <div
          ref="studioGridRef"
          class="studio-life-grid"
        >
          <figure
            v-for="tile in studioTiles"
            :key="tile.id"
            class="studio-tile"
            :data-tile-id="tile.id"
            :style="getStudioTileStyle(tile.id)"
          >
            <img
              :src="tile.src"
              :alt="tile.alt"
              loading="lazy"
              decoding="async"
            >
          </figure>

          <div class="studio-life-copy">
            <p>
              Billings follows one cystic fibrosis patient and her family through the daily realities of treatment schedules, insurance hurdles, and emotional strain. We filmed in homes, clinics, and community spaces to show how those pressures affect every part of life.
            </p>
            <p>
              Behind each chapter is fact-checking, consent review, and careful editing so every story stays accurate, respectful, and practical. The goal is to make a hard system easier to understand and connect viewers to help they can use right now.
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.behind-scenes-page {
  --frame-gap: 2.5rem;
  --ink: var(--theme-color-text);
  --muted: var(--theme-color-muted);
  --muted-13: var(--theme-color-muted-13);
  --line: var(--theme-color-line);
  --surface: var(--theme-color-bg);
  --bg-glow-1: var(--theme-color-bg-glow-1);
  --bg-glow-2: var(--theme-color-bg-glow-2);
  --font-title: var(--theme-font-title);
  --font-text: var(--theme-font-text);
  --fs-sm-plus: var(--theme-font-size-sm-plus);
  --fs-brand: var(--theme-font-size-brand);
  --fs-hero-lg: var(--theme-font-size-hero-lg);
  --fs-hero-mobile: var(--theme-font-size-hero-mobile);
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-text);
  background: var(--theme-color-bg);
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
  padding: clamp(2.1rem, 6vw, 4.2rem) 0 0;
  text-align: center;
}

.eyebrow {
    margin: 0.9rem auto 0;
    max-width: 620px;
    color: var(--muted);
    line-height: 1.45;
    font-size: var(--fs-brand);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.intro-copy h2 {
  margin: 0.45rem auto 0;
  max-width: 720px;
  font-family: var(--font-title);
  font-size: var(--fs-hero-lg);
  line-height: 1.02;
}

.intro-copy > p:not(.eyebrow) {
  margin: 0.9rem auto 0;
  max-width: 620px;
  color: var(--muted);
  line-height: 1.45;
  font-size: var(--fs-brand);
}

.studio-life {
  background: var(--theme-color-bg);
  margin-inline: calc(var(--frame-gap) * -1);
  padding: clamp(0.5rem, 1.4vw, 0.95rem) var(--frame-gap) var(--frame-gap);
}

.studio-life-copy {
  grid-column: 3;
  grid-row: 3;
  margin: 0;
  max-width: none;
  min-height: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  padding: 1rem;
  align-self: stretch;
  color: var(--muted);
  font-size: var(--fs-brand);
  line-height: 1.25;
}

.studio-life-copy p {
  margin: 0;
}

.studio-life-copy p + p {
  margin-top: 0.7rem;
}

.studio-life-grid {
  --studio-grid-gap: clamp(8px, 1.15vw, 14px);
  margin-top: clamp(1.35rem, 2.4vw, 1.95rem);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: var(--studio-grid-gap);
  position: relative;
  height: clamp(420px, 70vw, 980px);
}

.studio-tile {
  margin: 0;
  aspect-ratio: auto;
  overflow: hidden;
  background: #e8e8e4;
  will-change: transform;
  min-height: 0;
}

.studio-tile img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.hero-title {
  position: absolute;
  bottom: clamp(0.8rem, 2.4vw, 1.7rem);
  right: clamp(0.8rem, 2.6vw, 1.9rem);
  z-index: 3;
  margin: 0;
  max-width: min(78%, 10ch);
  font-family: var(--font-title);
  font-size: clamp(2.1rem, 8.8vw, 7.2rem);
  line-height: 0.9;
  text-transform: lowercase;
  text-wrap: balance;
  color: var(--ink);
}

.hero-media {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  width: 100%;
  height: calc(100vh - 68px - (var(--frame-gap) * 2));
  min-height: 380px;
  background: #d5ddd6;
  box-shadow: 24px 24px 0px var(--muted);
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
  .intro-copy h2 {
    font-size: var(--fs-hero-mobile);
  }

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
    grid-column: 1 / -1;
    grid-row: auto;
    max-width: 100%;
  }

  .studio-life-grid {
    height: auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .studio-tile {
    aspect-ratio: 1;
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

  .studio-life {
    padding-top: 0.2rem;
  }

  .studio-life-copy {
    max-width: 100%;
    line-height: 1.4;
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
