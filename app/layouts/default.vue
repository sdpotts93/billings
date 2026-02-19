<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

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

const scrollToTop = () => {
  if (!import.meta.client) {
    return
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  syncHeaderHeight()
  window.addEventListener('resize', syncHeaderHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncHeaderHeight)
})
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
        <NuxtLink
          to="/"
          class="brand"
        >
          billings
        </NuxtLink>

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
  z-index: 70;
}

.top-nav--resources {
  background: var(--alt-bg);
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
  padding: 0.52rem 0.92rem;
  cursor: pointer;
  text-decoration: none;
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
  inset: 0 24px auto;
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
  font-size: clamp(0.95rem, 1.3vw, 1.85rem);
  font-weight: 700;
}

.footer-column ul {
  list-style: none;
  margin: clamp(0.9rem, 1.5vw, 1.3rem) 0 0;
  padding: 0;
  display: grid;
  gap: clamp(0.42rem, 1vw, 0.95rem);
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
  width: 0.95rem;
  height: 0.95rem;
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

@media (max-width: 1023px) {
  .nav-links {
    display: none;
  }

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

@media (max-width: 768px) {
  .layout-shell {
    padding-inline: 16px;
  }

  .footer-shell::before {
    inset-inline: 16px;
  }

  .footer-bottom {
    gap: 0.5rem;
  }

  .back-to-top {
    font-size: 12px;
  }
  .footer-meta p {
    font-size: 12px;
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
</style>
