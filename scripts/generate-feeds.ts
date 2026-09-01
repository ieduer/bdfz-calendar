import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { SCHOOL_YEARS } from "../src/data/schoolYears";
import { schoolYearToIcs } from "../src/lib/calendar";

const feedsDir = process.env.BDFZ_CALENDAR_FEEDS_DIR
  ? resolve(process.env.BDFZ_CALENDAR_FEEDS_DIR)
  : join(process.cwd(), "public", "feeds");

await mkdir(feedsDir, { recursive: true });

await Promise.all(
  SCHOOL_YEARS.map((schoolYear) =>
    writeFile(join(feedsDir, `${schoolYear.id}-all.ics`), schoolYearToIcs(schoolYear), "utf8")
  )
);
