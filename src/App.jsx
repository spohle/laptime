import { useEffect, useMemo, useState } from 'react'
import CompPoolLanes from './components/CompPoolLanes'
import LaneLegend from './components/LaneLegend'
import PoolLanes from './components/PoolLanes'
import ThemeToggle from './components/ThemeToggle'
import TimeControls from './components/TimeControls'
import { fetchCompetitionPoolEvents, fetchRecPoolEvents } from './lib/calendarClient'
import { getCompPoolLaneCountAtTime } from './lib/compPoolLayout'
import { findBestRecPoolLapSwimWindow, formatBestRecPoolLapSwimLine } from './lib/recPoolBestWindow'
import { resolveLaneStates } from './lib/resolveLaneStates'
import { getNowInZone, utcMsToZoneDateMinute } from './lib/timezone'

const TIME_ZONE = 'America/Los_Angeles'
const SLIDER_STEP = 5

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function sliderBoundsFromEvents(events, selectedDate, timeZone) {
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
    return { minMinute: 0, maxMinute: 1435 }
  }

  const rawMin = Math.min(...overlaps.map((item) => item.minMinute))
  const rawMax = Math.max(...overlaps.map((item) => item.maxMinute))
  const minMinute = clamp(Math.floor(rawMin / SLIDER_STEP) * SLIDER_STEP, 0, 1435)
  const maxMinute = clamp(Math.ceil(rawMax / SLIDER_STEP) * SLIDER_STEP, minMinute + SLIDER_STEP, 1435)
  return { minMinute, maxMinute }
}

function App() {
  const now = useMemo(() => getNowInZone(TIME_ZONE), [])
  const [selectedDate, setSelectedDate] = useState(now.date)
  const [selectedMinute, setSelectedMinute] = useState(now.minutes)
  const [recEvents, setRecEvents] = useState([])
  const [compEvents, setCompEvents] = useState([])
  const [isLoadingRec, setIsLoadingRec] = useState(true)
  const [isLoadingComp, setIsLoadingComp] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setIsLoadingRec(true)
      setIsLoadingComp(true)
      setError('')

      const results = await Promise.allSettled([fetchRecPoolEvents(), fetchCompetitionPoolEvents()])

      if (cancelled) {
        return
      }

      if (results[0].status === 'fulfilled') {
        setRecEvents(results[0].value)
      } else {
        setRecEvents([])
      }

      if (results[1].status === 'fulfilled') {
        setCompEvents(results[1].value)
      } else {
        setCompEvents([])
      }

      const errs = []
      if (results[0].status === 'rejected') {
        errs.push(
          `Rec pool: ${results[0].reason instanceof Error ? results[0].reason.message : String(results[0].reason)}`,
        )
      }
      if (results[1].status === 'rejected') {
        errs.push(
          `Competition pool: ${results[1].reason instanceof Error ? results[1].reason.message : String(results[1].reason)}`,
        )
      }
      setError(errs.join('\n'))

      setIsLoadingRec(false)
      setIsLoadingComp(false)
    }

    void loadEvents()
    return () => {
      cancelled = true
    }
  }, [])

  const mergedEvents = useMemo(() => [...recEvents, ...compEvents], [recEvents, compEvents])

  const sliderBounds = useMemo(
    () => sliderBoundsFromEvents(mergedEvents, selectedDate, TIME_ZONE),
    [mergedEvents, selectedDate],
  )

  const effectiveMinute = useMemo(
    () => clamp(selectedMinute, sliderBounds.minMinute, sliderBounds.maxMinute),
    [selectedMinute, sliderBounds.minMinute, sliderBounds.maxMinute],
  )

  const recLaneStates = useMemo(
    () =>
      resolveLaneStates({
        events: recEvents,
        selectedDate,
        selectedMinute: effectiveMinute,
        laneCount: 20,
        timeZone: TIME_ZONE,
      }),
    [recEvents, selectedDate, effectiveMinute],
  )

  const recPeakLapSwimLine = useMemo(() => {
    if (isLoadingRec) {
      return ''
    }
    const bestWindow = findBestRecPoolLapSwimWindow({
      events: recEvents,
      selectedDate,
      laneCount: 20,
      timeZone: TIME_ZONE,
    })
    return formatBestRecPoolLapSwimLine(bestWindow, TIME_ZONE) ?? ''
  }, [recEvents, selectedDate, isLoadingRec])

  const compLaneCount = useMemo(
    () =>
      getCompPoolLaneCountAtTime({
        events: compEvents,
        selectedDate,
        selectedMinute: effectiveMinute,
        timeZone: TIME_ZONE,
      }),
    [compEvents, selectedDate, effectiveMinute],
  )

  const compLaneStates = useMemo(
    () =>
      resolveLaneStates({
        events: compEvents,
        selectedDate,
        selectedMinute: effectiveMinute,
        laneCount: compLaneCount,
        timeZone: TIME_ZONE,
      }),
    [compEvents, selectedDate, effectiveMinute, compLaneCount],
  )

  const compLayout = compLaneCount === 20 ? 'strip20' : 'stack9'

  return (
    <main className="mx-auto min-w-0 w-full max-w-6xl pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-4 sm:pl-4 sm:pr-4 sm:py-6 md:py-8">
      <header className="mb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs uppercase tracking-[0.25em] text-uiMuted sm:text-sm">
              Rose Bowl Aquatics
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="flex min-w-0 flex-col gap-4 bg-slateCard/70 p-3 shadow-glow backdrop-blur sm:p-4 md:gap-6 md:p-6">
        {/* Mobile: date/time first (below the fold otherwise). md+: pools first like desktop. */}
        <div className="order-1 min-w-0 md:order-2">
          <TimeControls
            selectedDate={selectedDate}
            selectedMinute={effectiveMinute}
            onDateChange={setSelectedDate}
            onMinuteChange={setSelectedMinute}
            minMinute={sliderBounds.minMinute}
            maxMinute={sliderBounds.maxMinute}
          />
        </div>
        <div className="order-2 flex min-w-0 flex-col md:order-1">
          <PoolLanes
            lanes={recLaneStates}
            isLoading={isLoadingRec}
            timeZone={TIME_ZONE}
            title="RecPool Status"
            summaryLine={recPeakLapSwimLine}
          />
          <LaneLegend />
          <CompPoolLanes
            lanes={compLaneStates}
            isLoading={isLoadingComp}
            timeZone={TIME_ZONE}
            layout={compLayout}
          />
        </div>
      </section>

      {error ? (
        <p className="mt-4 whitespace-pre-wrap break-words border border-red-400/40 bg-red-400/15 px-3 py-3 text-sm text-red-200 sm:px-4">
          {error}
        </p>
      ) : null}
    </main>
  )
}

export default App
