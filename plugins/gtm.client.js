// plugins/gtm.client.js

export default defineNuxtPlugin(() => {
  console.log('GTM plugin initialized')

  const initTrackingOnEvent = (event) => {
    initTrackingScripts()
    event.currentTarget.removeEventListener(event.type, initTrackingOnEvent)
  }

  /** Initiates all tracking scripts **/
  function initTrackingScripts() {
    if (window.trackingDidInit) {
      return false
    }
    window.trackingDidInit = true
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

  initOnLoad()

  // Attach event listeners

  document.addEventListener('scroll', initTrackingOnEvent)
  document.addEventListener('mousemove', initTrackingOnEvent)
  document.addEventListener('touchstart', initTrackingOnEvent)
})
