# 北大附中校历项目手册

Production: `https://cal.bdfz.net/`

GitHub repo: `https://github.com/ieduer/bdfz-calendar`

Cloudflare Pages project: `bdfz-calendar`

## Source Of Truth

- UI: `src/App.tsx`, `src/styles.css`
- calendar data: `src/data/schoolYears.ts`
- data types: `src/types.ts`
- display, colors, stats, ICS: `src/lib/calendar.ts`
- feed generation: `scripts/generate-feeds.ts`
- data audit: `scripts/audit-calendar-data.ts`
- Yuque active-tab extractor: `scripts/extract-yuque-current-tab.zsh`
- source notes: `docs/source-notes-2025-2026.md`

Previous school years must remain in `SCHOOL_YEARS` so historical calendars stay viewable. Add new years; do not replace old years. Only move `ACTIVE_SCHOOL_YEAR_ID` when the default public year should change.

## Current Data Scope

The current dataset contains:

- `2025-2026-high`: 高中部，complete
- `2025-2026-prep`: 预科部，partial-source
- `2025-2026-junior`: 初中部，complete from public notices
- `2024-2025-junior`: 初中部 historical year

The pre-deploy audit on 2026-05-28 reported:

- calendars: 4
- events: 386
- cycle events: 240
- cycle events with display circles: 240
- errors: 0
- warnings: 5

The current warnings are expected: four high-school shifted cycle days around the 2025 National Day schedule, plus the prep calendar being a visible-part partial source whose latest captured event is 2026-05-23.

## Yuque Reading Workflow

Yuque calendar pages are login-gated. Public `curl` usually redirects to login, so the reliable path is reading the logged-in rendered spreadsheet from Chrome or Brave.

Before extraction, open the Yuque calendar page and manually switch the bottom sheet tab to the target sheet. For example, use the bottom-left sheet selector to switch between `25-26学年（高中部）` and `25-26学年（预科部）`.

Preferred extraction command:

```bash
cd /Users/ylsuen/CF/calendar
/bin/zsh scripts/extract-yuque-current-tab.zsh \
  --browser chrome \
  --sheet "25-26学年（预科部）" \
  --out data/raw/yuque-2025-2026-prep.json
```

For Brave:

```bash
cd /Users/ylsuen/CF/calendar
/bin/zsh scripts/extract-yuque-current-tab.zsh \
  --browser brave \
  --sheet "25-26学年（高中部）" \
  --out data/raw/yuque-2025-2026-high.json
```

If the browser blocks Apple Events JavaScript, enable:

```text
View -> Developer -> Allow JavaScript from Apple Events
```

The extractor only asks the active browser tab to return `document.body.innerText` plus title, URL, and timestamp. It does not read browser cookies, local storage, passwords, or profile files.

`data/raw/*.json` is intentionally ignored by Git. Keep raw extracts local for operator audit. Commit source notes only after removing anything that should not be public.

If Yuque virtualization returns incomplete text:

1. Click inside the spreadsheet body.
2. Make sure the target sheet tab is active.
3. Zoom out enough to expose the rows needed for that sheet.
4. Scroll through the sheet once so Yuque renders rows into the DOM.
5. Run the extractor again.
6. If still incomplete, copy the rendered sheet text manually and record the fallback in `docs/source-notes-YYYY-YYYY.md`.

## Annual Update Workflow

1. Create or update source notes under `docs/`.
2. Extract each official source sheet into `data/raw/`.
3. Add a new `SchoolYear` object in `src/data/schoolYears.ts`.
4. Preserve existing school years.
5. Add divisions separately: high, prep, junior.
6. Add term ranges and `focusMonths`.
7. Enter cycle days with their circled teaching-week number, for example `⑪D`.
8. Mark official non-cycle events with stable ids and categories.
9. Set `status: "partial-source"` only when the source is visibly incomplete.
10. Run the audit.
11. Build only when source or UI changes should ship.
12. Deploy only after the audit is clean enough for release.

## Data Accuracy Checklist

Run:

```bash
cd /Users/ylsuen/CF/calendar
npm run audit:data
```

The audit checks:

- valid `YYYY-MM-DD` dates
- end date not before start date
- dates inside the school-year range
- dates inside the term range
- cycle events have displayable circled teaching-week numbers
- A/B/C/D/E/F weekday alignment
- shifted A-F days are surfaced as warnings
- partial-source calendars are warned when latest captured event is before today

Warnings are not automatically wrong. A warning is acceptable when the source calendar intentionally shifts a cycle day because of a holiday, make-up workday, exam week, or partial visible source.

Before deployment, also do a human source check:

- compare every term start/end date with the official sheet
- compare holiday and exam multi-day ranges
- compare weekend dates, especially Saturday/Sunday make-up days
- compare all `①A` style cycle labels against the source sheet
- confirm source notes mention any partial source, guessed month-only event, or official "待定" wording

## Feeds

ICS subscription feeds are generated during `npm run build` into `public/feeds/`.

Current feeds:

- `2025-2026-high-all.ics`
- `2025-2026-prep-all.ics`
- `2025-2026-junior-all.ics`
- `2024-2025-junior-all.ics`

Feeds intentionally include important events and exclude daily cycle-only entries.

## Build And Deploy

Authenticate first:

```bash
cd /Users/ylsuen/CF/calendar
npx wrangler whoami
```

Validate:

```bash
npm run audit:data
npm run build
```

Deploy:

```bash
npm run deploy
```

Do not deploy `cal.bdfz.net` when only docs changed or when the user asked for audit only and the audit has no hard errors.

## Live Verification

After a calendar deployment:

```bash
curl -sSI https://cal.bdfz.net/
curl -sSI https://cal.bdfz.net/feeds/2025-2026-high-all.ics
curl -sS https://cal.bdfz.net/ | head
```

Open the site and verify:

- default month is the visitor terminal's current month
- month, overview, term, and year previews locate to current month
- subscription links are visible
- historical years remain selectable
- source/GitHub issue link is visible inside the calendar panel

## Navigation References

The shared BDFZ navigation payload is maintained outside this repo:

- `/Users/ylsuen/CF/bdfz-nav/sites.json`
- Cloudflare Pages project: `bdfz-nav`
- public asset: `https://nav.bdfz.net/sites.json`

The `i.rdfzer.com` homepage body is also maintained outside this repo:

- `/Users/ylsuen/CF/suen/allinone/index.html`
- Cloudflare Pages project: `allinone`

When replacing the old Yuque entry, use:

```text
label: 校曆
url: https://cal.bdfz.net/
```

## Rollback

For bad calendar data or UI:

```bash
cd /Users/ylsuen/CF/calendar
git revert <BAD_COMMIT>
npm run deploy
```

For bad Cloudflare Pages deployment without a repo revert, use the Cloudflare Pages deployment list and promote the previous successful deployment, then re-run the live verification commands.

For bad navigation links, restore the previous `sites.json` or `allinone/index.html`, redeploy only the affected Pages project, and verify the live HTML or JSON.
