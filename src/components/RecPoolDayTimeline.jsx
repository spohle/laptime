import { useMemo } from 'react'
import { buildRecPoolDayTimeline, getRecPoolTimelineWindowUtc } from '../lib/recPoolDayTimeline'
import { STATE_STYLES } from '../lib/stateStyles'
import { formatMinuteLabel, zoneDateMinuteToUtcMs } from '../lib/timezone'

function RecPoolDayTimeline({
  events,
  selectedDate,
  timeZone,
  isLoading,
  laneCount = 20,
  title = 'RecPool Day Timeline',
  minMinute = 0,
  maxMinute = 1439,
}) {
  const laneTimelines = useMemo(
    () => buildRecPoolDayTimeline({ events, selectedDate, laneCount, timeZone, minMinute, maxMinute }),
    [events, selectedDate, laneCount, timeZone, minMinute, maxMinute],
  )

  const hourTicks = useMemo(() => {
    const windowStartMinute = minMinute
    const windowEndMinute = maxMinute + 1
    const { windowStartUtcMs, windowEndUtcExclusiveMs } = getRecPoolTimelineWindowUtc({
      selectedDate,
      minMinute,
      maxMinute,
      timeZone,
    })
    const windowSpanMs = windowEndUtcExclusiveMs - windowStartUtcMs
    if (windowSpanMs <= 0) {
      return []
    }

    const firstHourMinute = Math.ceil(windowStartMinute / 60) * 60

    const ticks = []
    for (let hourMinute = firstHourMinute; hourMinute <= windowEndMinute; hourMinute += 60) {
      if (hourMinute < windowStartMinute || hourMinute > windowEndMinute) continue
      const hourUtcMs = zoneDateMinuteToUtcMs(selectedDate, hourMinute, timeZone)
      const bottomPercent = (hourUtcMs - windowStartUtcMs) / windowSpanMs

      ticks.push({
        key: hourMinute,
        label: formatMinuteLabel(hourMinute),
        bottomPercent,
        isWindowStart: hourMinute === windowStartMinute,
        isWindowEnd: hourMinute === windowEndMinute,
      })
    }

    return ticks
  }, [minMinute, maxMinute, selectedDate, timeZone])
  const hourLineTicks = useMemo(() => hourTicks.filter((hourTick) => hourTick.key % 60 === 0), [hourTicks])
  const labelNudgePx = -1

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h2 className="pool-section-title text-base font-semibold sm:text-lg md:text-xl">{title}</h2>
      </div>

      <div className="relative min-w-0 pb-2">
        {isLoading ? (
          <div
            className="absolute inset-0 z-20 flex items-start justify-center bg-uiOverlay/50 px-4 pb-8 pt-6 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="bg-uiElevated/95 px-6 py-4 text-center shadow-lg sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uiMuted">Calendar</p>
              <p className="mt-1 text-base font-bold text-uiHeading">Loading schedule…</p>
            </div>
          </div>
        ) : null}
        <div className="pool-rail-bg min-w-0 p-0.5 sm:p-1">
          <div className="flex min-w-0 items-stretch gap-1 sm:gap-2">
            <div className="min-w-0 flex-1">
              <div className="relative h-52 w-full min-w-0 max-w-full sm:h-80">
                <div className="pointer-events-none absolute inset-0 z-40">
                  {hourLineTicks.map((hourTick) => (
                    <div
                      key={`line-${hourTick.key}`}
                      className="absolute inset-x-0 h-px bg-white/25"
                      style={{ bottom: `${hourTick.bottomPercent * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex h-full w-full min-w-0 max-w-full box-border gap-px sm:gap-1">
                  {laneTimelines.map((laneTimeline) => (
                    <article key={laneTimeline.lane} className="relative h-full min-w-0 max-w-full flex-1 overflow-hidden shadow-md">
                      {laneTimeline.segments.map((segment) => {
                        const style = STATE_STYLES[segment.state]
                        return (
                          <div
                            key={`${laneTimeline.lane}-${segment.startMinute}-${segment.endMinute}-${segment.state}`}
                            className={`absolute left-0 w-full ${style.card}`}
                            style={{ bottom: `${segment.bottomPercent}%`, height: `${segment.heightPercent}%` }}
                            title={segment.summary || segment.purpose || segment.state}
                          />
                        )
                      })}
                      <div className="pointer-events-none absolute left-1/2 top-1 z-30 -translate-x-1/2 text-[7px] font-bold tabular-nums leading-tight text-inherit sm:text-[11px] sm:leading-normal">
                        {laneTimeline.lane}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside
              className="relative h-52 w-12 shrink-0 border-l-[0.5px] border-uiMuted/25 sm:h-80 sm:w-14"
              aria-label="Hour labels for selected day"
            >
              {hourTicks.map((hourTick) => {
                const bottomStyle = `${hourTick.bottomPercent * 100}%`
                const tickClassName = hourTick.isWindowStart
                  ? 'pointer-events-none absolute bottom-0 right-0'
                  : hourTick.isWindowEnd
                    ? 'pointer-events-none absolute right-0 top-0'
                    : 'pointer-events-none absolute right-0 -translate-y-1/2'
                const tickStyle = hourTick.isWindowStart
                  ? undefined
                  : hourTick.isWindowEnd
                    ? undefined
                    : { bottom: `calc(${bottomStyle} + ${labelNudgePx}px)` }

                return (
                  <div
                    key={hourTick.key}
                    className={tickClassName}
                    style={tickStyle}
                  >
                    <span className="block text-right text-[9px] font-bold tabular-nums leading-none text-uiMuted sm:text-[10px]">
                      {hourTick.label}
                    </span>
                  </div>
                )
              })}
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecPoolDayTimeline
