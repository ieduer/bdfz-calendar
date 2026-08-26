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

/**
 * 课表（A–F）全部用同一抹绿——“在校上课日”的统一信号。
 * 字母本身区分循环日，颜色不再各自为政，避免整张日历变成彩虹。
 */
const SCHOOL_GREEN = "#5f9e84";

/**
 * 每个类别只用一种颜色（去掉原来按标题哈希随机选色的做法），
 * 并把语义分组拉开：绿=在校上课；暖陶土=假期/休息；玫红=考试；
 * 其余活动/仪式/统练等用克制的莫奈色，彼此可辨但不喧宾夺主。
 */
export const categoryMeta: Record<EventCategory, { label: string; className: string; color: string }> = {
  holiday: { label: "假期", className: "event-holiday", color: "#cf9173" },
  exam: { label: "考试", className: "event-exam", color: "#c06a82" },
  activity: { label: "活动", className: "event-activity", color: "#c9a76b" },
  sports: { label: "体育", className: "event-sports", color: "#6f8d9f" },
  ceremony: { label: "仪式", className: "event-ceremony", color: "#9079ab" },
  practice: { label: "统练/学科", className: "event-practice", color: "#5f86b3" },
  cleanup: { label: "扫除", className: "event-cleanup", color: "#9a8b72" },
  cycle: { label: "课表", className: "event-cycle", color: SCHOOL_GREEN },
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
  if (getCycleInfo(item)) return SCHOOL_GREEN;
  return categoryMeta[item.category].color;
};

export const eventClassNames = (item: CalendarEvent): string[] => {
  const cycle = getCycleInfo(item);
  return [
    categoryMeta[item.category].className,
    cycle ? `event-cycle-${cycle.letter.toLowerCase()}` : "",
    cycle?.irregular ? "event-cycle-irregular" : ""
  ].filter(Boolean);
};

export const importantEvents = (events: CalendarEvent[]): CalendarEvent[] =>
  events
    .filter((item) => item.category !== "cycle")
    .sort((a, b) => compareDateText(a.date, b.date));

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const int = Number.parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};

const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const deepen = (hex: string, ratio: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - ratio;
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
};

const readableText = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? deepen(hex, 0.58) : "#fffdf7";
};

export const toFullCalendarEvent = (item: CalendarEvent): EventInput => {
  const color = eventColor(item);
  const base: EventInput = {
    id: item.id,
    title: displayEventTitle(item),
    start: item.date,
    end: toExclusiveEnd(item.endDate),
    allDay: true,
    className: eventClassNames(item),
    extendedProps: {
      category: item.category,
      audience: item.audience,
      note: item.note
    }
  };

  if (item.category === "cycle") {
    return {
      ...base,
      backgroundColor: withAlpha(color, 0.13),
      borderColor: withAlpha(color, 0.5),
      textColor: deepen(color, 0.36)
    };
  }

  return {
    ...base,
    backgroundColor: color,
    borderColor: deepen(color, 0.12),
    textColor: readableText(color)
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
