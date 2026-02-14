<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const navLinks = [
  { label: 'Community', to: '/share-your-story' },
  { label: 'Healthcare Issues', to: '/share-your-story' },
  { label: 'Resources', to: '/resources' },
  { label: 'Behind the Scenes', to: '/behind-the-scenes' },
  { label: 'About', to: '/about-the-film' }
]

const footerLinks = [
  { label: 'Resources', to: '/resources' },
  { label: 'Privacy', to: '/resources#faq' },
  { label: 'Terms', to: '/resources#faq' },
  { label: 'Contact', to: '/resources#faq' }
]

const headerEl = ref<HTMLElement | null>(null)
const headerHeight = ref(69)

const syncHeaderHeight = () => {
  if (!headerEl.value) {
    return
  }

  headerHeight.value = Math.ceil(headerEl.value.getBoundingClientRect().height)
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
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <NuxtLink
          to="/share-your-story#share-story-form"
          class="nav-cta"
        >
          Share your story
        </NuxtLink>
      </div>
    </header>

    <main class="layout-main">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="layout-shell footer-shell">
        <NuxtLink
          to="/"
          class="brand footer-brand"
        >
          billings
        </NuxtLink>

        <div class="footer-links">
          <NuxtLink
            v-for="item in footerLinks"
            :key="item.label"
            :to="item.to"
          >
            {{ item.label }}
          </NuxtLink>
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

.layout-shell {
  width: 100%;
  max-width: 1220px;
  margin-inline: auto;
  padding-inline: 24px;
}

.top-nav {
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(4px);
  background: color-mix(in oklab, var(--surface), white 35%);
  position: sticky;
  top: 0;
  z-index: 70;
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
  font-size: var(--fs-brand);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-family: var(--font-title);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.35rem;
}

.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: var(--fs-body);
  font-weight: 600;
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
  border-top: 1px solid var(--line);
  background: color-mix(in oklab, var(--surface), white 18%);
}

.footer-shell {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.75rem;
}

.footer-brand {
  font-size: var(--fs-sm);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: var(--fs-sm);
}

@media (max-width: 1023px) {
  .nav-links {
    display: none;
  }
}

@media (max-width: 768px) {
  .layout-shell {
    padding-inline: 16px;
  }

  .footer-shell {
    min-height: 56px;
  }

  .footer-links {
    gap: 0.75rem;
  }

  .footer-links a {
    font-size: var(--theme-font-size-label);
  }
}
</style>
