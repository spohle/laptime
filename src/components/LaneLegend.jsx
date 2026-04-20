const LEGEND = [
  { key: 'open', label: 'Lap Swim Open', swatch: 'bg-laneOpen !text-slate-900' },
  { key: 'reserved', label: 'Program / Reserved', swatch: 'bg-laneReserved !text-slate-900' },
  { key: 'closed', label: 'Closed / Unavailable', swatch: 'bg-laneClosed !text-slate-900' },
  { key: 'unknown', label: 'No Schedule Match', swatch: 'bg-laneUnknown !text-slate-200' },
]

function LaneLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-5 sm:gap-3">
      {LEGEND.map((item) => (
        <div key={item.key} className="flex min-w-0 items-center gap-2 text-[10px] text-slate-100 sm:text-xs">
          <span className={`inline-block h-4 w-4 rounded-sm ${item.swatch}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default LaneLegend
