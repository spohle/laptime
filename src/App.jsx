import { useEffect, useMemo, useState } from 'react'
import CompPoolLanes from './components/CompPoolLanes'
import LaneLegend from './components/LaneLegend'
import PoolLanes from './components/PoolLanes'
import RecPoolDayTimeline from './components/RecPoolDayTimeline'
import ThemeToggle from './components/ThemeToggle'
import TimeControls from './components/TimeControls'
import { fetchCompetitionPoolEvents, fetchRecPoolEvents } from './lib/calendarClient'
import { getCompPoolLaneCountAtTime } from './lib/compPoolLayout'
import { findBestRecPoolLapSwimWindow, formatBestRecPoolLapSwimLine } from './lib/recPoolBestWindow'
import { sliderBoundsFromEvents } from './lib/sliderBounds'
import { resolveLaneStates } from './lib/resolveLaneStates'
import { getNowInZone } from './lib/timezone'

const TIME_ZONE = 'America/Los_Angeles'
const REC_DISPLAY_MODES = {
  SNAPSHOT: 'snapshot',
  TIMELINE: 'timeline',
}
const PLAYBACK_DURATION_MS = 5000

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
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
  const [recDisplayMode, setRecDisplayMode] = useState(REC_DISPLAY_MODES.SNAPSHOT)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setIsLoadingRec(true)
      setIsLoadingComp(true)
      setError('')

      const options = { selectedDate, timeZone: TIME_ZONE }
      const results = await Promise.allSettled([fetchRecPoolEvents(options), fetchCompetitionPoolEvents(options)])

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
  }, [selectedDate])

  const mergedEvents = useMemo(() => [...recEvents, ...compEvents], [recEvents, compEvents])

  const sliderBounds = useMemo(
    () => sliderBoundsFromEvents(mergedEvents, selectedDate, TIME_ZONE),
    [mergedEvents, selectedDate],
  )
  const timeSliderMaxMinute = useMemo(
    () => Math.max(sliderBounds.minMinute, sliderBounds.maxMinute - 1),
    [sliderBounds.minMinute, sliderBounds.maxMinute],
  )

  const recTimelineBounds = useMemo(
    () => sliderBoundsFromEvents(recEvents, selectedDate, TIME_ZONE),
    [recEvents, selectedDate],
  )

  const effectiveMinute = useMemo(
    () => clamp(selectedMinute, sliderBounds.minMinute, timeSliderMaxMinute),
    [selectedMinute, sliderBounds.minMinute, timeSliderMaxMinute],
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

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    if (timeSliderMaxMinute <= sliderBounds.minMinute) {
      setIsPlaying(false)
      return
    }

    let frameId = 0
    let finishTimeoutId = 0
    const startMinute = sliderBounds.minMinute
    const endMinute = timeSliderMaxMinute
    const minuteSpan = endMinute - startMinute
    const animationStartMs = performance.now()

    setSelectedMinute(startMinute)

    const tick = (nowMs) => {
      const elapsedMs = nowMs - animationStartMs
      const progress = Math.min(elapsedMs / PLAYBACK_DURATION_MS, 1)
      const rawMinute = startMinute + minuteSpan * progress
      const snappedMinute = clamp(Math.round(rawMinute / 5) * 5, startMinute, endMinute)

      setSelectedMinute((currentMinute) => (currentMinute === snappedMinute ? currentMinute : snappedMinute))

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
        return
      }

      finishTimeoutId = window.setTimeout(() => {
        const currentMinute = getNowInZone(TIME_ZONE).minutes
        const clampedCurrentMinute = clamp(currentMinute, sliderBounds.minMinute, timeSliderMaxMinute)
        setSelectedMinute(clampedCurrentMinute)
        setIsPlaying(false)
      }, 1000)
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(finishTimeoutId)
    }
  }, [isPlaying, sliderBounds.minMinute, timeSliderMaxMinute])

  const handleMinuteChange = (nextMinute) => {
    setIsPlaying(false)
    setSelectedMinute(nextMinute)
  }

  const handleDateChange = (nextDate) => {
    setIsPlaying(false)
    setSelectedDate(nextDate)
  }

  const handlePlayToggle = () => {
    if (recDisplayMode !== REC_DISPLAY_MODES.SNAPSHOT) {
      return
    }
    setIsPlaying((playing) => !playing)
  }

  return (
    <main className="mx-auto min-w-0 w-full max-w-6xl pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-4 sm:pl-4 sm:pr-4 sm:py-6 md:py-8">
      <header className="mb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs uppercase tracking-[0.25em] text-uiMuted sm:text-sm">
              Rose Bowl Aquatics
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-uiSoft">Display</span>
                <select
                  value={recDisplayMode}
                  onChange={(event) => setRecDisplayMode(event.target.value)}
                  className="min-h-9 min-w-[9.5rem] cursor-pointer rounded bg-uiInput/95 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-uiBody sm:min-h-0"
                >
                  <option value={REC_DISPLAY_MODES.SNAPSHOT}>Snapshot</option>
                  <option value={REC_DISPLAY_MODES.TIMELINE}>Timeline</option>
                </select>
              </label>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="flex min-w-0 flex-col gap-4 bg-slateCard/70 p-3 shadow-glow backdrop-blur sm:p-4 md:gap-6 md:p-6">
        {/* Mobile: date/time first (below the fold otherwise). md+: pools first like desktop. */}
        <div className="order-1 min-w-0 md:order-2">
          <TimeControls
            selectedDate={selectedDate}
            selectedMinute={effectiveMinute}
            onDateChange={handleDateChange}
            onMinuteChange={handleMinuteChange}
            minMinute={sliderBounds.minMinute}
            maxMinute={timeSliderMaxMinute}
            showTimeSlider={recDisplayMode === REC_DISPLAY_MODES.SNAPSHOT}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
          />
        </div>
        <div className="order-2 flex min-w-0 flex-col md:order-1">
          {recDisplayMode === REC_DISPLAY_MODES.SNAPSHOT ? (
            <PoolLanes
              lanes={recLaneStates}
              isLoading={isLoadingRec}
              timeZone={TIME_ZONE}
              title="RecPool Status"
              summaryLine={recPeakLapSwimLine}
            />
          ) : (
            <RecPoolDayTimeline
              events={recEvents}
              selectedDate={selectedDate}
              timeZone={TIME_ZONE}
              isLoading={isLoadingRec}
              title="RecPool Day Timeline"
              minMinute={recTimelineBounds.minMinute}
              maxMinute={recTimelineBounds.maxMinute}
            />
          )}
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
