<script setup lang="ts">
type EmergencyLink = {
  label: string
  href: string
}

type ImpactCard = {
  label: string
  brand: string
  copy: string
  need: string
  emergencyLinks?: EmergencyLink[]
}

const heroCards = [
  {
    id: 'patient-diagnosis-journey',
    source: '#PatientStory',
    title: 'I delayed care while uninsured, then went to the ER when symptoms became unbearable.',
    cta: 'Read All',
    image: '/images/person-1.jpg'
  },
  {
    id: 'family-caregiver-appointments',
    source: '#FamilyCaregiver',
    title: 'I manage my dad\'s referrals and labs because one scheduling error can delay treatment.',
    cta: 'Read All',
    image: '/images/person-2.jpg'
  },
  {
    id: 'patient-billing-confusion',
    source: '#PatientVoice',
    title: 'As a patient, I still get surprise bills months later and cannot tell which are accurate.',
    cta: 'Read All',
    image: '/images/person-3.jpg'
  },
  {
    id: 'family-member-medication-help',
    source: '#FamilyMember',
    title: 'I compare pharmacy prices for my sister each month so she can stay on her medication.',
    cta: 'Read All',
    image: '/images/person-4.jpg'
  },
  {
    id: 'patient-prior-auth-delay',
    source: '#PatientJourney',
    title: 'My procedure was approved by my doctor, but prior authorization kept pushing it back.',
    cta: 'Read All',
    image: '/images/person-5.jpg'
  },
  {
    id: 'family-aftercare-coordination',
    source: '#CaregiverStory',
    title: 'After discharge, I coordinated follow-up visits for my spouse across three clinics.',
    cta: 'Read All',
    image: '/images/person-6.jpg'
  }
]

const impactCards: ImpactCard[] = [
  {
    label: 'Emergency / urgent symptoms',
    brand: 'Emergency support',
    copy: 'Start with immediate support first if you or someone else may be in danger.',
    need: 'emergency',
    emergencyLinks: [
      {
        label: 'Call 911',
        href: 'tel:911'
      }
    ]
  },
  {
    label: 'Insurance help / uninsured',
    brand: 'Coverage guidance',
    copy: 'Get step-by-step help for coverage, denials, appeals, and eligibility.',
    need: 'insurance'
  },
  {
    label: 'Paying for meds',
    brand: 'Prescription affordability',
    copy: 'Use practical options to lower medication costs and avoid interruptions.',
    need: 'meds'
  },
  {
    label: 'Paying medical bills / debt',
    brand: 'Medical bills and debt',
    copy: 'Use scripts and checklists to review charges and negotiate payment plans.',
    need: 'bills'
  },
  {
    label: 'Finding care',
    brand: 'Find care and specialists',
    copy: 'Locate clinics, referrals, and follow-up support for ongoing conditions.',
    need: 'finding-care'
  },
  {
    label: 'Helping someone else',
    brand: 'Support for families',
    copy: 'Tools for caregiver planning, respite options, and long-term coordination.',
    need: 'caregiver'
  },
  {
    label: 'Understanding a diagnosis',
    brand: 'Guidance by condition',
    copy: 'See focused next steps for CF, cancer, diabetes, dementia, and more.',
    need: 'diagnosis'
  }
]

const goToResourcesWithNeed = (need: string) => {
  void navigateTo({ path: '/resources', query: { need } })
}
</script>

<template>
  <div class="home-page">
    <main>
      <section class="hero">
        <div class="hero-header shell">
          <h1>Real stories about navigating U.S. healthcare, with practical help you can use now.</h1>
        </div>

        <div class="hero-rail shell">
          <div class="hero-carousel">
            <div class="hero-lane">
              <div class="hero-group">
                <article
                  v-for="(card, index) in heroCards"
                  :key="`${card.id}-a`"
                  class="hero-card"
                  :style="{ '--card-delay': `${index * 0.7}s` }"
                >
                  <div class="card-media">
                    <NuxtImg
                      :src="card.image"
                      :alt="card.title"
                    />
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
                  :style="{ '--card-delay': `${index * 0.7}s` }"
                >
                  <div class="card-media">
                    <NuxtImg
                      :src="card.image"
                      :alt="card.title"
                    />
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
        <p>
          Built to unite people affected by the U.S. healthcare system and share resources for patients and caregivers.
        </p>
      </section>

      <section class="testimonial shell">
        <h2 class="quote-title">
          Around 7.3% U.S. adults did not get needed medical care in the past year because of cost.
        </h2>
        <article class="quote-card">
          <div class="quote-left">
            <p class="quote">
              "My real hope for this film is that it inspires people to start using their voices for good and really fight for those who can't fight for themselves."
            </p>
            <p class="meta">
              Quote from Alexander Ludwig
            </p>
          </div>
          <div class="quote-foot">
            <!-- <div class="customer-list">
              <span>Denied referrals</span>
              <span>Prior-auth loops</span>
              <span>Confusing bills</span>
              <span>Provider shortages</span>
              <span>Coverage gaps</span>
            </div> -->
            <h3 class="quote-logo">
              Billings
              <span>
                Movie
              </span>
            </h3>
          </div>
        </article>
      </section>

      <section class="stats shell">
        <article>
          <h3>Real voices</h3>
          <p>Patient and caregiver stories show what navigating care access actually feels like.</p>
        </article>
        <article>
          <h3>Free support</h3>
          <p>Actionable links, helplines, and tools organized by the need you face right now.</p>
        </article>
        <article>
          <h3>Clear steps</h3>
          <p>Simple plans for today, this week, and ongoing follow-up so people can move forward.</p>
        </article>
      </section>

      <section class="impact shell">
        <h2>Where do you need help?</h2>
        <UButton
          label="Browse Resources"
          size="xs"
          class="stories-btn"
          to="/resources"
        />

        <div class="impact-grid">
          <article
            v-for="card in impactCards"
            :key="card.need"
            class="impact-card"
            role="link"
            tabindex="0"
            @click="goToResourcesWithNeed(card.need)"
            @keydown.enter.prevent="goToResourcesWithNeed(card.need)"
            @keydown.space.prevent="goToResourcesWithNeed(card.need)"
          >
            <p class="card-label">
              {{ card.label }}
            </p>
            <h3>{{ card.brand }}</h3>
            <p class="card-copy">
              {{ card.copy }}
            </p>
            <div
              v-if="card.emergencyLinks?.length"
              class="emergency-links"
            >
              <a
                v-for="link in card.emergencyLinks"
                :key="link.href"
                :href="link.href"
                class="emergency-link"
                @click.stop
              >
                {{ link.label }}
              </a>
            </div>
            <span
              class="card-link"
              aria-hidden="true"
            >
              <UIcon name="i-lucide-arrow-right-circle" />
            </span>
          </article>
        </div>
      </section>

      <section class="cta shell">
        <h2>Get support or share your experience</h2>
        <div class="cta-actions">
          <UButton
            label="Explore Resources"
            size="xs"
            class="start-btn"
          />
          <UButton
            label="Share Your Story"
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
  --lane-gap: var(--space-3);
  width: 100%;
  background: var(--theme-color-bg);
  color: var(--theme-color-text);
  font-family: var(--theme-font-text);
  overflow-x: clip;
}

.home-page :is(h1, h2, h3) {
  font-family: var(--theme-font-title);
}

.shell {
  width: 100%;
  max-width: 1220px;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.top-nav {
  border-bottom: 1px solid var(--theme-color-muted);
  background: var(--theme-color-bg);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.nav-link,
.login-link {
  color: var(--theme-color-muted);
  text-decoration: none;
  font-size: var(--theme-font-size-md);
  font-weight: 650;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

:deep(.start-btn) {
  border-radius: 999px;
  background: #7d5d4a;
  color: white;
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  text-decoration: none;
}

.hero {
  padding-top: 4rem;
}

.hero-header h1 {
  max-width: 29ch;
  margin: 0 auto;
  text-align: center;
  font-size: var(--theme-font-size-hero-xl);
  line-height: 1;
}

.hero-rail {
  margin-top: 1.5rem;
  position: relative;
}

.hero-carousel {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    overflow: hidden;
    padding-top: var(--space-8);
    padding-bottom: var(--space-4);
    margin-top: calc(var(--space-3) * -1);
    margin-bottom: calc(var(--space-3) * -1);
    position: relative;
}

.hero-carousel::before,
.hero-carousel::after {
  content: '';
  position: absolute;
  top: 0;
  width: clamp(2.25rem, 7vw, 5.5rem);
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.hero-carousel::before {
  left: 0;
  background: linear-gradient(90deg, var(--theme-color-bg) 0%, transparent 100%);
}

.hero-carousel::after {
  right: 0;
  background: linear-gradient(270deg, var(--theme-color-bg) 0%, transparent 100%);
}

.hero-lane {
  display: flex;
  width: max-content;
  gap: var(--lane-gap);
  padding: 0 0 0.45rem;
  animation: lane-scroll linear infinite;
  animation-duration: 90s;
}

.hero-group {
  display: flex;
  gap: var(--lane-gap);
}

.hero-card {
  width: min(86vw, 20rem);
  padding: var(--space-5);
  border-radius: var(--radius-md);
  background: #e7e4de;
  box-shadow: 0 0.625rem 1.25rem rgba(29, 23, 69, 0.06);
  display: grid;
  grid-template-columns: 45% minmax(0, 1fr);
  gap: var(--space-3);
  transition: transform 220ms ease, box-shadow 220ms ease;
  will-change: transform;
}

.card-media {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
  min-height: 14.5rem;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.source {
  margin: 0.125rem 0 0;
  font-size: var(--theme-font-size-caption);
  letter-spacing: 0.005em;
  color: var(--theme-color-brand-soft);
  font-weight: 780;
}

.hero-card h2 {
  margin: 0.4rem 0 0.55rem;
  font-size: var(--theme-font-size-card-title);
  line-height: 1.1;
  letter-spacing: -0.012em;
}

.watch-link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--theme-color-link-soft);
  text-decoration: none;
  font-size: var(--theme-font-size-note);
  font-weight: 740;
}

.quote-title {
  color: var(--theme-color-muted);
  text-transform: none;
  font-family: var(--font-sans) !important;
  text-align: center;
  margin-bottom: var(--space-6);
  font-size: 2rem;
  line-height: 1.4;
  width: 75%;
  margin: 0 auto;
  margin-bottom: var(--space-8);
  letter-spacing: 0;
}
.social-proof {
  margin-top: 2rem;
  text-align: center;
}

.social-proof p {
  margin: 0;
  font-size: var(--theme-font-size-xs);
  color: var(--theme-color-muted);
}

.logo-row {
  margin-top: 0.55rem;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--theme-color-muted-2);
  font-size: var(--theme-font-size-note);
  font-weight: 720;
}

.testimonial {
  padding-top: var(--space-24);
}

.quote-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--theme-color-line);
  background: var(--theme-color-surface);
  padding: 1.5rem;
  display: flex;
}

.overline {
  margin: 0;
  color: var(--theme-color-muted-2);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: var(--theme-font-size-caption);
  font-weight: 730;
}

.quote {
  margin: 0.65rem 0;
  max-width: 47.5rem;
  font-size: 1.5rem;
  line-height: 1.5;
  letter-spacing: -0.008em;
  font-weight: 600;
  margin-bottom: 5rem;
  color:  #7d5e4a;;
}

.meta {
  margin: 0;
  color: var(--theme-color-muted-2);
  font-size: var(--theme-font-size-sm);
  letter-spacing: 0.008em;
}

.quote-foot {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.quote-left {
  border-right: 1px solid var(--theme-color-muted-2);
  width: 60%;
  flex-shrink: 0;
  padding-right: 1rem;
}
.customer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  color: var(--theme-color-muted-2);
  font-size: var(--theme-font-size-note);
  font-weight: 710;
}

.quote-logo {
  margin: 0;
  font-size: var(--theme-font-size-display-lg);
  line-height: 1;
  letter-spacing: 0.009em;
}

.quote-logo span {
  display: block;
  font-size: 0.5em;
  color: var(--theme-color-muted-2);
  letter-spacing: 0.009em;
}

.stats {
  margin-top: 2.2rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stats article {
  min-height: 8rem;
}

.stats h3 {
  margin: 0;
  font-size: var(--theme-font-size-display-xl);
  line-height: 1;
}

.stats p {
  margin: 0.5rem 0 0;
  max-width: 16.25rem;
  font-size: var(--theme-font-size-brand);
  line-height: 1.5;
  color: var(--theme-color-muted);
}

.impact {
  padding-top: var(--space-24);
}

.impact h2 {
  max-width: 38.75rem;
  margin: 0;
  font-size: var(--theme-font-size-heading-md);
  line-height: 1;
}

:deep(.stories-btn) {
  margin-top: 0.75rem;
  border-radius: 999px;
  background: #7d5d4a;
  color: white;
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  text-decoration: none;
}

.impact-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.impact-card {
  min-height: 260px;
  border: 1px solid var(--theme-color-line);
  border-radius: var(--radius-md);
  background: var(--theme-color-surface);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease;
}

.impact-card:hover,
.impact-card:focus-visible {
  background: #ffffff;
}

.impact-card:focus-visible {
  outline: 0.125rem solid color-mix(in oklab, var(--theme-color-accent), #ffffff 70%);
  outline-offset: 0.125rem;
}

.impact-card:first-child {
  background-color: #b84a4a;
  color: white;
  border: none;
}

.card-label {
  margin: 0;
  color: var(--theme-color-muted-2);
  text-transform: uppercase;
  letter-spacing: 0.085em;
  font-size: var(--theme-font-size-caption);
  font-weight: 720;
}

.impact-card:first-child .card-label{
  color: white;
}

.impact-card h3 {
  margin: 8px 0 16px;
  font-size: var(--theme-font-size-display-md);
  line-height: 1;
}

.card-copy {
  margin: 0;
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-brand);
  line-height: 1.5;
}

.impact-card:first-child .card-copy{
  color: white;
}

.emergency-links {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 3rem;
    justify-content: space-evenly;
}

.emergency-link {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--theme-color-accent-contrast);
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.3em;
}

.impact-card:first-child .emergency-link {
  color: white;
}

.emergency-link:hover,
.emergency-link:focus-visible {
  color: var(--theme-color-text);
}

.card-link {
  margin-top: auto;
  color: var(--theme-color-muted-2);
}

.impact-card:first-child .card-link {
  color: white;
}

.cta {
  text-align: center;
  padding: var(--space-30) 0 5rem;
}

.cta h2 {
  margin: 0;
  font-size: var(--theme-font-size-heading-lg);
}

.cta-actions {
  margin-top: 0.8rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

:deep(.cta-outline) {
  border-radius: 999px;
  border: 0;
  border-radius: 999px;
  background: var(--theme-color-accent);
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  text-decoration: none;
}

.site-footer {
  position: relative;
  border-top: 1px solid var(--theme-color-line);
  background: var(--theme-color-muted);
}

.footer-glow {
  position: absolute;
  top: -3.5rem;
  left: 0;
  right: 0;
  height: 8rem;
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
  color: var(--theme-color-muted-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: var(--theme-font-size-xs);
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
  color: var(--theme-color-muted-2);
  text-decoration: none;
  font-size: var(--theme-font-size-sm);
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
    transform: translateY(-0.125rem);
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
    transform: translateY(-1.5rem);
  }
}

@media screen and (max-width: 991px) {
  .shell {
    max-width: 61.25rem;
    padding-inline: var(--space-5);
  }

  .nav-links {
    display: none;
  }

  .hero-card {
    width: min(84vw, 20.75rem);
    min-height: 12.25rem;
    grid-template-columns: 6.625rem minmax(0, 1fr);
  }

  .card-media {
    min-height: 11rem;
  }

  .stats,
  .impact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .footer-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 767px) {

  .quote-title {
    margin-inline: 0;
    font-size: 1.5rem;
    line-height: 1.2;
    text-align: left;
    width: 100%;
  }
  .hero-carousel::before,
  .hero-carousel::after {
    content: none;
  }

  .shell {
    padding-inline: var(--space-4);
  }

  .hero {
    padding-top: 4rem;
  }

  .hero-header h1 {
    font-size: var(--theme-font-size-hero-mobile);
  }

  .hero-card {
    width: min(82vw, 20rem);
    min-height: 11.25rem;
    padding: var(--space-3);
    grid-template-columns: 6.75rem minmax(0, 1fr);
    gap: var(--space-3);
  }

  .impact-card {
    min-height: 13.125rem;
  }

  .stats article {
    min-height: 5.5rem;
  }

  .card-media {
    min-height: 10.25rem;
  }

  .hero-card h2 {
    font-size: var(--theme-font-size-brand);
    margin: 0.35rem 0 0.45rem;
  }

  .watch-link {
    font-size: var(--theme-font-size-xs);
  }

  .social-proof {
    margin-top: var(--space-4);
    font-size: var(--theme-font-size-caption);
  }

  .social-proof p {
    font-size: var(--theme-font-size-caption);
  }
  .impact h2 {
    font-size: var(--theme-font-size-display-xl);
  }

  .stats h3 {
    font-size: var(--theme-font-size-heading-md);;
  }
  .stats,
  .impact-grid,
  .footer-columns {
    grid-template-columns: 1fr;
  }

  .quote-card {
    padding: 1.15rem;
    flex-direction: column;
    row-gap: 2rem;
  }

  .quote-left {
    width: 100%;
    border: none;
    border-bottom: 1px solid var(--theme-color-muted-2);
    margin-inline: 0;
    font-size: 1.5rem;
    line-height: 1.2;
    text-align: left;
    width: 100%;
  }

  .quote {
    width: 100%;
    margin-inline: 0;
    font-size: 1.25rem;
    line-height: 1.5;
    text-align: left;
    width: 100%;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .meta {
    margin-bottom: 1rem;
  }

  .stats p {
    max-width: unset;
    font-size: var(  --theme-font-size-brand);
  }
  .quote-foot {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .testimonial {
    padding-top: var(--space-20);
  }

  .impact {
    margin-top: 0;
    padding-top: var(--space-20);
  }

  .cta {
    padding: 3.5rem var(--space-4) 3.75rem;
  }

  :where(.i-lucide\:arrow-right-circle) {
    width: 2em;
    height: 2em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-lane,
  .hero-card {
    animation: none;
  }
}
</style>
