# דשבורד יערית · Operations Dashboard

A Next.js 14 (App Router) implementation of the Yaarit operations dashboard:
five brand-colored office cards plus a flexible management card, all in
Hebrew RTL, with a dark/light theme toggle and the polished entrance / hover
/ modal / toast motion from the design.

Backed by a Google Sheet via a service-account — every add/remove/rename
hits the sheet in the background, with optimistic updates so the UI stays
instant.

## Stack

- **Next.js 14** (App Router, Server Components for the initial load)
- **TypeScript** (strict)
- **Tailwind CSS** (set up; design tokens live in `src/app/globals.css`)
- **Google Sheets** as the backing store, via `googleapis` and a service
  account
- No additional database

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

The first request creates any missing tabs (`tasks`, `mgmt_rows`,
`mgmt_tasks`) in the sheet with the right headers, and runs the daily יומי
cleanup before reading.

## Configuration

Two pieces of config in `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_PATH=./secrets/service-account.json
GOOGLE_SHEET_ID=1cO94DlobEy5tOBuobx8ty9Dob7700dI_gFqD76voR1w
DASHBOARD_TZ=Asia/Jerusalem   # optional; default Asia/Jerusalem
```

The service account must have **Editor** access on the sheet (share the
sheet with `client_email` from `secrets/service-account.json`). Both the
service-account file and `.env.local` are gitignored.

## Project layout

```
src/
├── app/
│   ├── layout.tsx                  — html/body, RTL, theme bootstrap, fonts
│   ├── page.tsx                    — server component; reads the sheet directly
│   ├── globals.css                 — full design tokens + component styles
│   └── api/sheet/
│       ├── route.ts                — GET snapshot (runs daily cleanup)
│       ├── tasks/route.ts          — POST add task
│       ├── tasks/[id]/route.ts     — DELETE task
│       ├── mgmt-rows/route.ts      — POST add management row
│       └── mgmt-rows/[id]/route.ts — DELETE / PATCH (rename) row
├── components/dashboard/           — UI (unchanged from the design)
├── hooks/
│   └── useReveal.ts                — IntersectionObserver reveal-on-scroll
└── lib/
    ├── types.ts                    — domain shapes
    ├── mock-data.ts                — static OFFICES + DEPARTMENTS config
    ├── data-source.ts              — client API + local optimistic helpers
    ├── colors.ts                   — hex → soft-rgba helper
    └── sheets/                     — server-only Google Sheets adapter
        ├── client.ts               — JWT auth + tab init + caching
        ├── schema.ts               — tab/column constants
        ├── repository.ts           — CRUD that returns DashboardSnapshot
        └── cleanup.ts              — daily יומי sweep
```

## Sheet schema

The repository auto-creates these tabs on first run if they don't exist:

| Tab          | Columns                                                      |
| ------------ | ------------------------------------------------------------ |
| `tasks`      | `id, officeId, dept, type (יומי/קבוע), text, createdAt`        |
| `mgmt_rows`  | `id, name, sortIndex`                                        |
| `mgmt_tasks` | `id, rowId, type, text, createdAt`                           |

Office config (id, name, logo, brand color, meta label) lives in
`src/lib/mock-data.ts` — it's static config, not editable from the UI. To
add a new office, edit `OFFICES` there and drop a logo into `public/assets/`.

## How updates flow

1. The server page (`page.tsx`) imports `loadSnapshot` directly from the
   repository. No HTTP self-call, no waterfall.
2. Every mutation in the UI goes through `Dashboard.tsx`. Each handler:
   1. Generates a UUID client-side.
   2. Applies the change locally with `apply*` (instant UI).
   3. Fires the matching `api*` POST/DELETE/PATCH.
   4. On error, rolls back and shows a toast.
3. Row renames are debounced 600ms so typing doesn't spam PATCH calls.

## Daily יומי cleanup

`loadSnapshot()` (the server-side initial read) calls `dailyCleanup()` first.
The cleanup:

- Reads every row in `tasks` and `mgmt_tasks`.
- For each row whose `type === "יומי"`, compares its `createdAt` date
  (in `DASHBOARD_TZ`) to today.
- Batch-deletes all rows whose date is strictly before today.
- Memoizes per calendar day so subsequent loads on the same day skip the
  scan (until the server restarts or the day rolls over).

So just opening the dashboard at the start of a day is enough — the sheet
is automatically swept of yesterday's יומי tasks. No external cron required.
If you prefer a real cron, you can call `GET /api/sheet` on a schedule.

## What's preserved from the design

- RTL Hebrew layout throughout
- Dark + light themes (toggle persists in `localStorage`)
- Brand-colored top stripe + soft halo per office card
- Live pulse dot in the page header
- Staggered card entrance (60ms per card)
- Reveal-on-scroll for the stats row
- Modal scale-fade open/close
- Task chip slide-in on add, scale-fade on remove
- Management card row slide-out on delete
- `prefers-reduced-motion: reduce` honored
- Hotkeys: `N` opens the add modal, `⌘/Ctrl + ↵` saves, `Esc` closes

## Notes

- The Hebrew date in the page header is rendered client-side (avoids
  hydration mismatches across timezones).
- Logos live under `public/assets/`. Swap or add new offices by editing
  `src/lib/mock-data.ts`.
