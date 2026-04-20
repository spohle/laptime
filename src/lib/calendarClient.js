import ICAL from 'ical.js'
import { normalizeEvents } from './normalizeEvents'

const CALENDAR_ID = 'rosebowlaquatics.org_4le4udubed0tu4u9vn4ha1bcs8@group.calendar.google.com'
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`

const FALLBACK_FETCH_URLS = [
  '/api/calendar-ics',
  ICS_URL,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(ICS_URL)}`,
]

async function fetchIcsText() {
  const errors = []

  for (const url of FALLBACK_FETCH_URLS) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
      }
      return await response.text()
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : 'request failed'}`)
    }
  }

  throw new Error(`Unable to load Google Calendar ICS data.\n${errors.join('\n')}`)
}

function expandLaneRanges(event) {
  const lanes = []
  event.laneRanges.forEach(({ start, end }) => {
    for (let lane = start; lane <= end; lane += 1) {
      lanes.push(lane)
    }
  })
  return [...new Set(lanes)]
}

function getEventBasePayload(event) {
  return {
    id: event.uid,
    summary: event.summary ?? '',
    description: event.description ?? '',
  }
}

function collectCalendarEvents(vevents) {
  const now = Date.now()
  const rangeStart = now - 14 * 24 * 60 * 60 * 1000
  const rangeEnd = now + 120 * 24 * 60 * 60 * 1000
  const expanded = []

  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent)
    const basePayload = getEventBasePayload(event)

    if (!event.isRecurring()) {
      expanded.push({
        ...basePayload,
        startMs: event.startDate.toJSDate().getTime(),
        endMs: event.endDate.toJSDate().getTime(),
      })
      return
    }

    const durationMs = event.duration.toSeconds() * 1000
    const iterator = event.iterator()
    let nextTime = iterator.next()
    let safetyCount = 0

    while (nextTime && safetyCount < 5000) {
      const startMs = nextTime.toJSDate().getTime()
      if (startMs > rangeEnd) {
        break
      }
      if (startMs >= rangeStart) {
        expanded.push({
          ...basePayload,
          id: `${event.uid}-${startMs}`,
          startMs,
          endMs: startMs + durationMs,
        })
      }
      nextTime = iterator.next()
      safetyCount += 1
    }
  })

  return expanded
}

export async function fetchCalendarEvents() {
  const icsText = await fetchIcsText()
  const jCalData = ICAL.parse(icsText)
  const calendar = new ICAL.Component(jCalData)
  const vevents = calendar.getAllSubcomponents('vevent')
  const rawEvents = collectCalendarEvents(vevents)

  return normalizeEvents(rawEvents).map((event) => ({
    ...event,
    lanes: expandLaneRanges(event),
  }))
}
