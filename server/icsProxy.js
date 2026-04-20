/**
 * Shared handler for Vercel serverless routes that proxy Google Calendar public ICS feeds.
 * (Vite dev uses vite.config.js middleware; production needs these API routes.)
 */

export const REC_POOL_ICS_URL =
  'https://calendar.google.com/calendar/ical/rosebowlaquatics.org_4le4udubed0tu4u9vn4ha1bcs8%40group.calendar.google.com/public/basic.ics'

export const COMPETITION_POOL_ICS_URL =
  'https://calendar.google.com/calendar/ical/rosebowlaquatics.org_ov4u9q0a65cnor15e71ftmpn4c%40group.calendar.google.com/public/basic.ics'

/**
 * @param {import('http').ServerResponse} res
 * @param {string} googleIcsUrl
 */
export async function sendGoogleIcs(res, googleIcsUrl) {
  const response = await fetch(googleIcsUrl)
  if (!response.ok) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(`Google ICS request failed with ${response.status}`)
    return
  }

  const body = await response.text()
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=120')
  res.end(body)
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} googleIcsUrl
 */
export async function handleIcsProxyRequest(req, res, googleIcsUrl) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method Not Allowed')
    return
  }

  try {
    await sendGoogleIcs(res, googleIcsUrl)
  } catch (error) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        error: 'Unable to load Google Calendar ICS from proxy.',
        details: error instanceof Error ? error.message : 'unknown error',
      }),
    )
  }
}
