import { STATE_STYLES } from '../lib/stateStyles'

function formatLaneOpenUntil(endMs, timeZone) {
  if (!endMs) {
    return ''
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(endMs))
}

function LaneStripContent({ lane, timeZone }) {
  return (
    <>
      <div className="w-full truncate text-center text-[7px] font-bold tabular-nums leading-tight text-inherit sm:text-[11px] sm:leading-normal">
        {lane.lane}
      </div>
      {lane.state === 'open' && lane.endMs ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
          <span className="-rotate-90 origin-center whitespace-nowrap text-[6px] font-extrabold leading-none text-inherit sm:text-[9px]">
            {formatLaneOpenUntil(lane.endMs, timeZone)}
          </span>
        </div>
      ) : null}
    </>
  )
}

function LaneRowContent({ lane, timeZone }) {
  return (
    <div className="relative flex h-full w-full items-center justify-between px-2 sm:px-3">
      <span className="text-[10px] font-bold tabular-nums tracking-wide text-inherit sm:text-[11px]">{lane.lane}</span>
      {lane.state === 'open' && lane.endMs ? (
        <span className="absolute left-1/2 top-1/2 max-w-[calc(100%-0.5rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[9px] font-extrabold uppercase tracking-wide text-inherit sm:max-w-none sm:text-[10px]">
          {formatLaneOpenUntil(lane.endMs, timeZone)}
        </span>
      ) : null}
    </div>
  )
}

/**
 * @param {'strip20' | 'stack9'} layout — 20 vertical strips vs 9 stacked horizontal rows (50m)
 */
function CompPoolLanes({ lanes, isLoading, timeZone, layout }) {
  return (
    <div className="mt-6 min-w-0 sm:mt-8">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Competition Pool</h2>
      </div>

      <div className="relative min-w-0 pb-2">
        {isLoading ? (
          <div
            className="absolute inset-0 z-20 flex items-start justify-center bg-slate-950/65 px-4 pb-8 pt-6 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="border border-white/25 bg-slate-900/95 px-6 py-4 text-center shadow-lg sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Calendar</p>
              <p className="mt-1 text-base font-bold text-white">Loading schedule…</p>
            </div>
          </div>
        ) : null}

        {layout === 'strip20' ? (
          <div className="flex h-52 w-full min-w-0 max-w-full box-border gap-px border border-white/10 bg-slateDeep/80 p-1.5 sm:h-80 sm:gap-1 sm:p-3">
            {lanes.map((lane) => {
              const style = STATE_STYLES[lane.state]
              return (
                <article
                  key={lane.lane}
                  className={`relative flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col justify-between p-0.5 shadow-md sm:p-2 ${
                    lane.state === 'open' && lane.endMs ? 'overflow-visible' : 'overflow-hidden'
                  } ${style.card}`}
                >
                  <LaneStripContent lane={lane} timeZone={timeZone} />
                </article>
              )
            })}
          </div>
        ) : (
          <div className="border border-white/10 bg-slateDeep/80 p-2 sm:p-3">
            <div className="flex h-64 w-full flex-col gap-1 sm:h-80">
              {lanes.map((lane) => {
                const style = STATE_STYLES[lane.state]
                return (
                  <article
                    key={lane.lane}
                    className={`relative flex min-h-0 w-full flex-1 flex-col shadow-md ${style.card}`}
                  >
                    <LaneRowContent lane={lane} timeZone={timeZone} />
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompPoolLanes
