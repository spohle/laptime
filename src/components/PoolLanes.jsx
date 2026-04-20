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

function PoolLanes({ lanes, isLoading, timeZone, title = 'RecPool Status' }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">{title}</h2>
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
        <div className="flex h-52 w-full min-w-0 max-w-full box-border gap-px border border-white/10 bg-slateDeep/80 p-1.5 sm:h-80 sm:gap-1 sm:p-3">
          {lanes.map((lane) => {
            const style = STATE_STYLES[lane.state]
            return (
              <article
                key={lane.lane}
                className={`relative flex h-full min-w-0 max-w-full flex-1 flex-col justify-between p-0.5 shadow-md sm:p-2 ${
                  lane.state === 'open' && lane.endMs ? 'overflow-visible' : 'overflow-hidden'
                } ${style.card}`}
              >
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
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PoolLanes
