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
const currentYear = new Date().getFullYear()
const route = useRoute()
const isResourcesRoute = computed(() => route.path === '/resources' || route.path.startsWith('/resources/'))

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

  return window.innerWidth <= 767
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
          <div class="footer-column">
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
  </div>
</template>

<style scoped>
.layout-root {
  --ink: var(--theme-color-text);
  --muted: var(--theme-color-muted);
  --line: var(--theme-color-line);
  --surface: var(--theme-color-surface);
  --accent: var(--theme-color-accent);
  --accent-contrast: var(--theme-color-accent-contrast);
  --font-title: var(--theme-font-title);
  --font-text: var(--theme-font-text);
  --fs-brand: var(--theme-font-size-brand);
  --fs-body: var(--theme-font-size-body);
  --fs-btn: var(--theme-font-size-btn);
  --fs-sm: var(--theme-font-size-sm);
  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-text);
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
  max-width: 76.25rem;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.top-nav {
  border-bottom: 1px solid var(--line);
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
}

.nav-brand-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  color: var(--ink);
  text-decoration: none;
  font-size: 40px;
  /* font-weight: 800; */
  letter-spacing: -0.02em;
  font-family: var(--font-title);
  line-height: 1;
  letter-spacing: 0.009em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.nav-links a {
  color: var(--muted);
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
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: var(--fs-btn);
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
  color: var(--muted);
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
  border-top: 1px solid var(--line);
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
  color: var(--muted);
  text-decoration: none;
  font-size: var(--fs-body);
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
  font-size: var(--fs-btn);
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
  background: var(--muted);
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
  gap: clamp(2.5rem, 8vw, 10rem);
  padding-top: clamp(2.3rem, 4.9vw, 3.5rem);
}

.footer-column {
  min-width: min(11rem, 100%);
}

.footer-column h3 {
  margin: 0;
  color: var(--ink);
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
  color: var(--accent-contrast);
  text-decoration: none;
  font-size: var(--theme-font-size-mobile-cta);
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
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
}

.footer-logo {
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-title);
  font-size: clamp(4.5rem, 15.4vw, 15.5rem);
  font-weight: 900;
  line-height: 1;
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
  font-size: var(--theme-font-size-mobile-cta);
}

.back-to-top {
  border: 0;
  background: transparent;
  color: var(--theme-color-link-soft);
  font: inherit;
  font-size: var(--theme-font-size-mobile-cta);
  cursor: pointer;
  padding: 0;
}

@media (max-width: 64rem) {
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
    gap: 0.9rem;
    padding-bottom: 0;
  }
}

@media (max-width: 48rem) {
  .mobile-nav-toggle {
    display: inline-flex;
  }

  .nav-links {
    display: none;
  }

  .nav-cta {
    margin-inline-start: auto;
    font-size: var(--fs-sm);
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

  .footer-logo {
    font-size: clamp(3.4rem, 21vw, 6.8rem);
  }

  .footer-meta {
    justify-content: flex-start;
    padding-bottom: 2rem;
  }
}

@media (min-width: 48.0625rem) {
  .mobile-menu,
  .mobile-menu-backdrop {
    display: none;
  }
}
</style>
