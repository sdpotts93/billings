<script setup lang="ts">
import { onMounted, ref } from 'vue'

const CONSENT_STORAGE_KEY = 'billings_cookie_consent'
const CONSENT_COOKIE_KEY = 'billings_cookie_consent'
const CONSENT_GRANTED_EVENT = 'billings:cookie-consent-granted'
const CONSENT_ACCEPTED_VALUE = 'accepted'
const CONSENT_REJECTED_VALUE = 'rejected'
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365

const isVisible = ref(false)

const getConsentFromCookie = () => {
  return document.cookie
    .split(';')
    .map(cookiePart => cookiePart.trim())
    .find(cookiePart => cookiePart.startsWith(`${CONSENT_COOKIE_KEY}=`))
    ?.split('=')[1] ?? null
}

const setConsent = (value: string) => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // Ignore storage access errors and still persist consent in a cookie.
  }

  document.cookie = `${CONSENT_COOKIE_KEY}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`
}

const acceptCookies = () => {
  setConsent(CONSENT_ACCEPTED_VALUE)
  isVisible.value = false
  window.dispatchEvent(new CustomEvent(CONSENT_GRANTED_EVENT))
}

const rejectCookies = () => {
  setConsent(CONSENT_REJECTED_VALUE)
  isVisible.value = false
}

onMounted(() => {
  let savedConsent: string | null = null

  try {
    savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch {
    // Ignore storage access errors and fall back to cookie checks.
  }

  const cookieConsent = getConsentFromCookie()
  const consentValue = savedConsent ?? cookieConsent
  isVisible.value = consentValue !== CONSENT_ACCEPTED_VALUE && consentValue !== CONSENT_REJECTED_VALUE
})
</script>

<template>
  <aside
    v-if="isVisible"
    class="cookie-banner"
    role="dialog"
    aria-live="polite"
    aria-label="Cookie consent"
  >
    <div class="cookie-banner__content">
      <p>
        We use optional analytics cookies to understand site usage and improve Billings.
      </p>
      <div class="cookie-banner__actions">
        <button
          type="button"
          class="cookie-banner__button cookie-banner__button--ghost"
          @click="rejectCookies"
        >
          Decline
        </button>
        <button
          type="button"
          class="cookie-banner__button cookie-banner__button--primary"
          @click="acceptCookies"
        >
          Accept cookies
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
  z-index: 120;
  display: flex;
  justify-content: flex-end;
  padding-inline: var(--space-4);
  pointer-events: none;
}

.cookie-banner__content {
  width: 100%;
  max-width: 44rem;
  border: 1px solid var(--theme-color-line-strong);
  border-radius: var(--radius-md);
  background: var(--theme-color-surface);
  color: var(--theme-color-accent-contrast);
  box-shadow: 0 14px 42px rgb(0 0 0 / 20%);
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  max-height: calc(100dvh - 1rem - env(safe-area-inset-bottom));
  overflow: auto;
  pointer-events: auto;
}

.cookie-banner__content p {
  margin: 0;
  font-size: var(--theme-font-size-brand);
}

.cookie-banner__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.cookie-banner__button {
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: var(--theme-font-size-brand);
  line-height: 1.4;
  padding: 0.45rem 0.95rem;
  cursor: pointer;
}

.cookie-banner__button--ghost {
  background: transparent;
  color: var(--theme-color-accent-contrast);
  border: 1px solid var(--theme-color-line-strong);
}

.cookie-banner__button--primary {
  background: var(--theme-color-accent-contrast);
  color: var(--theme-color-surface);
}

@media screen and (max-width: 768px) {
  .cookie-banner {
    justify-content: center;
    bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
    padding-inline: var(--space-3);
  }

  .cookie-banner__content {
    max-width: none;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 0.9rem;
  }

  .cookie-banner__actions {
    width: 100%;
    gap: 0.5rem;
  }

  .cookie-banner__button {
    flex: 1;
    text-align: center;
    min-height: 2.4rem;
  }
}
</style>
