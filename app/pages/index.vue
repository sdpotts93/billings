<script setup lang="ts">
const heroCards = [
  {
    id: 'twse',
    source: '#TWSE',
    title: 'How Wise uses observations to build products',
    cta: 'Watch Video',
    image: 'https://i.pravatar.cc/300?img=12',
    tone: 'var(--theme-card-tone-1)'
  },
  {
    id: 'tyro',
    source: '#tyro',
    title: 'Understanding the power of knowing your customer',
    cta: 'Watch Video',
    image: 'https://i.pravatar.cc/300?img=47',
    tone: 'var(--theme-card-tone-2)'
  },
  {
    id: 'ideo',
    source: '#IDEO',
    title: 'How experimentation reshaped product outcomes',
    cta: 'Watch Video',
    image: 'https://i.pravatar.cc/300?img=32',
    tone: 'var(--theme-card-tone-3)'
  },
  {
    id: 'bench',
    source: '#Bench',
    title: 'Moving from assumptions to measurable product growth',
    cta: 'Watch Video',
    image: 'https://i.pravatar.cc/300?img=21',
    tone: 'var(--theme-card-tone-4)'
  },
  {
    id: 'north',
    source: '#North',
    title: 'Faster user journeys through behavior-driven insights',
    cta: 'Watch Video',
    image: 'https://i.pravatar.cc/300?img=15',
    tone: 'var(--theme-card-tone-5)'
  }
]

const customerLogos = [
  'Consumer',
  'Meta',
  'ServiceNow',
  'FinanceOnline',
  'Hotel + Wellness',
  'SaaS'
]

const impactCards = [
  {
    label: 'Retail',
    brand: 'AB Tasty',
    copy: 'Adopting a product-led growth strategy to drive free trial conversions'
  },
  {
    label: 'Services',
    brand: 'kkday',
    copy: 'Creating a culture of analytics to drive better user journeys'
  },
  {
    label: 'B2B',
    brand: 'DocuSign',
    copy: 'Signing up more customers'
  },
  {
    label: 'Financial Services',
    brand: 'AXA',
    copy: 'Improving conversion and engagement of product usage in Nepal'
  },
  {
    label: 'SaaS',
    brand: 'olo',
    copy: 'Using voice for success: boosting conversion rates by 7.8% with Mixpanel'
  },
  {
    label: 'Technology',
    brand: 'LG CNS',
    copy: 'Using Mixpanel to launch new products and instill a growth culture'
  },
  {
    label: 'Gaming',
    brand: 'Applovin',
    copy: 'Using player behavior insights to deliver better player experience'
  }
]
</script>

<template>
  <div class="home-page">
    <main>
      <section class="hero">
        <div class="hero-header shell">
          <h1>Teams like yours are building from their product data</h1>
        </div>

        <div class="hero-rail shell">
          <div class="hero-carousel">
            <div class="hero-lane">
              <div class="hero-group">
                <article
                  v-for="(card, index) in heroCards"
                  :key="`${card.id}-a`"
                  class="hero-card"
                  :style="{ '--tone': card.tone, '--card-delay': `${index * 0.7}s` }"
                >
                  <div class="card-media">
                    <img
                      :src="card.image"
                      :alt="card.title"
                    >
                    <span class="media-play">
                      <UIcon name="i-lucide-play" />
                    </span>
                  </div>
                  <div class="card-body">
                    <p class="source">
                      {{ card.source }}
                    </p>
                    <h2>{{ card.title }}</h2>
                    <a
                      href="#"
                      class="watch-link"
                    >{{ card.cta }} <UIcon name="i-lucide-arrow-right" /></a>
                  </div>
                </article>
              </div>

              <div
                class="hero-group"
                aria-hidden="true"
              >
                <article
                  v-for="(card, index) in heroCards"
                  :key="`${card.id}-b`"
                  class="hero-card"
                  :style="{ '--tone': card.tone, '--card-delay': `${index * 0.7}s` }"
                >
                  <div class="card-media">
                    <img
                      :src="card.image"
                      :alt="card.title"
                    >
                    <span class="media-play">
                      <UIcon name="i-lucide-play" />
                    </span>
                  </div>
                  <div class="card-body">
                    <p class="source">
                      {{ card.source }}
                    </p>
                    <h2>{{ card.title }}</h2>
                    <a
                      href="#"
                      class="watch-link"
                    >{{ card.cta }} <UIcon name="i-lucide-arrow-right" /></a>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="social-proof shell">
        <p>Join over 20,000+ companies who accelerated their growth with Mixpanel</p>
        <div class="logo-row">
          <span
            v-for="logo in customerLogos"
            :key="logo"
          >{{ logo }}</span>
        </div>
      </section>

      <section class="testimonial shell">
        <article class="quote-card">
          <p class="overline">
            Consumer Tech
          </p>
          <p class="quote">
            "Mixpanel enables our product managers and designers to uncover and focus on large opportunities for product discovery and improvement."
          </p>
          <p class="meta">
            Saif Rehman, Head of Products - Analytics and Experimentation
          </p>
          <div class="quote-foot">
            <div class="customer-list">
              <span>Miro Industry Partners</span>
              <span>Uber</span>
              <span>Gitlab</span>
              <span>NinjaVan</span>
              <span>NBCU</span>
            </div>
            <h3 class="quote-logo">
              yelp
            </h3>
          </div>
        </article>
      </section>

      <section class="stats shell">
        <article>
          <h3>3X</h3>
          <p>Improvement in signup rates from core product onboarding.</p>
        </article>
        <article>
          <h3>242M</h3>
          <p>Product questions answered per year with a self-serve analytics stack.</p>
        </article>
        <article>
          <h3>97.2%</h3>
          <p>Customer satisfaction score across all support experiences.</p>
        </article>
      </section>

      <section class="impact shell">
        <h2>How can product analytics impact your business?</h2>
        <UButton
          label="See Stories"
          size="xs"
          class="stories-btn"
        />

        <div class="impact-grid">
          <article
            v-for="card in impactCards"
            :key="card.brand"
            class="impact-card"
          >
            <p class="card-label">
              {{ card.label }}
            </p>
            <h3>{{ card.brand }}</h3>
            <p class="card-copy">
              {{ card.copy }}
            </p>
            <a
              href="#"
              class="card-link"
            >
              <UIcon name="i-lucide-arrow-right-circle" />
            </a>
          </article>
        </div>
      </section>

      <section class="cta shell">
        <h2>Make impactful decisions</h2>
        <div class="cta-actions">
          <UButton
            label="Get Demo"
            size="xs"
            class="start-btn"
          />
          <UButton
            label="Get Started Free"
            size="xs"
            color="neutral"
            variant="outline"
            class="cta-outline"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  --bg: var(--theme-color-bg);
  --ink: var(--theme-color-text);
  --muted: var(--theme-color-muted);
  --line: var(--theme-color-line);
  --line-soft: var(--theme-color-line-soft);
  --accent: var(--theme-color-accent);
  --accent-contrast: var(--theme-color-accent-contrast);
  --surface: var(--theme-color-surface);
  --strong-surface: var(--theme-color-strong-surface);
  --brand-soft: var(--theme-color-brand-soft);
  --link-soft: var(--theme-color-link-soft);
  --muted-2: var(--theme-color-muted-2);
  --muted-3: var(--theme-color-muted-3);
  --muted-4: var(--theme-color-muted-4);
  --muted-5: var(--theme-color-muted-5);
  --muted-6: var(--theme-color-muted-6);
  --muted-7: var(--theme-color-muted-7);
  --muted-8: var(--theme-color-muted-8);
  --muted-9: var(--theme-color-muted-9);
  --muted-10: var(--theme-color-muted-10);
  --muted-11: var(--theme-color-muted-11);
  --muted-12: var(--theme-color-muted-12);
  --font-title: var(--theme-font-title);
  --font-text: var(--theme-font-text);
  --fs-caption: var(--theme-font-size-caption);
  --fs-caption-plus: var(--theme-font-size-caption-plus);
  --fs-xs: var(--theme-font-size-xs);
  --fs-note: var(--theme-font-size-note);
  --fs-note-plus: var(--theme-font-size-note-plus);
  --fs-sm: var(--theme-font-size-sm);
  --fs-sm-plus: var(--theme-font-size-sm-plus);
  --fs-md: var(--theme-font-size-md);
  --fs-md-plus: var(--theme-font-size-md-plus);
  --fs-body: var(--theme-font-size-body);
  --fs-brand: var(--theme-font-size-brand);
  --fs-hero-xl: var(--theme-font-size-hero-xl);
  --fs-hero-mobile: var(--theme-font-size-hero-mobile);
  --fs-card-title: var(--theme-font-size-card-title);
  --fs-quote: var(--theme-font-size-quote);
  --fs-heading-md: var(--theme-font-size-heading-md);
  --fs-heading-lg: var(--theme-font-size-heading-lg);
  --fs-display-md: var(--theme-font-size-display-md);
  --fs-display-lg: var(--theme-font-size-display-lg);
  --fs-display-xl: var(--theme-font-size-display-xl);
  --lane-gap: 12px;
  width: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-text);
  overflow-x: clip;
}

.home-page :is(h1, h2, h3) {
  font-family: var(--font-title);
}

.shell {
  width: 100%;
  max-width: 1120px;
  margin-inline: auto;
  padding-inline: 24px;
}

.top-nav {
  border-bottom: 1px solid var(--line-soft);
  background: var(--bg);
}

.nav-shell {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  color: var(--ink);
  text-decoration: none;
  font-size: var(--fs-brand);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.nav-link,
.login-link {
  color: var(--muted);
  text-decoration: none;
  font-size: var(--fs-md);
  font-weight: 650;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.start-btn {
  border-radius: 999px;
  background: var(--accent) !important;
  color: var(--accent-contrast) !important;
}

.hero {
  padding-top: 2.25rem;
}

.hero-header h1 {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
  font-size: var(--fs-hero-xl);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.hero-rail {
  margin-top: 1.5rem;
  position: relative;
}

.hero-carousel {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  padding-top: 12px;
  padding-bottom: 14px;
  margin-top: -12px;
  margin-bottom: -14px;
  position: relative;
}

.hero-carousel::before,
.hero-carousel::after {
  content: '';
  position: absolute;
  top: 0;
  width: clamp(36px, 7vw, 88px);
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.hero-carousel::before {
  left: 0;
  background: linear-gradient(90deg, var(--bg) 0%, transparent 100%);
}

.hero-carousel::after {
  right: 0;
  background: linear-gradient(270deg, var(--bg) 0%, transparent 100%);
}

.hero-lane {
  display: flex;
  width: max-content;
  gap: var(--lane-gap);
  padding: 0 0 0.45rem;
  animation: lane-scroll linear infinite;
  animation-duration: 38s;
}

.hero-group {
  display: flex;
  gap: var(--lane-gap);
}

.hero-card {
  width: min(86vw, 352px);
  min-height: 210px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--tone), var(--line) 72%);
  background: linear-gradient(130deg, color-mix(in oklab, var(--tone), var(--surface) 26%) 0%, var(--surface) 86%);
  box-shadow: 0 10px 20px rgba(29, 23, 69, 0.06);
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  transition: transform 220ms ease, box-shadow 220ms ease;
  will-change: transform;
  animation: card-float 6.6s ease-in-out infinite;
  animation-delay: var(--card-delay);
}

.card-media {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  min-height: 188px;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-play {
  position: absolute;
  left: 8px;
  bottom: 8px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--strong-surface);
  color: var(--accent-contrast);
  display: grid;
  place-items: center;
  font-size: var(--fs-caption);
}

.card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.source {
  margin: 2px 0 0;
  font-size: var(--fs-caption-plus);
  letter-spacing: 0.005em;
  color: var(--brand-soft);
  font-weight: 780;
}

.hero-card h2 {
  margin: 0.4rem 0 0.55rem;
  font-size: var(--fs-card-title);
  line-height: 1.15;
  letter-spacing: -0.012em;
}

.watch-link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--link-soft);
  text-decoration: none;
  font-size: var(--fs-note);
  font-weight: 740;
}

.social-proof {
  margin-top: 2rem;
  text-align: center;
}

.social-proof p {
  margin: 0;
  font-size: var(--fs-body);
  color: var(--muted-2);
}

.logo-row {
  margin-top: 0.55rem;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--muted-3);
  font-size: var(--fs-note-plus);
  font-weight: 720;
}

.testimonial {
  margin-top: 1.75rem;
}

.quote-card {
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 1.5rem;
}

.overline {
  margin: 0;
  color: var(--muted-4);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: var(--fs-caption);
  font-weight: 730;
}

.quote {
  margin: 0.65rem 0;
  max-width: 760px;
  font-size: var(--fs-quote);
  line-height: 1.3;
  letter-spacing: -0.008em;
}

.meta {
  margin: 0;
  color: var(--muted-5);
  font-size: var(--fs-sm);
  letter-spacing: 0.008em;
}

.quote-foot {
  margin-top: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
}

.customer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  color: var(--muted-6);
  font-size: var(--fs-note);
  font-weight: 710;
}

.quote-logo {
  margin: 0;
  font-size: var(--fs-display-lg);
  letter-spacing: -0.045em;
  line-height: 1;
}

.stats {
  margin-top: 2.2rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stats article {
  min-height: 130px;
}

.stats h3 {
  margin: 0;
  font-size: var(--fs-display-xl);
  letter-spacing: -0.04em;
  line-height: 0.98;
}

.stats p {
  margin: 0.5rem 0 0;
  max-width: 260px;
  font-size: var(--fs-sm-plus);
  line-height: 1.32;
  color: var(--muted-7);
}

.impact {
  margin-top: 2.8rem;
}

.impact h2 {
  max-width: 620px;
  margin: 0;
  font-size: var(--fs-heading-md);
  line-height: 1.03;
  letter-spacing: -0.037em;
}

.stories-btn {
  margin-top: 0.75rem;
  border-radius: 999px;
}

.impact-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.impact-card {
  min-height: 230px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.card-label {
  margin: 0;
  color: var(--muted-8);
  text-transform: uppercase;
  letter-spacing: 0.085em;
  font-size: var(--fs-caption);
  font-weight: 720;
}

.impact-card h3 {
  margin: 0.4rem 0 0.6rem;
  font-size: var(--fs-display-md);
  letter-spacing: -0.041em;
  line-height: 0.98;
}

.card-copy {
  margin: 0;
  color: var(--muted-9);
  font-size: var(--fs-md-plus);
  line-height: 1.33;
}

.card-link {
  margin-top: auto;
  color: var(--muted-10);
}

.cta {
  text-align: center;
  padding: 4.5rem 0 5rem;
}

.cta h2 {
  margin: 0;
  font-size: var(--fs-heading-lg);
  letter-spacing: -0.037em;
}

.cta-actions {
  margin-top: 0.8rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.cta-outline {
  border-radius: 999px;
}

.site-footer {
  position: relative;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

.footer-glow {
  position: absolute;
  top: -56px;
  left: 0;
  right: 0;
  height: 130px;
  pointer-events: none;
  background: radial-gradient(circle at 38% 0%, rgba(243, 197, 209, 0.48) 0%, transparent 58%),
    radial-gradient(circle at 66% 0%, rgba(177, 168, 255, 0.42) 0%, transparent 58%);
}

.footer-shell {
  position: relative;
  padding: 2rem 0 2.25rem;
}

.footer-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.footer-columns {
  margin-top: 1.4rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.footer-columns h3 {
  margin: 0;
  color: var(--muted-11);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: var(--fs-xs);
  font-weight: 710;
}

.footer-columns ul {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.28rem;
}

.footer-columns a {
  color: var(--muted-12);
  text-decoration: none;
  font-size: var(--fs-sm);
}

@keyframes lane-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-50% - (var(--lane-gap) / 2)));
  }
}

@keyframes card-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@media (hover: hover) {
  .hero-carousel:hover .hero-lane,
  .hero-carousel:focus-within .hero-lane {
    animation-play-state: paused;
  }

  .hero-card:hover,
  .hero-card:focus-within {
    animation: none;
    transform: translateY(-8px);
  }
}

@media (max-width: 980px) {
  .shell {
    max-width: 980px;
    padding-inline: 20px;
  }

  .nav-links {
    display: none;
  }

  .hero-card {
    width: min(84vw, 332px);
    min-height: 196px;
    grid-template-columns: 106px minmax(0, 1fr);
  }

  .card-media {
    min-height: 176px;
  }

  .stats,
  .impact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .footer-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .shell {
    padding-inline: 16px;
  }

  .hero {
    padding-top: 1.8rem;
  }

  .hero-header h1 {
    font-size: var(--fs-hero-mobile);
  }

  .hero-card {
    width: min(82vw, 320px);
    min-height: 182px;
    padding: 10px;
    grid-template-columns: 108px minmax(0, 1fr);
    gap: 10px;
  }

  .card-media {
    min-height: 162px;
  }

  .hero-card h2 {
    font-size: var(--fs-brand);
    margin: 0.35rem 0 0.45rem;
  }

  .watch-link {
    font-size: var(--fs-xs);
  }

  .social-proof {
    margin-top: 18px;
  }

  .stats,
  .impact-grid,
  .footer-columns {
    grid-template-columns: 1fr;
  }

  .quote-card {
    padding: 1.15rem;
  }

  .quote-foot {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .cta {
    padding: 3.4rem 0 3.8rem;
  }

  .cta-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-lane,
  .hero-card {
    animation: none;
  }
}
</style>
