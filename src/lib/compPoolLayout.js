import { utcMsToZoneDateMinute, zoneDateMinuteToUtcMs } from './timezone'

/** Matches calendar titles like "Pool Change - CLOSED" */
const POOL_CHANGE_CLOSED_RE = /pool\s*change.*closed/i

export function isPoolChangeClosedMarker(event) {
  return POOL_CHANGE_CLOSED_RE.test(event.summary ?? '')
}

function eventOverlapsCalendarDate(event, selectedDate, timeZone) {
  const start = utcMsToZoneDateMinute(event.startMs, timeZone)
  const end = utcMsToZoneDateMinute(Math.max(event.endMs - 1, event.startMs), timeZone)
  return selectedDate >= start.date && selectedDate <= end.date
}

function maxLaneInEvent(event) {
  if (!event.lanes?.length) {
    return 0
  }
  return Math.max(...event.lanes)
}

/**
 * 9 = 50m / LC (9 lanes wide), 20 = 25m / SCY (20 lanes).
 * Before the first completed "Pool Change - CLOSED" of the day the pool is LC → 9 lanes.
 * Each completed pool-change toggles 9 ↔ 20 (first change of day: 9 → 20).
 * If any active (non-marker) event uses lane > 9, force 20.
 */
export function getCompPoolLaneCountAtTime({ events, selectedDate, selectedMinute, timeZone }) {
  const selectedUtcMs = zoneDateMinuteToUtcMs(selectedDate, selectedMinute, timeZone)

  const markers = events
    .filter(isPoolChangeClosedMarker)
    .filter((event) => eventOverlapsCalendarDate(event, selectedDate, timeZone))
    .sort((a, b) => a.endMs - b.endMs)

  const flipCount = markers.filter((event) => event.endMs <= selectedUtcMs).length
  let mode = flipCount % 2 === 0 ? 9 : 20

  const active = events.filter(
    (event) =>
      selectedUtcMs >= event.startMs && selectedUtcMs < event.endMs && !isPoolChangeClosedMarker(event),
  )
  if (active.some((event) => maxLaneInEvent(event) > 9)) {
    mode = 20
  }

  return mode
}
