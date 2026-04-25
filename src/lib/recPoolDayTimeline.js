import { utcMsToZoneDateMinute, zoneDateMinuteToUtcMs } from './timezone'

function compareOverlappingEvents(left, right) {
  if (left.state === 'closed' && right.state !== 'closed') return -1
  if (right.state === 'closed' && left.state !== 'closed') return 1

  if (left.startMs !== right.startMs) {
    return right.startMs - left.startMs
  }

  if (left.priority !== right.priority) {
    return right.priority - left.priority
  }

  return right.endMs - left.endMs
}

function minuteFromUtcOnSelectedDate(utcMs, selectedDate, timeZone) {
  const zoneStamp = utcMsToZoneDateMinute(utcMs, timeZone)
  if (zoneStamp.date < selectedDate) return 0
  if (zoneStamp.date > selectedDate) return 1440
  return Math.max(0, Math.min(1440, zoneStamp.minute))
}

function nextDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number)
  const utcMs = Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)
  const utcDate = new Date(utcMs)
  const nextYear = utcDate.getUTCFullYear()
  const nextMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(utcDate.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

function zoneEndExclusiveUtcMs(selectedDate, endMinute, timeZone) {
  if (endMinute <= 1439) {
    return zoneDateMinuteToUtcMs(selectedDate, endMinute, timeZone)
  }

  return zoneDateMinuteToUtcMs(nextDate(selectedDate), 0, timeZone)
}

function segmentFromBoundary(startUtcMs, endUtcMs, startMinute, endMinute, state, purpose, summary, windowStartUtcMs, windowSpanMs) {
  const spanMs = endUtcMs - startUtcMs
  if (spanMs <= 0) return null
  if (windowSpanMs <= 0) return null

  const minuteSpan = endMinute - startMinute

  return {
    startMinute,
    endMinute,
    durationMinutes: minuteSpan,
    bottomPercent: ((startUtcMs - windowStartUtcMs) / windowSpanMs) * 100,
    heightPercent: (spanMs / windowSpanMs) * 100,
    state,
    purpose,
    summary,
  }
}

function buildLaneSegments({
  lane,
  events,
  selectedDate,
  timeZone,
  windowStartMinute,
  windowEndMinute,
  windowStartUtcMs,
  windowEndUtcExclusiveMs,
}) {
  const laneEvents = events.filter(
    (event) => event.lanes.includes(lane) && event.startMs < windowEndUtcExclusiveMs && event.endMs > windowStartUtcMs,
  )

  const boundaries = new Set([windowStartMinute, windowEndMinute])
  laneEvents.forEach((event) => {
    const clippedStart = Math.max(windowStartUtcMs, event.startMs)
    const clippedEnd = Math.min(windowEndUtcExclusiveMs, event.endMs)
    boundaries.add(minuteFromUtcOnSelectedDate(clippedStart, selectedDate, timeZone))
    boundaries.add(minuteFromUtcOnSelectedDate(clippedEnd, selectedDate, timeZone))
  })

  const sortedBoundaries = Array.from(boundaries).sort((left, right) => left - right)
  const segments = []

  const windowSpanMs = windowEndUtcExclusiveMs - windowStartUtcMs
  if (windowSpanMs <= 0) {
    return { lane, segments: [] }
  }

  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const startMinute = sortedBoundaries[index]
    const endMinute = sortedBoundaries[index + 1]
    if (endMinute <= startMinute) continue

    const startUtcMs = zoneDateMinuteToUtcMs(selectedDate, startMinute, timeZone)
    const endUtcMs = zoneEndExclusiveUtcMs(selectedDate, endMinute, timeZone)
    const sampleUtcMs = startUtcMs + Math.max(1, (endUtcMs - startUtcMs) / 2)

    const winningEvent = laneEvents
      .filter((event) => sampleUtcMs >= event.startMs && sampleUtcMs < event.endMs)
      .sort(compareOverlappingEvents)[0]

    const segment = segmentFromBoundary(
      startUtcMs,
      endUtcMs,
      startMinute,
      endMinute,
      winningEvent?.state ?? 'unknown',
      winningEvent?.purpose ?? '',
      winningEvent?.summary ?? '',
      windowStartUtcMs,
      windowSpanMs,
    )
    if (segment) {
      segments.push(segment)
    }
  }

  return { lane, segments }
}

export function buildRecPoolDayTimeline({
  events,
  selectedDate,
  laneCount,
  timeZone,
  minMinute = 0,
  maxMinute = 1439,
}) {
  const windowStartMinute = minMinute
  const windowEndMinute = maxMinute + 1
  const windowStartUtcMs = zoneDateMinuteToUtcMs(selectedDate, windowStartMinute, timeZone)
  const windowEndUtcExclusiveMs = zoneEndExclusiveUtcMs(selectedDate, windowEndMinute, timeZone)

  return Array.from({ length: laneCount }, (_, index) =>
    buildLaneSegments({
      lane: index + 1,
      events,
      selectedDate,
      timeZone,
      windowStartMinute,
      windowEndMinute,
      windowStartUtcMs,
      windowEndUtcExclusiveMs,
    }),
  )
}

export function getRecPoolTimelineWindowUtc({ selectedDate, minMinute, maxMinute, timeZone }) {
  const windowStartMinute = minMinute
  const windowEndMinute = maxMinute + 1
  const windowStartUtcMs = zoneDateMinuteToUtcMs(selectedDate, windowStartMinute, timeZone)
  const windowEndUtcExclusiveMs = zoneEndExclusiveUtcMs(selectedDate, windowEndMinute, timeZone)

  return { windowStartUtcMs, windowEndUtcExclusiveMs }
}
