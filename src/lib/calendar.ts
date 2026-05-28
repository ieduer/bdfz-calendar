import type { EventInput } from "@fullcalendar/core";
import type { CalendarEvent, EventCategory, SchoolYear, Term } from "../types";
import { compareDateText, toExclusiveEnd } from "./dates";

export const categoryMeta: Record<EventCategory, { label: string; className: string; color: string }> = {
  holiday: { label: "假期", className: "event-holiday", color: "#7ba398" },
  exam: { label: "考试", className: "event-exam", color: "#b8657f" },
  activity: { label: "活动", className: "event-activity", color: "#c9a76b" },
  sports: { label: "体育", className: "event-sports", color: "#6f8d9f" },
  ceremony: { label: "仪式", className: "event-ceremony", color: "#8f80a8" },
  practice: { label: "统练/学科", className: "event-practice", color: "#547f74" },
  cleanup: { label: "扫除", className: "event-cleanup", color: "#9a8b72" },
  cycle: { label: "课表", className: "event-cycle", color: "#8aa896" },
  note: { label: "备注", className: "event-note", color: "#7a8a92" }
};

export const importantEvents = (events: CalendarEvent[]): CalendarEvent[] =>
  events
    .filter((item) => item.category !== "cycle")
    .sort((a, b) => compareDateText(a.date, b.date));

export const toFullCalendarEvent = (item: CalendarEvent): EventInput => {
  const meta = categoryMeta[item.category];
  return {
    id: item.id,
    title: item.title,
    start: item.date,
    end: toExclusiveEnd(item.endDate),
    allDay: true,
    className: [meta.className],
    backgroundColor: meta.color,
    borderColor: meta.color,
    extendedProps: {
      category: item.category,
      audience: item.audience,
      note: item.note
    }
  };
};

export const upcomingEvents = (term: Term, today: string, max = 8): CalendarEvent[] => {
  const events = importantEvents(term.events);
  const future = events.filter((item) => (item.endDate ?? item.date) >= today);
  return (future.length > 0 ? future : events).slice(0, max);
};

export const termStats = (term: Term) => {
  const important = importantEvents(term.events);
  return {
    events: important.length,
    exams: important.filter((item) => item.category === "exam").length,
    holidays: important.filter((item) => item.category === "holiday").length,
    cycles: term.events.filter((item) => item.category === "cycle").length
  };
};

const buildIcs = (calendarName: string, events: CalendarEvent[]): string => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//bdfz-calendar//cal.bdfz.net//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`
  ];

  importantEvents(events).forEach((item) => {
    const start = item.date.replaceAll("-", "");
    const end = (item.endDate ? toExclusiveEnd(item.endDate) : toExclusiveEnd(item.date))?.replaceAll("-", "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@cal.bdfz.net`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcs(item.title)}`,
      item.audience ? `DESCRIPTION:${escapeIcs(item.audience)}` : "DESCRIPTION:",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
};

export const eventsToIcs = (term: Term): string => buildIcs(`北大附中校历 ${term.label}`, term.events);

export const schoolYearToIcs = (schoolYear: SchoolYear): string =>
  buildIcs(
    `北大附中校历 ${schoolYear.label} ${schoolYear.division}`,
    schoolYear.terms.flatMap((term) => term.events)
  );

const escapeIcs = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
