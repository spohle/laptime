/** Lane fills stay theme-driven; lane text uses high-contrast tokens per theme. */
export const STATE_STYLES = {
  open: { card: 'bg-laneOpen !text-slate-900' },
  reserved: { card: 'bg-laneReserved !text-slate-900' },
  closed: { card: 'bg-laneClosed !text-slate-900' },
  unknown: { card: 'bg-laneUnknown !text-laneUnknownFg' },
}
