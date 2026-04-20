const POOL_LANE_COUNT = 20

const PURPOSE_RULES = [
  { pattern: /(closed|maintenance|repair|blocked|shutdown)/i, state: 'closed', purpose: 'Closed' },
  { pattern: /(lap swim|adult lap|rec swim|public swim|open swim)/i, state: 'open', purpose: 'Lap Swim' },
  { pattern: /(water polo|lesson|lessons|team|masters|coaching|program|class|practice|training)/i, state: 'reserved', purpose: 'Reserved' },
]

function clampLane(value) {
  return Math.max(1, Math.min(POOL_LANE_COUNT, value))
}

function parseLaneRanges(text) {
  const ranges = []
  const source = text.toLowerCase()

  if (/(all lanes|all pool lanes|entire pool|full pool)/i.test(source)) {
    return [{ start: 1, end: POOL_LANE_COUNT }]
  }

  const rangePatterns = [
    /lanes?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/gi,
    /lanes?\s*(\d{1,2})\s*(?:through|thru|to)\s*(\d{1,2})/gi,
  ]

  rangePatterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      const start = clampLane(Number(match[1]))
      const end = clampLane(Number(match[2]))
      ranges.push({ start: Math.min(start, end), end: Math.max(start, end) })
    }
  })

  const singleLanePattern = /lane\s*(\d{1,2})(?!\d)/gi
  for (const match of source.matchAll(singleLanePattern)) {
    const lane = clampLane(Number(match[1]))
    ranges.push({ start: lane, end: lane })
  }

  // "General Lap Swim - 8 lanes LC", "4 lanes", "20 lanes SCY" → lanes 1..N
  const countLanesPattern = /\b(\d{1,2})\s*lanes?\b/gi
  for (const match of source.matchAll(countLanesPattern)) {
    const n = clampLane(Number(match[1]))
    if (n >= 1) {
      ranges.push({ start: 1, end: n })
    }
  }

  return ranges
}

function inferStateAndPurpose(text) {
  for (const rule of PURPOSE_RULES) {
    if (rule.pattern.test(text)) {
      return { state: rule.state, purpose: rule.purpose }
    }
  }
  return { state: 'unknown', purpose: 'Unspecified Use' }
}

export function normalizeEvents(rawEvents) {
  return rawEvents.map((event) => {
    const summaryText = event.summary ?? ''
    const descriptionText = event.description ?? ''
    const laneRangesFromSummary = parseLaneRanges(summaryText)
    const laneRangesFromDescription = parseLaneRanges(descriptionText)
    const laneRanges =
      laneRangesFromSummary.length > 0
        ? laneRangesFromSummary
        : laneRangesFromDescription.length > 0
          ? laneRangesFromDescription
          : [{ start: 1, end: POOL_LANE_COUNT }]

    const inferredFromSummary = inferStateAndPurpose(summaryText)
    const inferred =
      inferredFromSummary.state !== 'unknown' ? inferredFromSummary : inferStateAndPurpose(descriptionText)
    const priority = inferred.state === 'closed' ? 4 : inferred.state === 'reserved' ? 3 : inferred.state === 'open' ? 2 : 1

    return {
      ...event,
      laneRanges,
      state: inferred.state,
      purpose: inferred.purpose,
      priority,
    }
  })
}
