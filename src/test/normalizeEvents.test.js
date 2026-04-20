import { describe, expect, it } from 'vitest'
import { normalizeEvents } from '../lib/normalizeEvents'

describe('normalizeEvents', () => {
  it('extracts lane ranges and reserved purpose from summary text', () => {
    const [event] = normalizeEvents([
      {
        id: '1',
        summary: 'Masters practice lanes 4-8',
        description: '',
        startMs: 0,
        endMs: 1,
      },
    ])

    expect(event.state).toBe('reserved')
    expect(event.purpose).toBe('Reserved')
    expect(event.laneRanges).toEqual([{ start: 4, end: 8 }])
    expect(event.priority).toBe(3)
  })

  it('falls back to all lanes when lane numbers are missing', () => {
    const [event] = normalizeEvents([
      {
        id: '2',
        summary: 'Facility closed for maintenance',
        description: '',
        startMs: 0,
        endMs: 1,
      },
    ])

    expect(event.state).toBe('closed')
    expect(event.laneRanges).toEqual([{ start: 1, end: 20 }])
    expect(event.priority).toBe(4)
  })

  it('prefers summary lane range over conflicting description lane range', () => {
    const [event] = normalizeEvents([
      {
        id: '3',
        summary: 'Lap Swim - Lanes 8-9',
        description: 'legacy note lanes 11-12',
        startMs: 0,
        endMs: 1,
      },
    ])

    expect(event.state).toBe('open')
    expect(event.laneRanges).toEqual([{ start: 8, end: 9 }])
  })
})
