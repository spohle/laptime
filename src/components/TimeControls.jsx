import { useMemo } from 'react'
import { formatMinuteLabel } from '../lib/timezone'

function TimeControls({
  selectedDate,
  selectedMinute,
  onDateChange,
  onMinuteChange,
  minMinute,
  maxMinute,
}) {
  const thumbPercent = useMemo(() => {
    if (maxMinute <= minMinute) return 0
    return ((selectedMinute - minMinute) / (maxMinute - minMinute)) * 100
  }, [selectedMinute, minMinute, maxMinute])

  const handleSliderChange = (event) => {
    onMinuteChange(Number(event.target.value))
  }
  const openDatePicker = (event) => {
    const input = event.currentTarget
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
    }
  }

  return (
    <section className="min-w-0 border border-white/10 bg-slateDeep/70 p-3 sm:p-4">
      <div className="mb-3">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
          Date
          <input
            className="min-h-11 w-full min-w-0 cursor-pointer rounded border border-white/25 bg-slate-900/90 px-3 py-2 text-base text-white [color-scheme:dark] sm:min-h-0 sm:w-auto sm:min-w-[11rem] sm:text-sm"
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            onClick={openDatePicker}
          />
        </label>
      </div>

      <div className="relative flex min-w-0 flex-col overflow-x-clip pt-4 sm:pt-9">
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 max-w-full -translate-x-1/2"
          style={{ left: `${thumbPercent}%` }}
          aria-hidden
        >
          <span className="inline-block max-w-[14rem] truncate border border-laneOpen/60 bg-slate-950/95 px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight text-laneOpen shadow-md sm:max-w-none sm:px-2 sm:py-1 sm:text-sm">
            {formatMinuteLabel(selectedMinute)}
          </span>
        </div>
        <div className="relative z-30 px-0.5 py-1 sm:py-0">
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
        <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-300 sm:mt-2">
          <span>{formatMinuteLabel(minMinute)}</span>
          <span>{formatMinuteLabel(maxMinute)}</span>
        </div>
      </div>
    </section>
  )
}

export default TimeControls
