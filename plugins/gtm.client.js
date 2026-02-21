// plugins/gtm.client.js

export default defineNuxtPlugin(() => {
  const CONSENT_STORAGE_KEY = 'billings_cookie_consent'
  const CONSENT_COOKIE_KEY = 'billings_cookie_consent'
  const CONSENT_GRANTED_EVENT = 'billings:cookie-consent-granted'
  const CONSENT_ACCEPTED_VALUE = 'accepted'
  const INTERACTION_EVENTS = ['scroll', 'mousemove', 'touchstart']

  const initTrackingOnEvent = (event) => {
    initTrackingScripts()
    event.currentTarget.removeEventListener(event.type, initTrackingOnEvent)
  }

  const addInteractionListeners = () => {
    INTERACTION_EVENTS.forEach((interactionEvent) => {
      document.addEventListener(interactionEvent, initTrackingOnEvent, { passive: true })
    })
  }

  const removeInteractionListeners = () => {
    INTERACTION_EVENTS.forEach((interactionEvent) => {
      document.removeEventListener(interactionEvent, initTrackingOnEvent)
    })
  }

  const getConsentFromCookie = () => {
    return document.cookie
      .split(';')
      .map(cookiePart => cookiePart.trim())
      .find(cookiePart => cookiePart.startsWith(`${CONSENT_COOKIE_KEY}=`))
      ?.split('=')[1] ?? null
  }

  const hasTrackingConsent = () => {
    try {
      if (window.localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_ACCEPTED_VALUE) {
        return true
      }
    } catch {
      // Ignore storage access errors and fall back to cookies.
    }

    return getConsentFromCookie() === CONSENT_ACCEPTED_VALUE
  }

  /** Initiates all tracking scripts **/
  function initTrackingScripts() {
    if (window.trackingDidInit) {
      return false
    }
    window.trackingDidInit = true
    removeInteractionListeners()
    initGTM()
  }

  function initGTM() {
    (function (w, d, s, l, i) {
      w[l] = w[l] || []
      w[l].push({
        'gtm.start': new Date().getTime(),
        'event': 'gtm.js'
      })

      const f = d.getElementsByTagName(s)[0]
      const j = d.createElement(s)
      const dl = l !== 'dataLayer' ? '&l=' + l : ''
      j.async = true
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl
      f.parentNode.insertBefore(j, f)
    })(window, document, 'script', 'dataLayer', 'GTM-53F3LRP3')
  }

  const initOnLoad = () => {
    if (document.readyState === 'complete') {
      setTimeout(initTrackingScripts, 3000) // Load immediately if the event has already fired
    } else {
      window.addEventListener('load', () => {
        setTimeout(initTrackingScripts, 3000)
      })
    }
  }

  const startTracking = () => {
    initOnLoad()
    addInteractionListeners()
  }

  if (hasTrackingConsent()) {
    startTracking()
    return
  }

  window.addEventListener(CONSENT_GRANTED_EVENT, startTracking, { once: true })
})
