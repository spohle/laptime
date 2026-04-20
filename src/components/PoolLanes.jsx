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

function PoolLanes({ lanes, isLoading, timeZone }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white md:text-xl">RecPool Status</h2>
      </div>

      <div className="relative pb-2">
        {isLoading ? (
          <div
            className="absolute inset-0 z-20 flex items-start justify-center bg-slate-950/65 px-4 pb-8 pt-6 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="border border-white/25 bg-slate-900/95 px-8 py-4 text-center shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Calendar</p>
              <p className="mt-1 text-base font-bold text-white">Loading schedule…</p>
            </div>
          </div>
        ) : null}
        <div className="flex w-full gap-1 border border-white/10 bg-slateDeep/80 p-3">
          {lanes.map((lane) => {
            const style = STATE_STYLES[lane.state]
            return (
              <article key={lane.lane} className={`relative flex h-80 min-w-0 flex-1 flex-col justify-between p-2 shadow-md ${style.card}`}>
                <div className="text-center text-[11px] font-bold uppercase tracking-wide text-current">Lane {lane.lane}</div>
                {lane.state === 'open' && lane.endMs ? (
                  <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 px-1 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-current">
                    {formatLaneOpenUntil(lane.endMs, timeZone)}
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
