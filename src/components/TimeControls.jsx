import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMinuteLabel, getNowInZone } from '../lib/timezone'

function TimeControls({
  selectedDate,
  selectedMinute,
  onDateChange,
  onMinuteChange,
  timeZone,
  minDate,
  maxDate,
  minMinute,
  maxMinute,
}) {
  const dateInputRef = useRef(null)
  const [clockTick, setClockTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setClockTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

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
    <section className="mt-6 border border-white/10 bg-slateDeep/70 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
          Date
          <div className="flex items-center gap-2">
            <input
              ref={dateInputRef}
              className="border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              type="date"
              value={selectedDate}
              min={minDate || undefined}
              max={maxDate || undefined}
              onClick={openDatePicker}
              onFocus={openDatePicker}
              onChange={(event) => onDateChange(event.target.value)}
            />
            <button
              type="button"
              onClick={openDatePicker}
              className="border border-white/20 bg-black/20 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-100"
            >
              Pick
            </button>
          </div>
        </label>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Timezone</p>
          <p className="text-sm text-slate-200">{timeZone}</p>
        </div>
      </div>

      <div className="relative flex flex-col pt-9">
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
          <span className="inline-block border border-laneOpen/60 bg-slate-950/95 px-2 py-1 text-sm font-bold text-laneOpen shadow-md">
            {formatMinuteLabel(selectedMinute)}
          </span>
        </div>
        <input
          type="range"
          min={minMinute}
          max={maxMinute}
          step="5"
          value={selectedMinute}
          onChange={handleSliderChange}
          onInput={handleSliderChange}
          className="relative z-0 mt-1 h-2 w-full cursor-pointer appearance-none bg-white/20 accent-laneOpen"
        />
        <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          <span>{formatMinuteLabel(minMinute)}</span>
          <span>{formatMinuteLabel(maxMinute)}</span>
        </div>
      </div>
    </section>
  )
}

export default TimeControls
