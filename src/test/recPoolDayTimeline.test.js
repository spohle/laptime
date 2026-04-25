import { describe, expect, it } from 'vitest'
import { buildRecPoolDayTimeline, getRecPoolTimelineWindowUtc } from '../lib/recPoolDayTimeline'
import { zoneDateMinuteToUtcMs } from '../lib/timezone'

const TIME_ZONE = 'America/Los_Angeles'
const SELECTED_DATE = '2026-04-21'

function eventForLane({ lane, startMinute, endMinute, state, priority = 1, summary = '' }) {
  return {
    id: `${lane}-${startMinute}-${endMinute}-${state}`,
    startMs: zoneDateMinuteToUtcMs(SELECTED_DATE, startMinute, TIME_ZONE),
    endMs: zoneDateMinuteToUtcMs(SELECTED_DATE, endMinute, TIME_ZONE),
    state,
    purpose: state,
    priority,
    summary,
    lanes: [lane],
  }
}

describe('buildRecPoolDayTimeline', () => {
  it('maps event bounds to exact segment minutes', () => {
    const events = [
      eventForLane({ lane: 2, startMinute: 0, endMinute: 300, state: 'reserved' }),
      eventForLane({ lane: 1, startMinute: 90, endMinute: 150, state: 'open' }),
    ]

    const timelines = buildRecPoolDayTimeline({
      events,
      selectedDate: SELECTED_DATE,
      laneCount: 2,
      timeZone: TIME_ZONE,
      minMinute: 0,
      maxMinute: 300,
    })

    expect(timelines[0].segments).toEqual([
      expect.objectContaining({ startMinute: 0, endMinute: 90, state: 'unknown' }),
      expect.objectContaining({ startMinute: 90, endMinute: 150, state: 'open' }),
      expect.objectContaining({ startMinute: 150, endMinute: 301, state: 'unknown' }),
    ])
  })

  it('uses overlap precedence with closed beating open', () => {
    const events = [
      eventForLane({ lane: 2, startMinute: 0, endMinute: 360, state: 'reserved' }),
      eventForLane({ lane: 1, startMinute: 120, endMinute: 300, state: 'open', priority: 2 }),
      eventForLane({ lane: 1, startMinute: 180, endMinute: 240, state: 'closed', priority: 1 }),
    ]

    const timelines = buildRecPoolDayTimeline({
      events,
      selectedDate: SELECTED_DATE,
      laneCount: 2,
      timeZone: TIME_ZONE,
      minMinute: 0,
      maxMinute: 360,
    })

    const laneSegments = timelines[0].segments
    expect(laneSegments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startMinute: 120, endMinute: 180, state: 'open' }),
        expect.objectContaining({ startMinute: 180, endMinute: 240, state: 'closed' }),
        expect.objectContaining({ startMinute: 240, endMinute: 300, state: 'open' }),
      ]),
    )
  })

  it('clips overnight events to selected day', () => {
    const overnightEvent = {
      id: 'overnight',
      startMs: zoneDateMinuteToUtcMs('2026-04-20', 23 * 60, TIME_ZONE),
      endMs: zoneDateMinuteToUtcMs('2026-04-21', 60, TIME_ZONE),
      state: 'reserved',
      purpose: 'reserved',
      priority: 3,
      summary: 'overnight',
      lanes: [2],
    }

    const timelines = buildRecPoolDayTimeline({
      events: [overnightEvent],
      selectedDate: SELECTED_DATE,
      laneCount: 2,
      timeZone: TIME_ZONE,
      minMinute: 0,
      maxMinute: 1439,
    })

    const laneTwoSegments = timelines[1].segments
    expect(laneTwoSegments[0]).toEqual(expect.objectContaining({ startMinute: 0, endMinute: 60, state: 'reserved' }))
    expect(laneTwoSegments[1]).toEqual(expect.objectContaining({ startMinute: 60, endMinute: 1440, state: 'unknown' }))
  })

  it('scales vertical percents to the active minute window', () => {
    const events = [eventForLane({ lane: 1, startMinute: 600, endMinute: 660, state: 'open' })]

    const timelines = buildRecPoolDayTimeline({
      events,
      selectedDate: SELECTED_DATE,
      laneCount: 1,
      timeZone: TIME_ZONE,
      minMinute: 600,
      maxMinute: 720,
    })

    expect(timelines[0].segments[0]).toEqual(
      expect.objectContaining({
        startMinute: 600,
        endMinute: 660,
        state: 'open',
        bottomPercent: 0,
      }),
    )

    const { windowStartUtcMs, windowEndUtcExclusiveMs } = getRecPoolTimelineWindowUtc({
      selectedDate: SELECTED_DATE,
      minMinute: 600,
      maxMinute: 720,
      timeZone: TIME_ZONE,
    })
    const windowSpanMs = windowEndUtcExclusiveMs - windowStartUtcMs
    const segmentSpanMs =
      zoneDateMinuteToUtcMs(SELECTED_DATE, 660, TIME_ZONE) - zoneDateMinuteToUtcMs(SELECTED_DATE, 600, TIME_ZONE)

    expect(timelines[0].segments[0].heightPercent).toBeCloseTo((segmentSpanMs / windowSpanMs) * 100, 6)
  })
})
