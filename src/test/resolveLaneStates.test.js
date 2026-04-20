import { describe, expect, it } from 'vitest'
import { resolveLaneStates } from '../lib/resolveLaneStates'

describe('resolveLaneStates', () => {
  it('always prioritizes closed lanes on overlap', () => {
    const events = [
      {
        id: 'open',
        startMs: Date.UTC(2026, 3, 20, 16, 0),
        endMs: Date.UTC(2026, 3, 20, 18, 0),
        state: 'open',
        purpose: 'Lap Swim',
        priority: 2,
        lanes: [1, 2, 3],
      },
      {
        id: 'closed',
        startMs: Date.UTC(2026, 3, 20, 16, 30),
        endMs: Date.UTC(2026, 3, 20, 17, 30),
        state: 'closed',
        purpose: 'Closed',
        priority: 4,
        lanes: [2],
      },
    ]

    const lanes = resolveLaneStates({
      events,
      selectedDate: '2026-04-20',
      selectedMinute: 600,
      laneCount: 3,
      timeZone: 'America/Los_Angeles',
    })

    expect(lanes[0].state).toBe('open')
    expect(lanes[1].state).toBe('closed')
    expect(lanes[2].state).toBe('open')
  })

  it('prefers the most recent overlapping assignment when not closed', () => {
    const events = [
      {
        id: 'older-reserved',
        startMs: Date.UTC(2026, 3, 21, 1, 30),
        endMs: Date.UTC(2026, 3, 21, 2, 30),
        state: 'reserved',
        purpose: 'Reserved',
        priority: 3,
        lanes: [8, 9],
      },
      {
        id: 'newer-open',
        startMs: Date.UTC(2026, 3, 21, 2, 0),
        endMs: Date.UTC(2026, 3, 21, 2, 30),
        state: 'open',
        purpose: 'Lap Swim',
        priority: 2,
        lanes: [8, 9],
      },
    ]

    const lanes = resolveLaneStates({
      events,
      selectedDate: '2026-04-20',
      selectedMinute: 19 * 60 + 15,
      laneCount: 10,
      timeZone: 'America/Los_Angeles',
    })

    expect(lanes[7].state).toBe('open')
    expect(lanes[8].state).toBe('open')
  })

  it('returns unknown when no events are active', () => {
    const lanes = resolveLaneStates({
      events: [],
      selectedDate: '2026-04-20',
      selectedMinute: 600,
      laneCount: 2,
      timeZone: 'America/Los_Angeles',
    })

    expect(lanes).toEqual([
      { lane: 1, state: 'unknown', purpose: '' },
      { lane: 2, state: 'unknown', purpose: '' },
    ])
  })
})
