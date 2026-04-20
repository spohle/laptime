import { describe, expect, it } from 'vitest'
import {
  findBestRecPoolLapSwimWindow,
  formatBestRecPoolLapSwimLine,
  startOfNextZoneDateMs,
} from '../lib/recPoolBestWindow'
import { utcMsToZoneDateMinute, zoneDateMinuteToUtcMs } from '../lib/timezone'

const TZ = 'America/Los_Angeles'

describe('recPoolBestWindow', () => {
  it('next-day boundary sits on first instant off the selected local date', () => {
    for (const dateText of ['2026-04-20', '2026-03-08', '2026-11-01']) {
      const end = startOfNextZoneDateMs(dateText, TZ)
      expect(utcMsToZoneDateMinute(end - 1, TZ).date).toBe(dateText)
      expect(utcMsToZoneDateMinute(end, TZ).date).not.toBe(dateText)
    }
  })

  it('finds longest peak lap-swim span for overlapping reserved + open', () => {
    const dateText = '2026-04-20'
    const dayStart = zoneDateMinuteToUtcMs(dateText, 0, TZ)
    const dayEndEx = startOfNextZoneDateMs(dateText, TZ)

    const events = [
      {
        id: 'r',
        startMs: dayStart + 3_600_000,
        endMs: dayEndEx - 3_600_000,
        state: 'reserved',
        purpose: 'Reserved',
        priority: 3,
        lanes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: 'o',
        startMs: dayStart + 3_600_000,
        endMs: dayEndEx - 3_600_000,
        state: 'open',
        purpose: 'Lap Swim',
        priority: 2,
        lanes: [11, 12, 13],
      },
    ]

    const best = findBestRecPoolLapSwimWindow({
      events,
      selectedDate: dateText,
      laneCount: 20,
      timeZone: TZ,
    })

    expect(best?.laneCount).toBe(3)
    expect(best?.durationMs).toBe(dayEndEx - 3_600_000 - (dayStart + 3_600_000))
    expect(formatBestRecPoolLapSwimLine(best, TZ)).toMatch(/Peak lap swim/)
  })
})
