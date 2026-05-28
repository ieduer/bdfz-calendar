# 北大附中校历

Production target: `https://cal.bdfz.net/`

This is a Cloudflare Pages site for the BDFZ school calendar. It uses:

- Vite 8
- React 19
- FullCalendar 6.1
- static ICS feeds under `public/feeds/`
- Cloudflare Pages direct upload

## Local development

```bash
npm --cache /Users/ylsuen/CF/.tmp/npm-cache install
npm run dev
```

## Validate

```bash
npm run audit:data
npm run build
```

`npm run audit:data` checks date ranges, cycle-day circled numbers, shifted A-E/F days, and partial-source freshness. `npm run build` regenerates `public/feeds/*-all.ics` before Vite builds.

Operational details, annual update rules, Yuque extraction, data audit policy, feed handling, deploy checks, and rollback are documented in `docs/MAINTENANCE_MANUAL.md`.

## Yuque extraction

Preferred path for logged-in Yuque sheets:

```bash
/bin/zsh scripts/extract-yuque-current-tab.zsh --browser chrome --sheet "25-26学年（预科部）" --out data/raw/yuque-2025-2026-prep.json
```

If Chrome blocks the extractor, enable:

```text
View -> Developer -> Allow JavaScript from Apple Events
```

The extractor reads only the active tab DOM through Apple Events. It does not read browser cookies, local storage, passwords, or profile databases. Keep raw extracts local unless reviewed.

## Deploy

```bash
npm run build
wrangler pages deploy dist --project-name bdfz-calendar
```

If the Pages project does not exist yet:

```bash
wrangler pages project create bdfz-calendar --production-branch main
wrangler pages deploy dist --project-name bdfz-calendar
```

Then bind `cal.bdfz.net` as a Pages custom domain and verify the live domain:

```bash
curl -I https://cal.bdfz.net/
curl -sS https://cal.bdfz.net/ | head
```

## Annual update workflow

1. Open the current Yuque calendar in Brave.
2. Run the Yuque extractor for each sheet tab, or copy the rendered spreadsheet text as fallback.
3. Review the raw extract under `data/raw/`.
4. Add a new `SchoolYear` object in `src/data/schoolYears.ts`; do not replace or delete previous years.
5. Set `ACTIVE_SCHOOL_YEAR_ID` to the active dataset id.
6. Run `npm run audit:data` and review warnings.
7. Run `npm run build`.
8. Deploy to the same Pages project.

Keep historical years in the data file unless there is a clear reason to remove them.

Junior-division calendars come from `https://czpkuschool.pku.edu.cn/tzgg.htm`.
