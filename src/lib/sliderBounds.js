import { utcMsToZoneDateMinute } from './timezone'

export const SLIDER_STEP_MINUTES = 5

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function sliderBoundsFromEvents(events, selectedDate, timeZone, sliderStepMinutes = SLIDER_STEP_MINUTES) {
  const overlaps = []

  events.forEach((event) => {
    const start = utcMsToZoneDateMinute(event.startMs, timeZone)
    const end = utcMsToZoneDateMinute(Math.max(event.endMs - 1, event.startMs), timeZone)

    if (selectedDate < start.date || selectedDate > end.date) {
      return
    }

    const minMinute = selectedDate === start.date ? start.minute : 0
    const maxMinute = selectedDate === end.date ? end.minute : 1439
    overlaps.push({ minMinute, maxMinute })
  })

  if (overlaps.length === 0) {
    return { minMinute: 0, maxMinute: 1439 }
  }

  const rawMin = Math.min(...overlaps.map((item) => item.minMinute))
  const rawMax = Math.max(...overlaps.map((item) => item.maxMinute))
  const minMinute = clamp(Math.floor(rawMin / sliderStepMinutes) * sliderStepMinutes, 0, 1439)
  const maxMinute = clamp(
    Math.ceil(rawMax / sliderStepMinutes) * sliderStepMinutes,
    minMinute + sliderStepMinutes,
    1440,
  )
  return { minMinute, maxMinute: Math.min(maxMinute, 1439) }
}
