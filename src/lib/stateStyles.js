/** Lane fills stay theme-driven; text uses fixed slate so it always beats body color (#f3f5fa). */
export const STATE_STYLES = {
  open: { card: 'bg-laneOpen !text-slate-900' },
  reserved: { card: 'bg-laneReserved !text-slate-900' },
  closed: { card: 'bg-laneClosed !text-slate-900' },
  unknown: { card: 'bg-laneUnknown !text-slate-200' },
}
