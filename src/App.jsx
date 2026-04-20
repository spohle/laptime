import { useEffect, useMemo, useState } from 'react'
import LaneLegend from './components/LaneLegend'
import PoolLanes from './components/PoolLanes'
import TimeControls from './components/TimeControls'
import { fetchCalendarEvents } from './lib/calendarClient'
import { resolveLaneStates } from './lib/resolveLaneStates'
import { getNowInZone, utcMsToZoneDateMinute } from './lib/timezone'

const TIME_ZONE = 'America/Los_Angeles'
const SLIDER_STEP = 5

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function App() {
  const now = useMemo(() => getNowInZone(TIME_ZONE), [])
  const [selectedDate, setSelectedDate] = useState(now.date)
  const [selectedMinute, setSelectedMinute] = useState(now.minutes)
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true)
        setError('')
        const nextEvents = await fetchCalendarEvents()
        setEvents(nextEvents)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load lane schedule.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadEvents()
  }, [])

  const laneStates = useMemo(
    () =>
      resolveLaneStates({
        events,
        selectedDate,
        selectedMinute,
        laneCount: 20,
        timeZone: TIME_ZONE,
      }),
    [events, selectedDate, selectedMinute],
  )

  const dateBounds = useMemo(() => {
    if (events.length === 0) {
      return { minDate: '', maxDate: '' }
    }

    let minDate = '9999-12-31'
    let maxDate = '0000-01-01'

    events.forEach((event) => {
      const startDate = utcMsToZoneDateMinute(event.startMs, TIME_ZONE).date
      const endDate = utcMsToZoneDateMinute(Math.max(event.endMs - 1, event.startMs), TIME_ZONE).date
      if (startDate < minDate) minDate = startDate
      if (endDate > maxDate) maxDate = endDate
    })

    return { minDate, maxDate }
  }, [events])

  const sliderBounds = useMemo(() => {
    const overlaps = []

    events.forEach((event) => {
      const start = utcMsToZoneDateMinute(event.startMs, TIME_ZONE)
      const end = utcMsToZoneDateMinute(Math.max(event.endMs - 1, event.startMs), TIME_ZONE)

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
  }, [events, selectedDate])

  useEffect(() => {
    setSelectedMinute((minute) => clamp(minute, sliderBounds.minMinute, sliderBounds.maxMinute))
  }, [sliderBounds.maxMinute, sliderBounds.minMinute])

  return (
    <main className="mx-auto w-[90%] max-w-none py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Rose Bowl Aquatics</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-white md:text-5xl">Lane Visualizer</h1>
      </header>

      <section className="border border-white/10 bg-slateCard/70 p-4 shadow-glow backdrop-blur md:p-6">
        <PoolLanes lanes={laneStates} isLoading={isLoading} timeZone={TIME_ZONE} />
        <LaneLegend />
        <TimeControls
          selectedDate={selectedDate}
          selectedMinute={selectedMinute}
          onDateChange={setSelectedDate}
          onMinuteChange={setSelectedMinute}
          timeZone={TIME_ZONE}
          minDate={dateBounds.minDate}
          maxDate={dateBounds.maxDate}
          minMinute={sliderBounds.minMinute}
          maxMinute={sliderBounds.maxMinute}
        />
      </section>

      {error ? (
        <p className="mt-4 border border-red-400/40 bg-red-400/15 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}
    </main>
  )
}

export default App
