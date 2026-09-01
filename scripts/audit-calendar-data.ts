import { SCHOOL_YEARS } from "../src/data/schoolYears";
import { displayEventTitle, getCycleInfo } from "../src/lib/calendar";
import type { CalendarEvent, SchoolYear, Term } from "../src/types";

const WEEKDAY_LABELS = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const today = (() => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();

type AuditFinding = {
  level: "error" | "warn";
  calendar: string;
  term?: string;
  eventId?: string;
  date: string;
  title: string;
  message: string;
};

const findings: AuditFinding[] = [];

const addFinding = (
  level: AuditFinding["level"],
  schoolYear: SchoolYear,
  term: Term,
  event: CalendarEvent,
  message: string
) => {
  findings.push({
    level,
    calendar: schoolYear.id,
    term: term.id,
    eventId: event.id,
    date: event.date,
    title: displayEventTitle(event),
    message
  });
};

const addCalendarFinding = (level: AuditFinding["level"], schoolYear: SchoolYear, date: string, message: string) => {
  findings.push({
    level,
    calendar: schoolYear.id,
    date,
    title: schoolYear.division,
    message
  });
};

const isValidDateText = (dateText: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return false;
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const weekdayOf = (dateText: string): number => {
  const [year, month, day] = dateText.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
};

const schoolYearBounds = (yearId: string): [string, string] => {
  const [startYear, endYear] = yearId.split("-").map(Number);
  return [`${startYear}-09-01`, `${endYear}-08-31`];
};

let eventCount = 0;
let cycleCount = 0;
let cycleWithDisplayCircle = 0;
let cycleUnnumberedCount = 0;
let cycleIrregularCount = 0;
const eventIds = new Set<string>();
const noticeIds = new Set<string>();

for (const schoolYear of SCHOOL_YEARS) {
  const [schoolYearStart, schoolYearEnd] = schoolYearBounds(schoolYear.yearId);
  let latestEventDate = "";

  for (const term of schoolYear.terms) {
    for (const notice of term.notices ?? []) {
      if (!notice.id.trim() || !notice.title.trim()) {
        addCalendarFinding("error", schoolYear, term.start, `学期待定事项缺少稳定 id 或标题（${term.id}）`);
      }
      if (noticeIds.has(notice.id)) {
        addCalendarFinding("error", schoolYear, term.start, `待定事项 id 重复：${notice.id}`);
      }
      noticeIds.add(notice.id);
    }

    for (const event of term.events) {
      eventCount += 1;
      if (eventIds.has(event.id)) addFinding("error", schoolYear, term, event, `事件 id 重复：${event.id}`);
      eventIds.add(event.id);
      const endDate = event.endDate ?? event.date;
      if (endDate > latestEventDate) latestEventDate = endDate;

      if (!isValidDateText(event.date)) {
        addFinding("error", schoolYear, term, event, "开始日期不是有效 YYYY-MM-DD");
        continue;
      }

      if (!isValidDateText(endDate)) {
        addFinding("error", schoolYear, term, event, "结束日期不是有效 YYYY-MM-DD");
        continue;
      }

      if (endDate < event.date) addFinding("error", schoolYear, term, event, "结束日期早于开始日期");
      if (event.date < schoolYearStart || endDate > schoolYearEnd) {
        addFinding("error", schoolYear, term, event, `日期超出 ${schoolYear.yearId} 学年范围`);
      }
      if (event.date < term.start || endDate > term.end) addFinding("error", schoolYear, term, event, "日期超出学期范围");

      const cycle = getCycleInfo(event);
      if (!cycle) continue;

      cycleCount += 1;
      if (cycle.circle) cycleWithDisplayCircle += 1;
      if (event.unnumberedCycle) cycleUnnumberedCount += 1;
      if (!cycle.circle && !event.unnumberedCycle) addFinding("error", schoolYear, term, event, "循环日显示缺少圈数字");
      if (cycle.circle && event.unnumberedCycle) addFinding("error", schoolYear, term, event, "原表无圈数字标记与显示圈数字冲突");
      if (cycle.irregular) {
        cycleIrregularCount += 1;
        addFinding(
          "warn",
          schoolYear,
          term,
          event,
          `${cycle.letter} 日在 ${WEEKDAY_LABELS[cycle.actualWeekday]}，常规对应 ${WEEKDAY_LABELS[cycle.expectedWeekday]}`
        );
      }
    }
  }

  if (schoolYear.status === "partial-source" && today >= schoolYearStart && today <= schoolYearEnd && latestEventDate && latestEventDate < today) {
    addCalendarFinding("warn", schoolYear, latestEventDate, `partial-source 最新事件早于今日 ${today}`);
  }
}

const errors = findings.filter((item) => item.level === "error");
const warnings = findings.filter((item) => item.level === "warn");

console.log(
  JSON.stringify(
    {
      calendars: SCHOOL_YEARS.length,
      events: eventCount,
      cycleEvents: cycleCount,
      cycleWithDisplayCircle,
      cycleUnnumberedCount,
      cycleIrregularCount,
      today,
      errors: errors.length,
      warnings: warnings.length,
      findings
    },
    null,
    2
  )
);

if (errors.length > 0) process.exit(1);
