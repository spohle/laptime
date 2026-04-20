import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMinuteLabel, getNowInZone } from '../lib/timezone'

function TimeControls({
  selectedDate,
  selectedMinute,
  onDateChange,
  onMinuteChange,
  timeZone,
  minMinute,
  maxMinute,
}) {
  const dateInputRef = useRef(null)
  const [clockTick, setClockTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setClockTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // clockTick forces periodic refresh of wall-clock "now" for the red marker
  // eslint-disable-next-line react-hooks/exhaustive-deps -- clockTick
  const nowInZone = useMemo(() => getNowInZone(timeZone), [timeZone, clockTick])

  const thumbPercent = useMemo(() => {
    if (maxMinute <= minMinute) return 0
    return ((selectedMinute - minMinute) / (maxMinute - minMinute)) * 100
  }, [selectedMinute, minMinute, maxMinute])

  const { showNowLine, nowLinePercent } = useMemo(() => {
    const isToday = selectedDate === nowInZone.date
    const m = nowInZone.minutes
    const inRange = m >= minMinute && m <= maxMinute
    if (!isToday || !inRange || maxMinute <= minMinute) {
      return { showNowLine: false, nowLinePercent: 0 }
    }
    return {
      showNowLine: true,
      nowLinePercent: ((m - minMinute) / (maxMinute - minMinute)) * 100,
    }
  }, [selectedDate, nowInZone.date, nowInZone.minutes, minMinute, maxMinute])

  const handleSliderChange = (event) => {
    onMinuteChange(Number(event.target.value))
  }
  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
    }
  }

  return (
    <section className="border border-white/10 bg-slateDeep/70 p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
          Date
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={dateInputRef}
              className="min-h-11 w-full min-w-0 rounded border border-white/25 bg-slate-900/90 px-3 py-2 text-base text-white [color-scheme:dark] sm:min-h-0 sm:w-auto sm:min-w-[11rem] sm:text-sm"
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
            />
            <button
              type="button"
              onClick={openDatePicker}
              className="min-h-11 shrink-0 rounded border border-white/20 bg-black/20 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-100 sm:min-h-0 sm:px-3"
            >
              Pick
            </button>
          </div>
        </label>
        <div className="text-left sm:text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Timezone</p>
          <p className="break-all text-sm text-slate-200 sm:break-normal">{timeZone}</p>
        </div>
      </div>

      <div className="relative flex flex-col pt-8 sm:pt-9">
        {showNowLine ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-[5] w-[2px] -translate-x-1/2 bg-red-500"
            style={{ left: `${nowLinePercent}%` }}
            aria-hidden
          />
        ) : null}
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${thumbPercent}%` }}
          aria-hidden
        >
          <span className="inline-block max-w-[min(calc(100vw-2.5rem),14rem)] truncate border border-laneOpen/60 bg-slate-950/95 px-2 py-1 text-center text-xs font-bold text-laneOpen shadow-md sm:max-w-none sm:text-sm">
            {formatMinuteLabel(selectedMinute)}
          </span>
        </div>
        <div className="relative z-30 px-0.5 py-2 sm:py-0">
          <input
            type="range"
            min={minMinute}
            max={maxMinute}
            step="5"
            value={selectedMinute}
            onChange={handleSliderChange}
            onInput={handleSliderChange}
            className="time-range-input"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          <span>{formatMinuteLabel(minMinute)}</span>
          <span>{formatMinuteLabel(maxMinute)}</span>
        </div>
      </div>
    </section>
  )
}

export default TimeControls
