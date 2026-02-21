<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Community', to: '/share-your-story' },
  { label: 'Resources', to: '/resources' },
  { label: 'Behind the Scenes', to: '/behind-the-scenes' },
  { label: 'About', to: '/about-the-film' }
]

const sitemapLinks = [
  { label: 'Home', to: '/' },
  { label: 'Community', to: '/share-your-story' },
  { label: 'Resources', to: '/resources' },
  { label: 'Behind the Scenes', to: '/behind-the-scenes' },
  { label: 'About', to: '/about-the-film' }
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com', icon: 'i-simple-icons-instagram' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: 'i-simple-icons-linkedin' },
  { label: 'Facebook', href: 'https://www.facebook.com', icon: 'i-simple-icons-facebook' }
]

const resourceColumns = [
  {
    title: 'Support',
    links: [
      { label: 'Help now', to: '/resources#help-now' },
      { label: 'CF guide', to: '/resources#cf-quick-guide' },
      { label: 'Conditions', to: '/resources#conditions-section' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', to: '/resources#docs-library' },
      { label: 'Directory', to: '/resources#help-directory' },
      { label: 'Call script', to: '/resources#call-script' },
      { label: 'FAQ', to: '/resources#faq' }
    ]
  }
]

const headerEl = ref<HTMLElement | null>(null)
const headerHeight = ref(69)
const isMobileMenuOpen = ref(false)
const updatesEmail = ref('')
const updatesStatus = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const updatesError = ref('')
const currentYear = new Date().getFullYear()
const route = useRoute()
const isResourcesRoute = computed(() => route.path === '/resources' || route.path.startsWith('/resources/'))
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isCurrentRoute = (to: string) => {
  if (to === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(to)
}

const syncHeaderHeight = () => {
  if (!headerEl.value) {
    return
  }

  headerHeight.value = Math.ceil(headerEl.value.getBoundingClientRect().height)
}

const isMobileViewport = () => {
  if (!import.meta.client) {
    return false
  }

  return window.innerWidth <= 991
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  if (!isMobileViewport()) {
    return
  }

  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const setBodyScrollLock = (locked: boolean) => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = locked ? 'hidden' : ''
}

const handleResize = () => {
  syncHeaderHeight()

  if (!isMobileViewport()) {
    closeMobileMenu()
  }
}

const handleWindowKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMobileMenu()
  }
}

const scrollToTop = () => {
  if (!import.meta.client) {
    return
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitUpdatesEmail = async () => {
  const email = updatesEmail.value.trim()
  updatesError.value = ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    updatesStatus.value = 'error'
    updatesError.value = 'Enter a valid email address.'
    return
  }

  updatesStatus.value = 'sending'
  try {
    await $fetch('/api/resources-email', {
      method: 'POST',
      body: { email }
    })
    updatesStatus.value = 'success'
  } catch (error) {
    updatesStatus.value = 'error'
    updatesError.value = 'Could not submit email right now. Please try again later.'
    console.error('Could not submit updates email.', error)
  }
}

const resetUpdatesForm = () => {
  if (updatesStatus.value !== 'sending') {
    updatesStatus.value = 'idle'
  }

  updatesError.value = ''
}

onMounted(() => {
  syncHeaderHeight()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleWindowKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleWindowKeydown)
  setBodyScrollLock(false)
})

watch(isMobileMenuOpen, (isOpen) => {
  setBodyScrollLock(isOpen && isMobileViewport())
})

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  }
)
</script>

<template>
  <div
    class="layout-root"
    :style="{ '--layout-header-height': `${headerHeight}px` }"
  >
    <header
      ref="headerEl"
      class="top-nav"
      :class="{ 'top-nav--resources': isResourcesRoute }"
    >
      <div class="layout-shell nav-shell">
        <div class="nav-brand-row">
          <button
            type="button"
            class="mobile-nav-toggle"
            :class="{ 'is-open': isMobileMenuOpen }"
            aria-controls="mobile-menu-panel"
            :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
            @click="toggleMobileMenu"
          >
            <span class="sr-only">
              {{ isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu' }}
            </span>
            <span
              class="mobile-nav-toggle__bars"
              aria-hidden="true"
            >
              <span class="mobile-nav-toggle__line" />
              <span class="mobile-nav-toggle__line" />
              <span class="mobile-nav-toggle__line" />
            </span>
          </button>

          <NuxtLink
            to="/"
            class="brand"
            @click="closeMobileMenu"
          >
            billings
          </NuxtLink>
        </div>

        <nav class="nav-links">
          <NuxtLink
            v-for="item in navLinks"
            :key="item.label"
            :to="item.to"
            :class="{ 'is-current': isCurrentRoute(item.to) }"
            :tabindex="isCurrentRoute(item.to) ? -1 : undefined"
            :aria-current="isCurrentRoute(item.to) ? 'page' : undefined"
            @click="isCurrentRoute(item.to) ? $event.preventDefault() : undefined"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <NuxtLink
          to="/share-your-story"
          class="nav-cta"
        >
          Share your story
        </NuxtLink>
      </div>
    </header>

    <div
      class="mobile-menu-backdrop"
      :class="{ 'is-open': isMobileMenuOpen }"
      aria-hidden="true"
      @click="closeMobileMenu"
    />

    <aside
      id="mobile-menu-panel"
      class="mobile-menu"
      :class="{ 'is-open': isMobileMenuOpen }"
      :aria-hidden="isMobileMenuOpen ? 'false' : 'true'"
    >
      <div class="layout-shell mobile-menu__shell">
        <nav
          class="mobile-menu__links"
          aria-label="Mobile navigation"
        >
          <NuxtLink
            v-for="item in navLinks"
            :key="`mobile-${item.label}`"
            :to="item.to"
            :class="{ 'is-current': isCurrentRoute(item.to) }"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="mobile-menu__footer">
          <NuxtLink
            to="/resources#help-now"
            class="mobile-menu__footer-btn mobile-menu__footer-btn--urgent"
            @click="closeMobileMenu"
          >
            Urgent Care
          </NuxtLink>
          <NuxtLink
            to="/share-your-story"
            class="mobile-menu__footer-btn"
            @click="closeMobileMenu"
          >
            Share Your Story
          </NuxtLink>
        </div>
      </div>
    </aside>

    <main class="layout-main">
      <slot />
    </main>

    <section class="pre-footer">
      <MountainIcon />
    </section>

    <footer class="site-footer">
      <div class="layout-shell footer-shell">
        <div class="footer-top">
          <div class="footer-column footer-column--updates">
            <div class="footer-updates">
              <h3>GET UPDATES</h3>
              <p class="footer-updates-copy">
                Occasional Billings updates.
              </p>
              <form
                v-if="updatesStatus !== 'success'"
                class="footer-updates-form"
                @submit.prevent="submitUpdatesEmail"
              >
                <input
                  v-model="updatesEmail"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  :disabled="updatesStatus === 'sending'"
                  @input="resetUpdatesForm"
                >
                <button
                  type="submit"
                  class="footer-updates-btn"
                  :disabled="updatesStatus === 'sending'"
                >
                  {{ updatesStatus === 'sending' ? 'Sending...' : 'Sign up' }}
                </button>
              </form>
              <p
                v-if="updatesStatus === 'success'"
                class="footer-updates-status footer-updates-status--success"
              >
                Thanks. You are on the list.
              </p>
              <p
                v-else-if="updatesStatus === 'error'"
                class="footer-updates-status footer-updates-status--error"
              >
                {{ updatesError }}
              </p>
            </div>
          </div>

          <div class="footer-column footer-column--sitemap">
            <h3>Sitemap</h3>
            <ul>
              <li
                v-for="item in sitemapLinks"
                :key="item.label"
              >
                <NuxtLink :to="item.to">
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div
            v-for="column in resourceColumns"
            :key="column.title"
            class="footer-column"
          >
            <h3>{{ column.title }}</h3>
            <ul>
              <li
                v-for="item in column.links"
                :key="item.label"
              >
                <NuxtLink :to="item.to">
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="footer-column">
            <h3>Socials</h3>
            <ul>
              <li
                v-for="item in socialLinks"
                :key="item.label"
              >
                <a
                  :href="item.href"
                  target="_blank"
                  rel="noreferrer"
                  class="social-link"
                >
                  <UIcon
                    :name="item.icon"
                    class="social-link-icon"
                    aria-hidden="true"
                  />
                  <span>{{ item.label }}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <NuxtLink
            to="/"
            class="footer-logo"
          >
            Billings
          </NuxtLink>

          <div class="footer-meta">
            <button
              type="button"
              class="back-to-top"
              @click="scrollToTop"
            >
              Back to top ↑
            </button>
            <p>Copyright © Billings {{ currentYear }}</p>
          </div>
        </div>
      </div>
    </footer>

    <CookieConsentBanner />
  </div>
</template>

<style scoped>
.layout-root {
  min-height: 100vh;
  color: var(--theme-color-text);
  font-family: var(--theme-font-text);
  display: flex;
  flex-direction: column;
}

.layout-main {
  flex: 1;
}

.pre-footer {
  background-color: var(--theme-color-bg);
}

.layout-shell {
  width: 100%;
  max-width: var(--layout-max-width);
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.top-nav {
  border-bottom: 1px solid var(--theme-color-line);
  backdrop-filter: blur(0.25rem);
  background: var(--theme-color-bg);
  position: sticky;
  top: 0;
  z-index: 70;
}

.top-nav--resources {
  background: var(--alt-bg);
}

.nav-shell {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  max-width: var(--layout-max-width);
}

.nav-brand-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  color: var(--theme-color-text);
  text-decoration: none;
  font-size: 40px;
  /* font-weight: 800; */
  letter-spacing: -0.02em;
  font-family: var(--theme-font-title);
  line-height: 1.1;
  letter-spacing: 0.009em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.nav-links a {
  color: var(--theme-color-muted);
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  opacity: 1;
  transition: opacity 140ms ease;
}

.nav-links a.is-current {
  opacity: 0.2;
  pointer-events: none;
  cursor: default;
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
  text-decoration: none;
}

.mobile-nav-toggle {
  width: 2.35rem;
  height: 2.35rem;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: transparent;
  color: var(--theme-color-muted);
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-nav-toggle__bars {
  width: 1.08rem;
  height: 0.94rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mobile-nav-toggle__line {
  width: 100%;
  height: 2px;
  background: currentColor;
  border-radius: 999px;
  transform-origin: center;
  transition: transform 300ms cubic-bezier(.6, 0, .2, 1), opacity 220ms ease;
}

.mobile-nav-toggle.is-open .mobile-nav-toggle__line:nth-child(1) {
  transform: translateY(0.375rem) rotate(45deg);
}

.mobile-nav-toggle.is-open .mobile-nav-toggle__line:nth-child(2) {
  opacity: 0;
}

.mobile-nav-toggle.is-open .mobile-nav-toggle__line:nth-child(3) {
  transform: translateY(-0.375rem) rotate(-45deg);
}

.mobile-menu-backdrop {
  position: fixed;
  inset: var(--layout-header-height) 0 0;
  background: rgb(14 21 23 / 38%);
  z-index: 58;
  opacity: 0;
  pointer-events: none;
  transition: opacity 360ms cubic-bezier(.6, 0, .2, 1);
}

.mobile-menu-backdrop.is-open {
  opacity: 1;
  pointer-events: auto;
}

.mobile-menu {
  position: fixed;
  inset: var(--layout-header-height) 0 0;
  z-index: 60;
  border-top: 1px solid var(--theme-color-line);
  background: var(--theme-color-bg);
  transform: translateY(calc(-100% - 1px));
  visibility: hidden;
  pointer-events: none;
  transition:
    transform 460ms cubic-bezier(.6, 0, .2, 1),
    visibility 0s linear 460ms;
}

.mobile-menu.is-open {
  transform: translateY(0);
  visibility: visible;
  pointer-events: auto;
  transition: transform 460ms cubic-bezier(.6, 0, .2, 1);
}

.mobile-menu__shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: var(--space-5);
  padding-bottom: var(--space-5);
}

.mobile-menu__links {
  display: grid;
  gap: 0.25rem;
}

.mobile-menu__links a {
  color: var(--theme-color-muted);
  text-decoration: none;
  font-size: var(--theme-font-size-body);
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid rgb(255 255 255 / 17%);
  padding: var(--space-3) 0;
}

.mobile-menu__links a.is-current {
  opacity: 0.4;
}

.mobile-menu__footer {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid rgb(255 255 255 / 19%);
}

.mobile-menu__footer-btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border-radius: 999px;
  background: var(--theme-color-accent);
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: var(--space-2) var(--space-4);
}

.mobile-menu__footer-btn--urgent {
  background: #b84a4a;
  color: #fff;
}

.sr-only {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.site-footer {
  background: var(--theme-color-muted);
}

.footer-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5rem;
  padding-block: 0 clamp(1.6rem, 2.4vw, 2.1rem) clamp(1.4rem, 2.3vw, 2.2rem);
}

.footer-shell::before {
  content: '';
  position: absolute;
  inset: 0 var(--space-6) auto;
  border-top: 1px solid #d2d2d2;
}

.footer-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  padding-top: clamp(2.3rem, 4.9vw, 3.5rem);
}

.footer-column {
  min-width: min(11rem, 100%);
}

.footer-top .footer-column--updates {
  min-width: 25ch;
}

.footer-column h3 {
  margin: 0;
  color: var(--theme-color-text);
  font-size: clamp(var(--text-md), 1.3vw, var(--text-3xl));
  font-weight: 700;
}

.footer-column ul {
  list-style: none;
  margin: clamp(0.9rem, 1.5vw, 1.3rem) 0 0;
  padding: 0;
  display: grid;
  gap: clamp(var(--space-2), 1vw, var(--space-4));
}

.footer-column a {
  color: var(--theme-color-accent-contrast);
  text-decoration: none;
  font-size: var(--theme-font-size-brand);
  font-family: var(--font-sans);
}

.footer-column .social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.social-link-icon {
  width: var(--space-4);
  height: var(--space-4);
  color: currentColor;
}

.footer-column a:hover,
.footer-column a:focus-visible {
  color: #111;
  text-decoration: underline;
  text-underline-offset: 0.5em;
}

.footer-updates {
  max-width: 28rem;
  padding-right: 3rem;
}

.footer-updates-copy {
  margin: clamp(0.7rem, 1.2vw, 1rem) 0 0;
  color: var(--theme-color-accent-contrast);
  font-size: var(--theme-font-size-brand);
  font-family: var(--font-sans);
}

.footer-updates-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.footer-updates-form input {
  flex: none;
  width: 100%;
  border: 1px solid #b9bec8;
  border-radius: 8px;
  padding: 0.6rem 0.7rem;
  font: inherit;
  font-size: var(--theme-font-size-form);
  color: var(--theme-color-accent-contrast);
  background: #fff;
}

.footer-updates-form input:focus {
  outline: none;
}

.footer-updates-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 0;
  border-radius: 8px;
  white-space: nowrap;
  background: var(--theme-color-accent-contrast);
  color: var(--theme-color-muted);
  font-size: var(--theme-font-size-btn);
  line-height: 1.5;
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
}

.footer-updates-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.footer-updates-status {
  margin: 0.65rem 0 0;
  font-size: var(--theme-font-size-brand);
}

.footer-updates-status--success {
  color: var(--theme-color-accent-contrast);
}

.footer-updates-status--error {
  color: #b84a4a;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
}

.footer-logo {
  color: var(--theme-color-text);
  text-decoration: none;
  font-family: var(--theme-font-title);
  font-size: 9rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.009em;
  text-transform: uppercase;
}

.footer-meta {
  display: flex;
  align-items: flex-end;
  gap: clamp(1.25rem, 4vw, 6rem);
  padding-bottom: clamp(0.35rem, 1.3vw, 1rem);
}

.footer-meta p {
  margin: 0;
  color: var(--theme-color-link-soft);
  font-size: var(--theme-font-size-caption);
}

.back-to-top {
  border: 0;
  background: transparent;
  color: var(--theme-color-link-soft);
  font: inherit;
  font-size: var(--theme-font-size-caption);
  cursor: pointer;
  padding: 0;
}

@media screen and (min-width: 991px) {
  .footer-top {
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: clamp(1.2rem, 2.4vw, 3rem);
  }

  .footer-column {
    flex: 1 1 0;
    min-width: 0;
  }
}

@media screen and (max-width: 1024px) {
  .footer-shell {
    gap: 3.1rem;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .footer-meta {
    width: 100%;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 0;
  }

  .mobile-nav-toggle {
    display: inline-flex;
  }

}

@media screen and (max-width: 991px) {

  .nav-links {
    display: none;
  }

      .footer-updates {
        padding-right: 0;
      }
  .nav-cta {
    margin-inline-start: auto;
    font-size: var(--theme-font-size-sm);
    padding: var(--space-2) var(--space-3);
  }

  .brand {
    font-size: 2.1rem;
  }

  .layout-shell {
    padding-inline: var(--space-4);
  }

  .footer-shell::before {
    inset-inline: var(--space-4);
  }

  .footer-bottom {
    gap: 0.5rem;
  }

  .back-to-top {
    font-size: var(--theme-font-size-caption);
  }
  .footer-meta p {
    font-size: var(--theme-font-size-caption);
  }

  .footer-top {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.2rem;
    padding-top: 2rem;
  }

  .footer-column--updates {
    grid-column: 1 / -1;
    width: 100%;
  }

  .footer-updates {
    max-width: 100%;
    width: 100%;
    padding-right: 0;
  }

  .footer-logo {
    font-size: clamp(3.4rem, 21vw, 6.8rem);
  }

  .footer-meta {
    justify-content: flex-start;
    padding-bottom: 2rem;
  }
}

@media screen and (min-width: 992px) {
  .mobile-menu,
  .mobile-menu-backdrop {
    display: none;
  }
}
</style>
