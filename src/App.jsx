import { useEffect, useMemo, useState } from 'react'
import CompPoolLanes from './components/CompPoolLanes'
import LaneLegend from './components/LaneLegend'
import PoolLanes from './components/PoolLanes'
import TimeControls from './components/TimeControls'
import { fetchCompetitionPoolEvents, fetchRecPoolEvents } from './lib/calendarClient'
import { getCompPoolLaneCountAtTime } from './lib/compPoolLayout'
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
    <main className="mx-auto w-[90%] max-w-none py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Rose Bowl Aquatics</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-white md:text-5xl">Lane Visualizer</h1>
      </header>

      <section className="border border-white/10 bg-slateCard/70 p-4 shadow-glow backdrop-blur md:p-6">
        <PoolLanes lanes={recLaneStates} isLoading={isLoadingRec} timeZone={TIME_ZONE} title="RecPool Status" />
        <LaneLegend />
        <CompPoolLanes
          lanes={compLaneStates}
          isLoading={isLoadingComp}
          timeZone={TIME_ZONE}
          layout={compLayout}
        />
        <TimeControls
          selectedDate={selectedDate}
          selectedMinute={effectiveMinute}
          onDateChange={setSelectedDate}
          onMinuteChange={setSelectedMinute}
          timeZone={TIME_ZONE}
          minMinute={sliderBounds.minMinute}
          maxMinute={sliderBounds.maxMinute}
        />
      </section>

      {error ? (
        <p className="mt-4 whitespace-pre-wrap border border-red-400/40 bg-red-400/15 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </main>
  )
}

export default App
