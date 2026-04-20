import { lapSwimLaneCountAtMs } from './resolveLaneStates'
import { utcMsToZoneDateMinute, zoneDateMinuteToUtcMs } from './timezone'

/** First UTC ms whose calendar date in `timeZone` is after `dateText` (end-exclusive day bound). */
export function startOfNextZoneDateMs(dateText, timeZone) {
  const dayStartMs = zoneDateMinuteToUtcMs(dateText, 0, timeZone)
  let lo = dayStartMs + 1
  let hi = dayStartMs + 27 * 3600 * 1000

  while (lo < hi) {
    // `>>` truncates to 32-bit — breaks ms timestamps. Use float halving.
    const mid = Math.floor((lo + hi) / 2)
    if (utcMsToZoneDateMinute(mid, timeZone).date === dateText) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  return lo
}

function mergeSegmentsSameCount(segmentList) {
  const merged = []

  for (const seg of segmentList) {
    const tail = merged[merged.length - 1]
    if (tail && tail.count === seg.count && tail.endMs === seg.startMs) {
      tail.endMs = seg.endMs
    } else {
      merged.push({ ...seg })
    }
  }

  return merged
}

function formatZoneClock(utcMs, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(utcMs))
}

function formatDurationMs(durationMs) {
  const totalMin = Math.max(0, Math.round(durationMs / 60_000))
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  if (hours > 0 && mins > 0) {
    return `${hours} hr ${mins} min`
  }
  if (hours > 0) {
    return `${hours} hr`
  }
  return `${mins} min`
}

/**
 * Longest interval on `selectedDate` (in `timeZone`) where lap-swim lane count
 * stays at the day’s maximum. Tie on length → earliest window.
 */
export function findBestRecPoolLapSwimWindow({ events, selectedDate, laneCount, timeZone }) {
  const dayStartMs = zoneDateMinuteToUtcMs(selectedDate, 0, timeZone)
  const dayEndExclusiveMs = startOfNextZoneDateMs(selectedDate, timeZone)
  const boundaryMsSet = new Set([dayStartMs, dayEndExclusiveMs])

  for (const ev of events) {
    if (ev.endMs <= dayStartMs || ev.startMs >= dayEndExclusiveMs) {
      continue
    }
    boundaryMsSet.add(Math.max(ev.startMs, dayStartMs))
    boundaryMsSet.add(Math.min(ev.endMs, dayEndExclusiveMs))
  }

  const sortedBounds = [...boundaryMsSet].sort((a, b) => a - b)
  const rawSegments = []

  for (let i = 0; i < sortedBounds.length - 1; i += 1) {
    const startMs = sortedBounds[i]
    const endMs = sortedBounds[i + 1]
    if (startMs >= endMs) {
      continue
    }
    const sampleMs = startMs + Math.floor((endMs - startMs) / 2)
    const count = lapSwimLaneCountAtMs({ events, utcMs: sampleMs, laneCount })
    rawSegments.push({ startMs, endMs, count })
  }

  const merged = mergeSegmentsSameCount(rawSegments)
  let maxLanes = 0
  for (const s of merged) {
    maxLanes = Math.max(maxLanes, s.count)
  }

  if (maxLanes === 0) {
    return null
  }

  let best = null
  for (const s of merged) {
    if (s.count !== maxLanes) {
      continue
    }
    const durationMs = s.endMs - s.startMs
    if (!best || durationMs > best.durationMs) {
      best = { startMs: s.startMs, endMs: s.endMs, laneCount: maxLanes, durationMs }
    } else if (durationMs === best.durationMs && s.startMs < best.startMs) {
      best = { startMs: s.startMs, endMs: s.endMs, laneCount: maxLanes, durationMs }
    }
  }

  return best
}

export function formatBestRecPoolLapSwimLine(bestWindow, timeZone) {
  if (!bestWindow) {
    return null
  }

  const timePart = `${formatZoneClock(bestWindow.startMs, timeZone)}–${formatZoneClock(bestWindow.endMs, timeZone)}`
  const lanePart = `${bestWindow.laneCount} lane${bestWindow.laneCount === 1 ? '' : 's'}`
  const lengthPart = formatDurationMs(bestWindow.durationMs)

  return `Peak lap swim this day: ${timePart} · ${lanePart} · ${lengthPart} total`
}
