# laptime

**Rose Bowl Aquatics — Lane Visualizer** is a small React app that shows **rec pool** and **competition pool** lane usage for a chosen date and time. It reads two public [Google Calendar](https://calendar.google.com/) ICS feeds, parses event text for lane ranges and activity type, and renders per-lane states (open, reserved, closed, or unknown).

## Features

- **Dual calendars**: Rec pool (20 lanes) and competition pool (9 or 20 lanes depending on pool configuration that day).
- **Local controls**: Date picker and 5-minute time slider, scoped to `America/Los_Angeles` (hardcoded in the app).
- **Resilient fetching**: Tries same-origin `/api/calendar-ics` routes first, then direct Google ICS URLs, then a public CORS proxy fallback (`allorigins.win`).
- **Dark / light theme** via a toggle in the header.

## Tech stack

| Area | Details |
|------|---------|
| Runtime / UI | [React](https://react.dev/) 19, JSX |
| Build | [Vite](https://vite.dev/) 8, `@vitejs/plugin-react` |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3, custom theme tokens in `src/styles/` |
| ICS parsing | [ical.js](https://github.com/kewisch/ical.js) |
| Tests | [Vitest](https://vitest.dev/) |
| Lint | ESLint 9 (flat config) |

## Prerequisites

- [Node.js](https://nodejs.org/) (current LTS or latest stable is fine; the project targets modern ES modules)

## Scripts

From the repo root:

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run Vitest once (`vitest run`) |
| `npm run lint` | Run ESLint on the project |

## How it works

1. **Fetch** — `src/lib/calendarClient.js` loads ICS text for two calendar IDs (rec and competition), then parses with `ical.js`. Recurring events are expanded into instances within a rolling window (roughly **14 days in the past** through **120 days in the future** from fetch time).

2. **Normalize** — `src/lib/normalizeEvents.js` derives lane ranges from event summary/description (e.g. `lanes 3-5`, “all lanes”, “8 lanes”) and infers a coarse **state** (open / reserved / closed) and **purpose** label from keywords. Each normalized event includes `lanes`, `priority`, and time bounds.

3. **Competition pool layout** — `src/lib/compPoolLayout.js` decides **9** (long course style) vs **20** (short course style) lanes using “Pool Change - CLOSED” style markers and toggling through the day; if any active non-marker event uses lane **> 9**, the UI forces **20** lanes.

4. **Resolve** — `src/lib/resolveLaneStates.js` picks, for each lane at the selected instant, the winning overlapping event (closed wins, then tie-breakers on start time, priority, end time).

5. **UI** — `src/App.jsx` composes `TimeControls`, `PoolLanes`, `LaneLegend`, and `CompPoolLanes`, and shows load errors from failed calendar fetches.

### ICS proxy (dev vs production)

- **Development**: `vite.config.js` registers middleware that proxies:
  - `/api/calendar-ics` → rec pool public ICS URL  
  - `/api/calendar-ics-competition` → competition pool public ICS URL  
  Shared URL constants and serverless-friendly handlers live in `server/icsProxy.js`.

- **Production-style hosting** (e.g. [Vercel](https://vercel.com/) serverless): `api/calendar-ics.js` and `api/calendar-ics-competition.js` re-export handlers that call `handleIcsProxyRequest` with the same Google URLs. **Static hosting alone** (uploading only `dist/`) will not serve those routes unless you deploy the `api/` layer or another backend that serves the same paths.

## Repository layout

```
api/                    # Serverless GET handlers for ICS proxy (production)
server/icsProxy.js      # Shared proxy logic + Google ICS URLs
src/
  App.jsx               # Page shell, data loading, slider bounds, lane resolution
  main.jsx              # React root
  components/           # Pool visuals, time controls, theme, legend
  lib/                  # calendarClient, normalizeEvents, resolveLaneStates,
                        # compPoolLayout, timezone helpers, state styles
  styles/               # Tailwind entry + theme CSS
  test/                 # Vitest specs for parsing and layout logic
```

## Configuration notes

- **Timezone** for the UI and all “selected moment” math is **`America/Los_Angeles`** (`src/App.jsx`). Changing facility would require updating that constant (and possibly copy).

- **Calendar sources** are the Google public ICS endpoints implied by the IDs in `src/lib/calendarClient.js` and the encoded URLs in `server/icsProxy.js`.

## Contributing / AI notes

Optional workspace guidance for agents and humans is in [`.cursorrules`](.cursorrules) (debugging style, Tailwind preferences, and Node conventions).

## License

No license file is present in this repository; clarify with the maintainer before redistributing.
