import { createError, readBody, setHeader } from 'h3'

type ResourcesEmailRequestBody = {
  email?: unknown
}

const MAKE_WEBHOOK_URL = 'https://hook.us1.make.com/oj9798syfhb8heov09si9drrur8os32o'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')

  const body = await readBody<ResourcesEmailRequestBody>(event)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid email is required.'
    })
  }

  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not forward email to the webhook.'
    })
  }

  return { ok: true }
})
