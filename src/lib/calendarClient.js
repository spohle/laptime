import ICAL from 'ical.js'
import { normalizeEvents } from './normalizeEvents'
import { zoneDateMinuteToUtcMs } from './timezone'

export const REC_POOL_CALENDAR_ID = 'rosebowlaquatics.org_4le4udubed0tu4u9vn4ha1bcs8@group.calendar.google.com'
export const COMPETITION_POOL_CALENDAR_ID = 'rosebowlaquatics.org_ov4u9q0a65cnor15e71ftmpn4c@group.calendar.google.com'

function icsUrlForCalendarId(calendarId) {
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`
}

function fallbackFetchUrlsForCalendar(calendarId) {
  const icsUrl = icsUrlForCalendarId(calendarId)
  const proxyPath =
    calendarId === REC_POOL_CALENDAR_ID
      ? '/api/calendar-ics'
      : calendarId === COMPETITION_POOL_CALENDAR_ID
        ? '/api/calendar-ics-competition'
        : null

  const urls = []
  if (proxyPath) urls.push(proxyPath)
  urls.push(icsUrl, `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`)
  return urls
}

async function fetchIcsTextForCalendar(calendarId) {
  const errors = []

  for (const url of fallbackFetchUrlsForCalendar(calendarId)) {
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

function getExpansionRange({ selectedDate, timeZone, daysBefore = 14, daysAfter = 120 }) {
  if (!selectedDate) {
    const now = Date.now()
    return {
      rangeStart: now - daysBefore * 24 * 60 * 60 * 1000,
      rangeEnd: now + daysAfter * 24 * 60 * 60 * 1000,
    }
  }

  const selectedDayStartUtcMs = zoneDateMinuteToUtcMs(selectedDate, 0, timeZone)
  return {
    rangeStart: selectedDayStartUtcMs - daysBefore * 24 * 60 * 60 * 1000,
    rangeEnd: selectedDayStartUtcMs + daysAfter * 24 * 60 * 60 * 1000,
  }
}

function collectCalendarEvents(vevents, range) {
  const { rangeStart, rangeEnd } = range
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

export async function fetchCalendarEventsForCalendarId(
  calendarId,
  { selectedDate, timeZone = 'America/Los_Angeles', daysBefore = 14, daysAfter = 120 } = {},
) {
  const icsText = await fetchIcsTextForCalendar(calendarId)
  const jCalData = ICAL.parse(icsText)
  const calendar = new ICAL.Component(jCalData)
  const vevents = calendar.getAllSubcomponents('vevent')
  const range = getExpansionRange({ selectedDate, timeZone, daysBefore, daysAfter })
  const rawEvents = collectCalendarEvents(vevents, range)

  return normalizeEvents(rawEvents).map((event) => ({
    ...event,
    lanes: expandLaneRanges(event),
  }))
}

export async function fetchRecPoolEvents(options = {}) {
  return fetchCalendarEventsForCalendarId(REC_POOL_CALENDAR_ID, options)
}

export async function fetchCompetitionPoolEvents(options = {}) {
  return fetchCalendarEventsForCalendarId(COMPETITION_POOL_CALENDAR_ID, options)
}

/** @deprecated use fetchRecPoolEvents */
export async function fetchCalendarEvents() {
  return fetchRecPoolEvents()
}
