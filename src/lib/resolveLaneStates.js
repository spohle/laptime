import { zoneDateMinuteToUtcMs } from './timezone'

const DEFAULT_LANE_STATE = {
  state: 'unknown',
  purpose: '',
}

function eventCoversLane(event, lane) {
  return event.lanes.includes(lane)
}

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

/** Lap swim lanes at instant `utcMs` (same overlap rules as the lane grid). */
export function lapSwimLaneCountAtMs({ events, utcMs, laneCount }) {
  const activeEvents = events.filter((event) => utcMs >= event.startMs && utcMs < event.endMs)
  let lapSwimLaneTotal = 0

  for (let lane = 1; lane <= laneCount; lane += 1) {
    const winningEvent = activeEvents
      .filter((event) => event.lanes.includes(lane))
      .sort(compareOverlappingEvents)[0]

    if (winningEvent?.state === 'open') {
      lapSwimLaneTotal += 1
    }
  }

  return lapSwimLaneTotal
}

export function resolveLaneStates({ events, selectedDate, selectedMinute, laneCount, timeZone }) {
  const selectedUtcMs = zoneDateMinuteToUtcMs(selectedDate, selectedMinute, timeZone)
  const activeEvents = events.filter((event) => selectedUtcMs >= event.startMs && selectedUtcMs < event.endMs)

  return Array.from({ length: laneCount }, (_, index) => {
    const lane = index + 1

    const winningEvent = activeEvents
      .filter((event) => eventCoversLane(event, lane))
      .sort(compareOverlappingEvents)[0]

    if (!winningEvent) {
      return { lane, ...DEFAULT_LANE_STATE }
    }

    return {
      lane,
      state: winningEvent.state,
      purpose: winningEvent.purpose,
      title: winningEvent.summary,
      endMs: winningEvent.endMs,
      remainingMs: Math.max(0, winningEvent.endMs - selectedUtcMs),
    }
  })
}
