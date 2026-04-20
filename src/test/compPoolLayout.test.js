import { describe, expect, it } from 'vitest'
import { getCompPoolLaneCountAtTime, isPoolChangeClosedMarker } from '../lib/compPoolLayout'
import { zoneDateMinuteToUtcMs } from '../lib/timezone'

describe('isPoolChangeClosedMarker', () => {
  it('matches pool change closed titles', () => {
    expect(isPoolChangeClosedMarker({ summary: 'Pool Change - CLOSED' })).toBe(true)
    expect(isPoolChangeClosedMarker({ summary: 'pool change — closed' })).toBe(true)
    expect(isPoolChangeClosedMarker({ summary: 'Lap Swim' })).toBe(false)
  })
})

describe('getCompPoolLaneCountAtTime', () => {
  const tz = 'America/Los_Angeles'
  const d = '2026-04-20'

  it('defaults to 9 lanes (LC) before any pool change ends', () => {
    const events = [
      {
        startMs: zoneDateMinuteToUtcMs(d, 20 * 60, tz),
        endMs: zoneDateMinuteToUtcMs(d, 21 * 60, tz),
        summary: 'Pool Change - CLOSED',
        lanes: [1],
      },
    ]
    const n = getCompPoolLaneCountAtTime({
      events,
      selectedDate: d,
      selectedMinute: 12 * 60,
      timeZone: tz,
    })
    expect(n).toBe(9)
  })

  it('toggles to 20 lanes after pool change ends', () => {
    const events = [
      {
        startMs: zoneDateMinuteToUtcMs(d, 18 * 60, tz),
        endMs: zoneDateMinuteToUtcMs(d, 19 * 60, tz),
        summary: 'Pool Change - CLOSED',
        lanes: [1],
      },
    ]
    const after = getCompPoolLaneCountAtTime({
      events,
      selectedDate: d,
      selectedMinute: 20 * 60,
      timeZone: tz,
    })
    expect(after).toBe(20)
  })

  it('forces 20 when an active event uses lane > 9', () => {
    const events = [
      {
        startMs: zoneDateMinuteToUtcMs(d, 18 * 60, tz),
        endMs: zoneDateMinuteToUtcMs(d, 23 * 60, tz),
        summary: 'Lap Swim',
        lanes: [10],
      },
    ]
    const n = getCompPoolLaneCountAtTime({
      events,
      selectedDate: d,
      selectedMinute: 19 * 60,
      timeZone: tz,
    })
    expect(n).toBe(20)
  })
})
