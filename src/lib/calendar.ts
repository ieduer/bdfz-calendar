import type { EventInput } from "@fullcalendar/core";
import type { CalendarEvent, EventCategory, SchoolYear, Term } from "../types";
import { compareDateText, toExclusiveEnd } from "./dates";

const ICS_DTSTAMP = "20260528T000000Z";
const CIRCLED_NUMBERS = [
  "⓪",
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
  "⑪",
  "⑫",
  "⑬",
  "⑭",
  "⑮",
  "⑯",
  "⑰",
  "⑱",
  "⑲",
  "⑳",
  "㉑",
  "㉒",
  "㉓",
  "㉔",
  "㉕",
  "㉖",
  "㉗",
  "㉘",
  "㉙",
  "㉚"
];
const CIRCLED_NUMBER_PATTERN = /[⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚]/;
const CYCLE_LETTER_PATTERN = /[A-F]/g;
const CYCLE_EXPECTED_WEEKDAY: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 };
const CYCLE_COLORS: Record<string, string> = {
  A: "#4f8f78",
  B: "#5f86b3",
  C: "#c59a4a",
  D: "#9375a6",
  E: "#b86f7d",
  F: "#7c8f61"
};

const CATEGORY_COLOR_VARIANTS: Record<EventCategory, string[]> = {
  holiday: ["#6f9f8d", "#86a968", "#6f98af", "#b58f54"],
  exam: ["#b8657f", "#9f6ca5", "#bf735f", "#7a78ad", "#b48548"],
  activity: ["#c9a76b", "#88a765", "#b98dba", "#d08d71", "#6f9ca8", "#a1a061"],
  sports: ["#6f8d9f", "#5d9a8b", "#7f7fb0", "#9f8b5e"],
  ceremony: ["#8f80a8", "#b07c8e", "#718aab", "#9c8b64"],
  practice: ["#547f74", "#6a8f55", "#4f789b", "#9a8052", "#7f74a4"],
  cleanup: ["#9a8b72", "#7d9483", "#9b7c73"],
  cycle: Object.values(CYCLE_COLORS),
  note: ["#7a8a92", "#88906f", "#8a7895", "#a08372"]
};

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

export type CycleInfo = {
  circle: string;
  letter: string;
  prefix: string;
  suffix: string;
  irregular: boolean;
  expectedWeekday: number;
  actualWeekday: number;
};

const hashText = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const weekdayOf = (dateText: string): number => {
  const [year, month, day] = dateText.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
};

const circleFromAudience = (audience?: string): string | undefined => {
  const week = Number(audience?.match(/教学周\s*(\d+)/)?.[1]);
  return Number.isFinite(week) ? CIRCLED_NUMBERS[week] ?? String(week) : undefined;
};

export const getCycleInfo = (item: CalendarEvent): CycleInfo | null => {
  if (item.category !== "cycle") return null;

  const matches = [...item.title.matchAll(CYCLE_LETTER_PATTERN)];
  const letterMatch = matches.at(-1);
  if (!letterMatch || letterMatch.index === undefined) return null;

  const letter = letterMatch[0];
  const expectedWeekday = CYCLE_EXPECTED_WEEKDAY[letter];
  const actualWeekday = weekdayOf(item.date);
  const rawPrefix = item.title.slice(0, letterMatch.index);
  const prefix = rawPrefix.replace(CIRCLED_NUMBER_PATTERN, "").trim();
  const suffix = item.title.slice(letterMatch.index + letter.length).trim();
  const circle = rawPrefix.match(CIRCLED_NUMBER_PATTERN)?.[0] ?? circleFromAudience(item.audience) ?? "";

  return {
    circle,
    letter,
    prefix,
    suffix,
    irregular: expectedWeekday !== actualWeekday,
    expectedWeekday,
    actualWeekday
  };
};

export const displayEventTitle = (item: CalendarEvent): string => {
  const cycle = getCycleInfo(item);
  if (!cycle) return item.title;
  return `${cycle.prefix}${cycle.circle}${cycle.letter}${cycle.suffix}`;
};

export const eventColor = (item: CalendarEvent): string => {
  const cycle = getCycleInfo(item);
  if (cycle) return CYCLE_COLORS[cycle.letter] ?? categoryMeta.cycle.color;

  const variants = CATEGORY_COLOR_VARIANTS[item.category] ?? [categoryMeta[item.category].color];
  return variants[hashText(`${item.category}:${item.title}`) % variants.length];
};

export const eventClassNames = (item: CalendarEvent): string[] => {
  const cycle = getCycleInfo(item);
  return [
    categoryMeta[item.category].className,
    `event-v-${hashText(`${item.category}:${item.title}`) % 8}`,
    cycle ? `event-cycle-${cycle.letter.toLowerCase()}` : "",
    cycle?.irregular ? "event-cycle-irregular" : ""
  ].filter(Boolean);
};

export const importantEvents = (events: CalendarEvent[]): CalendarEvent[] =>
  events
    .filter((item) => item.category !== "cycle")
    .sort((a, b) => compareDateText(a.date, b.date));

export const toFullCalendarEvent = (item: CalendarEvent): EventInput => {
  const color = eventColor(item);
  return {
    id: item.id,
    title: displayEventTitle(item),
    start: item.date,
    end: toExclusiveEnd(item.endDate),
    allDay: true,
    className: eventClassNames(item),
    backgroundColor: color,
    borderColor: color,
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
      `DTSTAMP:${ICS_DTSTAMP}`,
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
