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
    <div>
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">{title}</h2>
      </div>

      <div className="relative pb-2">
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
        <div className="touch-pan-x overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] sm:touch-auto sm:overflow-visible">
          <div className="flex h-52 w-max min-w-full gap-0.5 border border-white/10 bg-slateDeep/80 p-2 sm:h-80 sm:w-full sm:gap-1 sm:p-3">
            {lanes.map((lane) => {
              const style = STATE_STYLES[lane.state]
              return (
                <article
                  key={lane.lane}
                  className={`relative flex h-full min-w-[28px] max-w-[44px] flex-none flex-col justify-between p-1 shadow-md sm:min-w-0 sm:max-w-none sm:flex-1 sm:p-2 ${style.card}`}
                >
                  <div className="text-center text-[8px] font-bold uppercase leading-tight tracking-wide text-inherit sm:text-[11px] sm:leading-normal sm:tracking-wide">
                    <span className="sm:hidden">L{lane.lane}</span>
                    <span className="hidden sm:inline">Lane {lane.lane}</span>
                  </div>
                  {lane.state === 'open' && lane.endMs ? (
                    <div className="absolute inset-x-0.5 top-1/2 -translate-y-1/2 px-0.5 py-1 text-center text-[7px] font-extrabold uppercase leading-none tracking-wide text-inherit sm:inset-x-1 sm:px-1 sm:py-2 sm:text-[10px] sm:leading-normal sm:tracking-wide">
                      {formatLaneOpenUntil(lane.endMs, timeZone)}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoolLanes
