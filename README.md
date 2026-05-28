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
npm run build
```

`npm run build` regenerates `public/feeds/*-all.ics` before Vite builds.

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
2. Copy the rendered spreadsheet text for the relevant school division.
3. Add a new `SchoolYear` object in `src/data/schoolYears.ts`; do not replace or delete previous years.
4. Set `ACTIVE_SCHOOL_YEAR_ID` to the active dataset id.
5. Run `npm run build`.
6. Deploy to the same Pages project.

Keep historical years in the data file unless there is a clear reason to remove them.

Junior-division calendars come from `https://czpkuschool.pku.edu.cn/tzgg.htm`.
