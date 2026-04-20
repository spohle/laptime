import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const CALENDARS = {
  '/api/calendar-ics':
    'https://calendar.google.com/calendar/ical/rosebowlaquatics.org_4le4udubed0tu4u9vn4ha1bcs8%40group.calendar.google.com/public/basic.ics',
  '/api/calendar-ics-competition':
    'https://calendar.google.com/calendar/ical/rosebowlaquatics.org_ov4u9q0a65cnor15e71ftmpn4c%40group.calendar.google.com/public/basic.ics',
}

function calendarProxyPlugin() {
  async function handler(req, res) {
    const path = req.url?.split('?')[0] ?? ''
    const googleUrl = CALENDARS[path]
    if (!googleUrl) {
      return false
    }

    try {
      const response = await fetch(googleUrl)
      if (!response.ok) {
        throw new Error(`Google ICS request failed with ${response.status}`)
      }

      const body = await response.text()
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=120')
      res.end(body)
    } catch (error) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: 'Unable to load Google Calendar ICS from proxy.',
          details: error instanceof Error ? error.message : 'unknown error',
        }),
      )
    }

    return true
  }

  return {
    name: 'calendar-ics-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!(await handler(req, res))) {
          next()
        }
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!(await handler(req, res))) {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), calendarProxyPlugin()],
})
