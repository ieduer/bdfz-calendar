import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { CalendarApi, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { ArrowUpDown, CalendarDays, ExternalLink, Maximize2, Minimize2, Rss, Search, Sparkles } from "lucide-react";
import { ACTIVE_SCHOOL_YEAR_ID, SCHOOL_YEARS } from "./data/schoolYears";
import type { CalendarEvent, EventCategory, SchoolYear, Term, TermNotice } from "./types";
import {
  categoryMeta,
  displayEventTitle,
  eventClassNames,
  eventColor,
  getCycleInfo,
  importantEvents,
  termStats,
  toFullCalendarEvent,
  upcomingEvents
} from "./lib/calendar";
import { addDays, compareDateText, formatDate, formatRange, localTodayText } from "./lib/dates";
import { EventSheet } from "./components/EventSheet";
import "./styles.css";

type FullCalendarMode = "dayGridMonth" | "dayGridWeek";
type CalendarMode = FullCalendarMode | "overview" | "termPreview";
type PreviewScope = "term" | "year";
type MonthCell = { date?: string; day?: number; weekday?: number };
type WeekRangeSegment = {
  event: CalendarEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const GITHUB_ISSUE_URL = "https://github.com/ieduer/bdfz-calendar/issues/new";
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const MOBILE_QUERY = "(max-width: 720px)";

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches));
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
};

const yearOptions = Array.from(new Map(SCHOOL_YEARS.map((item) => [item.yearId, item.label])).entries()).sort((a, b) =>
  b[0].localeCompare(a[0])
);

const findCalendar = (calendarId: string) =>
  SCHOOL_YEARS.find((item) => item.id === calendarId) ?? SCHOOL_YEARS.find((item) => item.id === ACTIVE_SCHOOL_YEAR_ID) ?? SCHOOL_YEARS[0];

const getOrigin = () => (typeof window === "undefined" ? "https://cal.bdfz.net" : window.location.origin);
const isFullCalendarMode = (mode: CalendarMode): mode is FullCalendarMode => mode === "dayGridMonth" || mode === "dayGridWeek";
const dateInRange = (date: string, start: string, end: string): boolean => date >= start && date <= end;
const fcDateText = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const preferredTermId = (schoolYear: SchoolYear, date: string): Term["id"] =>
  schoolYear.terms.find((item) => dateInRange(date, item.start, item.end))?.id ?? schoolYear.activeTermId;

const monthRange = (start: string, end: string): string[] => {
  const months: string[] = [];
  const current = new Date(`${start.slice(0, 7)}-01T00:00:00`);
  const last = new Date(`${end.slice(0, 7)}-01T00:00:00`);

  while (current <= last) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

const schoolYearMonths = (schoolYear: SchoolYear): string[] => {
  const starts = schoolYear.terms.map((item) => item.start).sort();
  const ends = schoolYear.terms.map((item) => item.end).sort();
  return starts[0] && ends[ends.length - 1] ? monthRange(starts[0], ends[ends.length - 1]) : [];
};

const monthLabel = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year}年${monthNumber}月`;
};

const buildMonthCells = (month: string): MonthCell[] => {
  const [year, monthNumber] = month.split("-").map(Number);
  const leading = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const cells: MonthCell[] = Array.from({ length: leading }, () => ({}));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    cells.push({ date, day, weekday: ((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1 });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  return trailing ? [...cells, ...Array.from({ length: trailing }, () => ({}))] : cells;
};

const buildEventsByDate = (events: CalendarEvent[]): Map<string, CalendarEvent[]> => {
  const buckets = new Map<string, CalendarEvent[]>();

  events.forEach((item) => {
    let date = item.date;
    const last = item.endDate ?? item.date;
    while (date <= last) {
      buckets.set(date, [...(buckets.get(date) ?? []), item]);
      date = addDays(date, 1);
    }
  });

  return buckets;
};

const isMultiDayEvent = (item: CalendarEvent): boolean => Boolean(item.endDate && item.endDate > item.date);

const buildSingleDayEventsByDate = (events: CalendarEvent[]): Map<string, CalendarEvent[]> => {
  const buckets = new Map<string, CalendarEvent[]>();

  events.forEach((item) => {
    if (isMultiDayEvent(item)) return;
    buckets.set(item.date, [...(buckets.get(item.date) ?? []), item]);
  });

  return buckets;
};

const chunkWeeks = (cells: MonthCell[]): MonthCell[][] => {
  const weeks: MonthCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
};

const monthName = (month: string): string => `${Number(month.slice(5, 7))}月`;

const sheetDateLabel = (cell: MonthCell): string => {
  if (!cell.date || !cell.day) return "";
  return cell.day === 1 ? `${Number(cell.date.slice(5, 7))}月1日` : `${cell.day}.`;
};

const countMonthEvents = (month: string, eventsByDate: Map<string, CalendarEvent[]>): number => {
  const ids = new Set<string>();
  Array.from(eventsByDate.entries()).forEach(([date, items]) => {
    if (date.startsWith(month)) items.forEach((item) => ids.add(item.id));
  });
  return ids.size;
};

const sortDayEvents = (items: CalendarEvent[]): CalendarEvent[] =>
  [...items].sort((a, b) => Number(a.category === "cycle") - Number(b.category === "cycle") || displayEventTitle(a).localeCompare(displayEventTitle(b)));

type EventAccentStyle = CSSProperties & { "--event-accent": string };
type RangeLaneStyle = CSSProperties & { "--range-lanes": number };

const eventAccentStyle = (event: CalendarEvent): EventAccentStyle => ({
  "--event-accent": eventColor(event)
});

const buildWeekRangeSegments = (week: MonthCell[], events: CalendarEvent[]): WeekRangeSegment[] => {
  const datedCells = week.filter((cell): cell is MonthCell & { date: string } => Boolean(cell.date));
  const firstDate = datedCells[0]?.date;
  const lastDate = datedCells[datedCells.length - 1]?.date;
  if (!firstDate || !lastDate) return [];

  const segments = events
    .filter((event) => isMultiDayEvent(event) && event.date <= lastDate && (event.endDate ?? event.date) >= firstDate)
    .map((event) => {
      const startDate = event.date > firstDate ? event.date : firstDate;
      const endDate = (event.endDate ?? event.date) < lastDate ? event.endDate ?? event.date : lastDate;
      return {
        event,
        startIndex: week.findIndex((cell) => cell.date === startDate),
        endIndex: week.findIndex((cell) => cell.date === endDate),
        lane: 0,
        continuesBefore: event.date < startDate,
        continuesAfter: Boolean(event.endDate && event.endDate > endDate)
      };
    })
    .filter((segment) => segment.startIndex >= 0 && segment.endIndex >= segment.startIndex)
    .sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex || displayEventTitle(a.event).localeCompare(displayEventTitle(b.event)));

  const laneEnds: number[] = [];
  segments.forEach((segment) => {
    const lane = laneEnds.findIndex((endIndex) => segment.startIndex > endIndex);
    const nextLane = lane === -1 ? laneEnds.length : lane;
    segment.lane = nextLane;
    laneEnds[nextLane] = segment.endIndex;
  });

  return segments;
};

const CATEGORY_ORDER: EventCategory[] = ["cycle", "exam", "holiday", "activity", "sports", "ceremony", "practice", "cleanup", "note"];

function Legend({ events }: { events: CalendarEvent[] }) {
  const presentCategories = new Set(events.map((item) => item.category));
  const legendItems = CATEGORY_ORDER.filter((category) => presentCategories.has(category)).map((category) => ({
    category,
    ...categoryMeta[category]
  }));

  return (
    <div className="legend" aria-label="事件分类图例：课表为浅色标签，其他类别为实色">
      {legendItems.map((item) => (
        <span
          key={item.category}
          className={`legend-item ${item.category === "cycle" ? "is-tag" : "is-solid"}`}
          style={{ "--event-accent": item.color } as EventAccentStyle}
        >
          <span className="legend-swatch" aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

type FullscreenToggleProps = {
  expanded: boolean;
  onToggle: () => void;
};

function FullscreenToggle({ expanded, onToggle }: FullscreenToggleProps) {
  return (
    <button
      type="button"
      className="fs-toggle"
      onClick={onToggle}
      aria-pressed={expanded}
      aria-label={expanded ? "退出全屏" : "全屏显示"}
      title={expanded ? "退出全屏" : "全屏"}
    >
      {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );
}

type PanelLinksProps = {
  sourceUrl: string;
  events: CalendarEvent[];
};

function PanelLinks({ sourceUrl, events }: PanelLinksProps) {
  return (
    <div className="panel-links">
      <Legend events={events} />
      <div className="panel-link-group">
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          数据源
        </a>
        <a href={GITHUB_ISSUE_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          官方改动？提交 GitHub issue
        </a>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: EventCategory }) {
  const meta = categoryMeta[category];
  return (
    <span className="event-kind" style={{ "--event-accent": meta.color } as EventAccentStyle}>
      {meta.label}
    </span>
  );
}

function PendingNotices({ notices }: { notices: TermNotice[] }) {
  if (notices.length === 0) return null;

  return (
    <div className="upcoming-block pending-block">
      <div className="block-title">
        <CalendarDays size={16} />
        日期待定
      </div>
      <ul className="pending-list">
        {notices.map((notice) => (
          <li key={notice.id} style={{ "--event-accent": categoryMeta[notice.category].color } as EventAccentStyle}>
            <span className="pending-accent" aria-hidden="true" />
            <span>
              <strong>{notice.title}</strong>
              <small>{[categoryMeta[notice.category].label, notice.audience, notice.note].filter(Boolean).join(" · ")}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SheetEventChipProps = {
  event: CalendarEvent;
  compact?: boolean;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetEventChip({ event, compact = false, onJumpToEvent }: SheetEventChipProps) {
  const eventClasses = eventClassNames(event);
  const className = [
    "sheet-event-chip",
    `sheet-category-${event.category}`,
    event.category === "cycle" ? "is-cycle" : "",
    eventClasses.includes("event-cycle-irregular") ? "is-irregular" : "",
    compact ? "compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} style={eventAccentStyle(event)} onClick={() => onJumpToEvent(event)}>
      <span className="sheet-event-dot" aria-hidden="true" />
      <span>{displayEventTitle(event)}</span>
    </button>
  );
}

type SheetRangeChipProps = {
  segment: WeekRangeSegment;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetRangeChip({ segment, onJumpToEvent }: SheetRangeChipProps) {
  const event = segment.event;
  const eventClasses = eventClassNames(event);
  const className = [
    "sheet-range-chip",
    `sheet-category-${event.category}`,
    event.category === "cycle" ? "is-cycle" : "",
    eventClasses.includes("event-cycle-irregular") ? "is-irregular" : "",
    segment.continuesBefore ? "continues-before" : "",
    segment.continuesAfter ? "continues-after" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const style = {
    ...eventAccentStyle(event),
    gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}`,
    gridRow: String(segment.lane + 1)
  } as EventAccentStyle & CSSProperties;

  return (
    <button
      type="button"
      className={className}
      style={style}
      title={`${displayEventTitle(event)} · ${formatRange(event.date, event.endDate)}`}
      onClick={() => onJumpToEvent(event)}
    >
      <span>{displayEventTitle(event)}</span>
    </button>
  );
}

type SheetDayCellProps = {
  cell: MonthCell;
  eventsByDate: Map<string, CalendarEvent[]>;
  stateEventsByDate: Map<string, CalendarEvent[]>;
  isFirstWeek?: boolean;
  today: string;
  mobile?: boolean;
  onSelectDay: (date: string) => void;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetDayCell({ cell, eventsByDate, stateEventsByDate, isFirstWeek = false, today, mobile = false, onSelectDay, onJumpToEvent }: SheetDayCellProps) {
  if (!cell.date) return <div className="sheet-day-cell empty" aria-hidden="true" />;
  const date = cell.date;

  const dayEvents = sortDayEvents(eventsByDate.get(date) ?? []);
  const stateEvents = sortDayEvents(stateEventsByDate.get(date) ?? dayEvents);
  const hasCycle = stateEvents.some((event) => event.category === "cycle");
  const hasHoliday = stateEvents.some((event) => event.category === "holiday");
  const hasActivity = stateEvents.some((event) => event.category !== "cycle" && event.category !== "holiday");
  const isToday = date === today;
  const countForState = mobile ? stateEvents.length : dayEvents.length;
  const className = [
    "sheet-day-cell",
    isFirstWeek ? "is-first-week" : "",
    countForState > 0 ? "has-events" : "",
    hasCycle ? "has-class" : "",
    hasHoliday ? "is-rest" : "",
    hasActivity ? "has-activity" : "",
    isToday ? "is-today" : "",
    cell.weekday === 6 ? "is-saturday" : "",
    cell.weekday === 7 ? "is-sunday" : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (mobile) {
    const cycleEvents = stateEvents.filter((event) => event.category === "cycle");
    const otherEvents = stateEvents.filter((event) => event.category !== "cycle");
    const hasEvents = stateEvents.length > 0;
    const ariaLabel = `${isToday ? "今天 " : ""}${date}${hasEvents ? `，${stateEvents.length}项：${stateEvents.map(displayEventTitle).join("、")}` : "，无事项"}`;
    const inner = (
      <>
        <span className="sheet-date-number">{cell.day}</span>
        <span className="sheet-indicators" aria-hidden="true">
          {cycleEvents.map((event) => (
            <span key={`${date}-${event.id}`} className="sheet-cycle-tag" style={eventAccentStyle(event)}>
              {getCycleInfo(event)?.letter ?? "·"}
            </span>
          ))}
          {otherEvents.slice(0, 3).map((event) => (
            <span key={`${date}-${event.id}`} className="sheet-ind-dot" style={{ backgroundColor: eventColor(event) }} />
          ))}
          {otherEvents.length > 3 ? <span className="sheet-ind-more">+{otherEvents.length - 3}</span> : null}
        </span>
      </>
    );
    return hasEvents ? (
      <button type="button" className={`${className} is-mobile`} aria-label={ariaLabel} onClick={() => onSelectDay(date)}>
        {inner}
      </button>
    ) : (
      <div className={`${className} is-mobile`} aria-label={ariaLabel}>
        {inner}
      </div>
    );
  }

  return (
    <div
      className={className}
      aria-label={`${isToday ? "今天 " : ""}${date}${dayEvents.length ? ` ${dayEvents.map(displayEventTitle).join(" ")}` : ""}`}
    >
      <div className="sheet-day-head">
        <span className="sheet-date-number">{sheetDateLabel(cell)}</span>
        {isToday ? <span className="sheet-today-flag">今天</span> : null}
      </div>
      <div className="sheet-day-events">
        {dayEvents.map((event) => (
          <SheetEventChip key={`${date}-${event.id}`} event={event} compact onJumpToEvent={onJumpToEvent} />
        ))}
      </div>
    </div>
  );
}

type SheetMonthProps = {
  month: string;
  eventsByDate: Map<string, CalendarEvent[]>;
  stateEventsByDate: Map<string, CalendarEvent[]>;
  rangeEvents: CalendarEvent[];
  today: string;
  mobile?: boolean;
  onSelectDay: (date: string) => void;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetMonth({ month, eventsByDate, stateEventsByDate, rangeEvents, today, mobile = false, onSelectDay, onJumpToEvent }: SheetMonthProps) {
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const weeks = useMemo(() => chunkWeeks(cells), [cells]);
  const eventCount = countMonthEvents(month, stateEventsByDate);
  const rangeSegmentsByWeek = useMemo(
    () => (mobile ? [] : weeks.map((week) => buildWeekRangeSegments(week, rangeEvents))),
    [weeks, rangeEvents, mobile]
  );

  return (
    <section className="sheet-month" data-month={month} aria-label={`${monthLabel(month)}预览`}>
      <div className="sheet-month-title">
        <strong>{monthLabel(month)}</strong>
        <span>{eventCount > 0 ? `${eventCount}项` : ""}</span>
      </div>
      <div className="sheet-month-label" style={{ gridRow: `span ${weeks.length}` }}>
        {monthName(month)}
      </div>
      <div className="sheet-month-weeks">
        {weeks.map((week, weekIndex) => {
          const segments = rangeSegmentsByWeek[weekIndex] ?? [];
          const laneCount = segments.reduce((max, segment) => Math.max(max, segment.lane + 1), 0);
          return (
            <div key={`${month}-week-${weekIndex}`} className="sheet-week-row" style={{ "--range-lanes": laneCount } as RangeLaneStyle}>
              {week.map((cell, cellIndex) => (
                <SheetDayCell
                  key={cell.date ?? `pad-${month}-${weekIndex}-${cellIndex}`}
                  cell={cell}
                  eventsByDate={eventsByDate}
                  stateEventsByDate={stateEventsByDate}
                  isFirstWeek={weekIndex === 0}
                  today={today}
                  mobile={mobile}
                  onSelectDay={onSelectDay}
                  onJumpToEvent={onJumpToEvent}
                />
              ))}
              {segments.length > 0 ? (
                <div className="sheet-range-layer">
                  {segments.map((segment) => (
                    <SheetRangeChip
                      key={`${segment.event.id}-${weekIndex}-${segment.startIndex}-${segment.endIndex}`}
                      segment={segment}
                      onJumpToEvent={onJumpToEvent}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type DaySheetProps = {
  date: string | null;
  events: CalendarEvent[];
  onClose: () => void;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function DaySheet({ date, events, onClose, onJumpToEvent }: DaySheetProps) {
  if (!date) return null;
  return (
    <div className="event-sheet day-sheet" role="dialog" aria-modal="true" aria-label={`${date} 事项`}>
      <button className="sheet-scrim" type="button" aria-label="关闭" onClick={onClose} />
      <section className="sheet-panel">
        <button className="sheet-close" type="button" onClick={onClose}>
          关闭
        </button>
        <p className="sheet-category">{events.length} 项事项</p>
        <h2>{formatDate(date)}</h2>
        <ol className="event-list day-sheet-list">
          {events.length > 0 ? (
            events.map((event) => (
              <li key={event.id}>
                <button type="button" onClick={() => onJumpToEvent(event)}>
                  <span className={`dot ${eventClassNames(event).join(" ")}`} style={{ backgroundColor: eventColor(event) }} />
                  <span>
                    <strong>{displayEventTitle(event)}</strong>
                    <small>
                      {categoryMeta[event.category].label}
                      {event.endDate && event.endDate !== event.date ? ` · ${formatRange(event.date, event.endDate)}` : ""}
                      {event.audience ? ` · ${event.audience}` : ""}
                    </small>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="empty-row">无事项</li>
          )}
        </ol>
      </section>
    </div>
  );
}

type PreviewPanelProps = {
  title: string;
  subtitle: string;
  months: string[];
  events: CalendarEvent[];
  today: string;
  focusMonth: string;
  sourceUrl: string;
  emptyText: string;
  expanded: boolean;
  scope: PreviewScope;
  mobile: boolean;
  onScopeChange: (scope: PreviewScope) => void;
  onToggleFullscreen: () => void;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function PreviewPanel({
  title,
  subtitle,
  months,
  events,
  today,
  focusMonth,
  sourceUrl,
  emptyText,
  expanded,
  scope,
  mobile,
  onScopeChange,
  onToggleFullscreen,
  onJumpToEvent
}: PreviewPanelProps) {
  const sheetScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const stateEventsByDate = useMemo(() => buildEventsByDate(events), [events]);
  const eventsByDate = useMemo(() => buildSingleDayEventsByDate(events), [events]);
  const rangeEvents = useMemo(() => events.filter(isMultiDayEvent), [events]);
  const selectedDayEvents = useMemo(
    () => (selectedDate ? sortDayEvents(stateEventsByDate.get(selectedDate) ?? []) : []),
    [selectedDate, stateEventsByDate]
  );

  useEffect(() => {
    if (!mobile) setSelectedDate(null);
  }, [mobile]);

  useEffect(() => {
    const scroller = sheetScrollRef.current;
    if (!scroller) return;

    const targetMonth = months.includes(focusMonth) ? focusMonth : months[0];
    if (!targetMonth) return;

    const target = scroller.querySelector<HTMLElement>(`[data-month="${targetMonth}"]`);
    if (!target) return;

    scroller.scrollTo({
      top: Math.max(target.offsetTop - scroller.offsetTop - 38, 0),
      behavior: "auto"
    });
  }, [focusMonth, months]);

  return (
    <section className={`preview-panel sheet-preview-panel ${expanded ? "is-fullscreen" : ""}`} aria-label={title}>
      <div className="section-heading">
        <div>
          <p>{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div className="panel-heading-controls">
          <div className="scope-switch" role="group" aria-label="预览范围">
            <button type="button" className={scope === "term" ? "active" : ""} onClick={() => onScopeChange("term")}>
              本学期
            </button>
            <button type="button" className={scope === "year" ? "active" : ""} onClick={() => onScopeChange("year")}>
              全年
            </button>
          </div>
          <FullscreenToggle expanded={expanded} onToggle={onToggleFullscreen} />
        </div>
      </div>
      {months.length > 0 ? (
        <div className="sheet-scroll" ref={sheetScrollRef}>
          <div className="sheet-week sheet-week-header" aria-hidden="true">
            <span>月</span>
            {WEEKDAYS.map((day) => (
              <span key={day}>周{day}</span>
            ))}
          </div>
          {months.map((month) => (
            <SheetMonth
              key={month}
              month={month}
              eventsByDate={eventsByDate}
              stateEventsByDate={stateEventsByDate}
              rangeEvents={rangeEvents}
              today={today}
              mobile={mobile}
              onSelectDay={setSelectedDate}
              onJumpToEvent={onJumpToEvent}
            />
          ))}
        </div>
      ) : (
        <p className="empty-panel">{emptyText}</p>
      )}
      <PanelLinks sourceUrl={sourceUrl} events={events} />
      <DaySheet
        date={selectedDate}
        events={selectedDayEvents}
        onClose={() => setSelectedDate(null)}
        onJumpToEvent={(event) => {
          setSelectedDate(null);
          onJumpToEvent(event);
        }}
      />
    </section>
  );
}

export default function App() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarPanelRef = useRef<HTMLDivElement | null>(null);
  const overviewScrollRef = useRef<HTMLDivElement | null>(null);
  const initialSchoolYear = findCalendar(ACTIVE_SCHOOL_YEAR_ID);
  const [calendarId, setCalendarId] = useState(ACTIVE_SCHOOL_YEAR_ID);
  const [termId, setTermId] = useState<Term["id"]>(() => preferredTermId(initialSchoolYear, localTodayText()));
  const [mode, setMode] = useState<CalendarMode>("termPreview");
  const [previewScope, setPreviewScope] = useState<PreviewScope>("term");
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [pendingJump, setPendingJump] = useState<CalendarEvent | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [rangeTitle, setRangeTitle] = useState("");
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(() => (typeof window === "undefined" ? true : !window.matchMedia(MOBILE_QUERY).matches));
  const highlightTimeoutRef = useRef<number | undefined>(undefined);
  const toggleFullscreen = () => setExpanded((value) => !value);

  const schoolYear = findCalendar(calendarId);
  const divisionsForYear = SCHOOL_YEARS.filter((item) => item.yearId === schoolYear.yearId);
  const term = schoolYear.terms.find((item) => item.id === termId) ?? schoolYear.terms[0];
  const stats = useMemo(() => termStats(term), [term]);
  const today = localTodayText();
  const defaultFocusDate = dateInRange(today, term.start, term.end) ? today : term.start;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    setTermId(preferredTermId(schoolYear, today));
  }, [schoolYear.id, today]);

  const matchesFilters = (item: CalendarEvent) => {
    const haystack = `${item.title} ${displayEventTitle(item)} ${item.audience ?? ""} ${categoryMeta[item.category].label}`.toLowerCase();
    return !normalizedQuery || haystack.includes(normalizedQuery);
  };

  const eventById = useMemo(() => new Map(term.events.map((item) => [item.id, item])), [term.events]);

  const filteredEvents = useMemo(() => term.events.filter(matchesFilters), [normalizedQuery, term.events]);
  const calendarEvents = useMemo(
    () =>
      filteredEvents.map((item) => {
        const eventInput = toFullCalendarEvent(item);
        if (item.id === highlightedEventId) {
          const classes = eventInput.className;
          if (Array.isArray(classes)) {
            eventInput.className = [...classes, "event-jump-highlight"];
          } else {
            eventInput.className = classes ? [classes, "event-jump-highlight"] : ["event-jump-highlight"];
          }
        }
        return eventInput;
      }),
    [filteredEvents, highlightedEventId]
  );
  const termPreviewEvents = filteredEvents;
  const { classDates, activityDates, restDates } = useMemo(() => {
    const classSet = new Set<string>();
    const activitySet = new Set<string>();
    const restSet = new Set<string>();
    filteredEvents.forEach((item) => {
      let date = item.date;
      const last = item.endDate ?? item.date;
      while (date <= last) {
        if (item.category === "cycle") classSet.add(date);
        else if (item.category === "holiday") restSet.add(date);
        else activitySet.add(date);
        date = addDays(date, 1);
      }
    });
    return { classDates: classSet, activityDates: activitySet, restDates: restSet };
  }, [filteredEvents]);
  const dayCellClassNames = (arg: { date: Date }): string[] => {
    const date = fcDateText(arg.date);
    return [
      classDates.has(date) ? "has-class" : "",
      restDates.has(date) ? "is-rest" : "",
      activityDates.has(date) ? "has-activity" : ""
    ].filter(Boolean);
  };
  const nextEvents = useMemo(() => upcomingEvents(term, today, 7), [term, today]);
  const todayEvents = useMemo(
    () =>
      term.events
        .filter((item) => item.date <= today && (item.endDate ?? item.date) >= today)
        .sort((a, b) => Number(a.category === "cycle") - Number(b.category === "cycle") || displayEventTitle(a).localeCompare(displayEventTitle(b))),
    [term.events, today]
  );

  const allYearEvents = useMemo(
    () => schoolYear.terms.flatMap((item) => item.events).sort((a, b) => compareDateText(a.date, b.date)),
    [schoolYear]
  );
  const yearEvents = useMemo(
    () => importantEvents(allYearEvents),
    [allYearEvents]
  );
  const filteredYearEvents = useMemo(() => yearEvents.filter(matchesFilters), [normalizedQuery, yearEvents]);
  const filteredAllYearEvents = useMemo(() => allYearEvents.filter(matchesFilters), [allYearEvents, normalizedQuery]);
  const yearPreviewEvents = filteredAllYearEvents;
  const termMonths = useMemo(() => monthRange(term.start, term.end), [term.start, term.end]);
  const fullYearMonths = useMemo(() => schoolYearMonths(schoolYear), [schoolYear]);
  const todayMonth = today.slice(0, 7);
  const termPreviewFocusMonth = termMonths.includes(todayMonth) ? todayMonth : defaultFocusDate.slice(0, 7);
  const yearPreviewFocusMonth = fullYearMonths.includes(todayMonth) ? todayMonth : fullYearMonths[0] ?? todayMonth;
  const overviewStats = useMemo(
    () => ({
      events: yearEvents.length,
      exams: yearEvents.filter((item) => item.category === "exam").length,
      holidays: yearEvents.filter((item) => item.category === "holiday").length,
      activities: yearEvents.filter((item) => item.category === "activity" || item.category === "ceremony").length,
      notices: schoolYear.terms.reduce((count, item) => count + (item.notices?.length ?? 0), 0)
    }),
    [schoolYear.terms, yearEvents]
  );
  const overviewMonths = useMemo(() => {
    const buckets = new Map<string, CalendarEvent[]>();
    filteredYearEvents.forEach((item) => {
      const month = item.date.slice(0, 7);
      buckets.set(month, [...(buckets.get(month) ?? []), item]);
    });
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredYearEvents]);
  const isYearScope = mode === "overview" || (mode === "termPreview" && previewScope === "year");
  const displayStats = isYearScope ? overviewStats : stats;
  const overviewFocusMonth = overviewMonths.some(([month]) => month === todayMonth) ? todayMonth : overviewMonths[0]?.[0] ?? todayMonth;

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || !isFullCalendarMode(mode)) return;
    api.changeView(mode);
  }, [mode]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || !isFullCalendarMode(mode)) return;
    api.gotoDate(defaultFocusDate);
  }, [defaultFocusDate, mode]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    const firstMatch = filteredEvents.find((item) => item.category !== "cycle") ?? filteredEvents[0];
    if (!api || !isFullCalendarMode(mode) || !firstMatch || !query.trim()) return;
    api.gotoDate(firstMatch.date);
  }, [filteredEvents, mode, query]);

  useEffect(() => {
    if (mode !== "overview") return;

    const frame = window.requestAnimationFrame(() => {
      const scroller = overviewScrollRef.current;
      if (!scroller) return;

      const target = scroller.querySelector<HTMLElement>(`[data-month="${overviewFocusMonth}"]`);
      if (!target) return;

      scroller.scrollTo({
        top: Math.max(target.offsetTop - scroller.offsetTop - 6, 0),
        behavior: "auto"
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, overviewFocusMonth, overviewMonths]);

  useEffect(() => {
    if (!isFullCalendarMode(mode)) return;

    let frame = 0;
    const applyRowHeight = () => {
      const panel = calendarPanelRef.current;
      const grid = panel?.querySelector<HTMLElement>(".fc");
      if (!panel || !grid) return;

      const isWeek = mode === "dayGridWeek";
      const dayCells = panel.querySelectorAll(".fc-daygrid-day").length;
      const rows = dayCells > 0 ? dayCells / 7 : isWeek ? 1 : 6;
      const header = panel.querySelector<HTMLElement>(".fc-col-header")?.offsetHeight ?? 38;
      const links = panel.querySelector<HTMLElement>(".panel-links")?.offsetHeight ?? 0;
      const paddingBottom = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
      // 移动端底部有固定的视图切换栏，给它留出空间，避免最后一行被盖住
      const bottomReserve = window.matchMedia(MOBILE_QUERY).matches ? 84 : 0;
      const available = window.innerHeight - grid.getBoundingClientRect().top - header - links - paddingBottom - bottomReserve - 18;
      // 周历只有一行：给一个舒适且封顶的高度，避免单行撑满整个视口显得空旷
      const perRow = isWeek
        ? Math.min(Math.max(Math.floor(available), 240), 460)
        : Math.max(Math.floor(available / rows), 78);
      panel.style.setProperty("--fc-row-min", `${perRow}px`);
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyRowHeight);
    };

    schedule();
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [mode, rangeTitle, term.id, expanded]);

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (!pendingJump || !isFullCalendarMode(mode)) return;

    const frame = window.requestAnimationFrame(() => {
      const api = calendarRef.current?.getApi();
      if (!api) return;

      api.changeView("dayGridMonth");
      api.gotoDate(pendingJump.date);
      document.querySelector(".calendar-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
      setHighlightedEventId(pendingJump.id);
      setPendingJump(null);

      if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedEventId(null);
        highlightTimeoutRef.current = undefined;
      }, 2600);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, pendingJump]);

  useEffect(() => {
    setExpanded(mode === "termPreview" && !isMobile);
  }, [mode, isMobile]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  useEffect(() => {
    if (!isFullCalendarMode(mode)) return;
    const panel = calendarPanelRef.current;
    const grid = panel?.querySelector<HTMLElement>(".fc");
    if (!panel || !grid) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let claimed = false;
    let locked = false;
    let flipTimer = 0;

    const flip = (direction: 1 | -1) => {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      panel.classList.remove("flip-next", "flip-prev");
      void panel.offsetWidth;
      panel.classList.add(direction > 0 ? "flip-next" : "flip-prev");
      if (direction > 0) api.next();
      else api.prev();
      window.clearTimeout(flipTimer);
      flipTimer = window.setTimeout(() => panel.classList.remove("flip-next", "flip-prev"), 360);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      tracking = true;
      claimed = false;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!claimed && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.2) claimed = true;
      // 一旦确认是竖向手势，就接管它（阻止页面滚动与翻月相互打架）
      if (claimed && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!claimed) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) flip(dy < 0 ? 1 : -1);
    };
    const onWheel = (event: WheelEvent) => {
      if (locked) return;
      if (Math.abs(event.deltaY) < 28 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      flip(event.deltaY > 0 ? 1 : -1);
      locked = true;
      window.setTimeout(() => {
        locked = false;
      }, 560);
    };

    grid.addEventListener("touchstart", onTouchStart, { passive: true });
    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    grid.addEventListener("touchend", onTouchEnd, { passive: true });
    grid.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(flipTimer);
      grid.removeEventListener("touchstart", onTouchStart);
      grid.removeEventListener("touchmove", onTouchMove);
      grid.removeEventListener("touchend", onTouchEnd);
      grid.removeEventListener("wheel", onWheel);
    };
  }, [mode, term.id, expanded]);

  const calendarApi = (): CalendarApi | undefined => calendarRef.current?.getApi();

  const handleEventClick = (click: EventClickArg) => {
    const item = eventById.get(click.event.id);
    if (item) setSelectedEvent(item);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setRangeTitle(arg.view.title);
  };

  const jumpToEvent = (item: CalendarEvent) => {
    const nextTerm =
      schoolYear.terms.find((candidate) => candidate.events.some((event) => event.id === item.id)) ??
      schoolYear.terms.find((candidate) => dateInRange(item.date, candidate.start, candidate.end));

    if (nextTerm && nextTerm.id !== term.id) setTermId(nextTerm.id);
    if (!matchesFilters(item)) {
      setQuery("");
    }

    setSelectedEvent(null);
    setMode("dayGridMonth");
    setPendingJump(item);
  };

  const switchYear = (yearId: string) => {
    const next = SCHOOL_YEARS.find((item) => item.yearId === yearId && item.divisionId === schoolYear.divisionId) ?? SCHOOL_YEARS.find((item) => item.yearId === yearId);
    if (next) setCalendarId(next.id);
  };

  const switchDivision = (divisionId: string) => {
    const next = SCHOOL_YEARS.find((item) => item.yearId === schoolYear.yearId && item.divisionId === divisionId);
    if (next) setCalendarId(next.id);
  };

  const feedUrl = `${getOrigin()}/feeds/${schoolYear.id}-all.ics`;
  const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
  const emptyText = schoolYear.status === "pending-source" ? "待补录" : "没有匹配事件";

  return (
    <main className={`page-shell ${isFullCalendarMode(mode) ? "month-page" : ""}`}>
      <div className="watercolor-bg" aria-hidden="true" />
      <header className="masthead">
        <div className="masthead-top">
          <a className="brand" href="/" aria-label="校历首页">
            <span className="brand-mark" aria-hidden="true">
              <img src="/bdfz.png" alt="" />
            </span>
            <span>
              <strong>校历</strong>
              <small>{schoolYear.label} · {schoolYear.division}</small>
            </span>
          </a>
          {schoolYear.status === "partial-source" ? <span className="source-status">已更新至第一学期</span> : null}
          <div className="term-strip">
            <nav className="term-tabs" aria-label="学期选择">
              {schoolYear.terms.map((item) => (
                <button key={item.id} type="button" className={item.id === term.id ? "active" : ""} onClick={() => setTermId(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className={`hero-stats ${displayStats.notices > 0 ? "has-notices" : ""}`} aria-label="当前校历统计">
              <span>
                <strong>{displayStats.events}</strong>
                事件
              </span>
              <span>
                <strong>{displayStats.exams}</strong>
                考试
              </span>
              <span>
                <strong>{displayStats.holidays}</strong>
                假期
              </span>
              {displayStats.notices > 0 ? (
                <span>
                  <strong>{displayStats.notices}</strong>
                  待定
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className={`workspace ${isFullCalendarMode(mode) ? "calendar-workspace" : ""}`}>
        <aside className="side-rail" aria-label="校历控制与近期事件">
          <div className="control-block">
            <div className="select-grid">
              <select value={schoolYear.yearId} onChange={(event) => switchYear(event.target.value)} aria-label="选择学年">
                {yearOptions.map(([yearId, label]) => (
                  <option key={yearId} value={yearId}>
                    {label}
                  </option>
                ))}
              </select>
              <select value={schoolYear.divisionId} onChange={(event) => switchDivision(event.target.value)} aria-label="选择学部">
                {divisionsForYear.map((item) => (
                  <option key={item.id} value={item.divisionId}>
                    {item.division}
                  </option>
                ))}
              </select>
            </div>
            <label className="search-box">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索校历" aria-label="搜索校历事件" />
            </label>
            <div className="view-switch" aria-label="视图切换">
              <button type="button" className={mode === "dayGridWeek" ? "active" : ""} onClick={() => setMode("dayGridWeek")} aria-label="周历">
                周历
              </button>
              <button type="button" className={mode === "dayGridMonth" ? "active" : ""} onClick={() => setMode("dayGridMonth")}>
                月历
              </button>
              <button type="button" className={mode === "overview" ? "active" : ""} onClick={() => setMode("overview")}>
                概览
              </button>
              <button type="button" className={mode === "termPreview" ? "active" : ""} onClick={() => setMode("termPreview")} aria-label="学期预览">
                学期
              </button>
            </div>
            <div className="subscribe-row">
              <a className="export-button" href={webcalUrl}>
                <Rss size={16} />
                订阅
              </a>
              <a className="export-button" href={feedUrl} download>
                ICS
              </a>
            </div>
          </div>

          <div className="upcoming-block today-block">
            <div className="block-title">
              <CalendarDays size={16} />
              今日
            </div>
            <ol className="event-list">
              {todayEvents.length > 0 ? (
                todayEvents.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => jumpToEvent(item)}>
                      <span className={`dot ${eventClassNames(item).join(" ")}`} style={{ backgroundColor: eventColor(item) }} />
                      <span>
                        <strong>{displayEventTitle(item)}</strong>
                        <small><CategoryBadge category={item.category} />{formatRange(item.date, item.endDate)}</small>
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="empty-row">无</li>
              )}
            </ol>
          </div>

          <div className="upcoming-block">
            <div className="block-title">
              <Sparkles size={16} />
              近期/重点
            </div>
            <ol className="event-list">
              {nextEvents.length > 0 ? (
                nextEvents.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => jumpToEvent(item)}>
                      <span className={`dot ${eventClassNames(item).join(" ")}`} style={{ backgroundColor: eventColor(item) }} />
                      <span>
                        <strong>{displayEventTitle(item)}</strong>
                        <small><CategoryBadge category={item.category} />{formatRange(item.date, item.endDate)}</small>
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="empty-row">{emptyText}</li>
              )}
            </ol>
          </div>

          <PendingNotices notices={term.notices ?? []} />
        </aside>

        {mode === "overview" ? (
          <section className={`overview-panel ${expanded ? "is-fullscreen" : ""}`} aria-label="学期整体概览">
            <div className="section-heading">
              <div>
                <p>{schoolYear.label} · {schoolYear.division}</p>
                <h2>整体概览</h2>
              </div>
              <FullscreenToggle expanded={expanded} onToggle={toggleFullscreen} />
            </div>
            <div className="overview-grid">
              {schoolYear.terms.map((item) => {
                const itemStats = termStats(item);
                return (
                  <button key={item.id} className="overview-card" type="button" onClick={() => setTermId(item.id)}>
                    <span>{item.rangeLabel}</span>
                    <strong>{item.label}</strong>
                    <small>
                      {itemStats.events} 事件 · {itemStats.exams} 考试 · {itemStats.holidays} 假期
                    </small>
                  </button>
                );
              })}
            </div>
            <div className="month-overview" ref={overviewScrollRef}>
              {overviewMonths.length > 0 ? (
                overviewMonths.map(([month, items]) => (
                  <section key={month} className={`month-row ${month === todayMonth ? "is-today-month" : ""}`} data-month={month}>
                    <div className="month-row-label">
                      <h3>{month}</h3>
                      {month === todayMonth ? <span className="month-today-flag">今天</span> : null}
                    </div>
                    <div>
                      {items.map((item) => (
                        <button key={item.id} type="button" onClick={() => jumpToEvent(item)}>
                          <span className={`dot ${eventClassNames(item).join(" ")}`} style={{ backgroundColor: eventColor(item) }} />
                          <strong>{displayEventTitle(item)}</strong>
                          <small>{formatRange(item.date, item.endDate)}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <p className="empty-panel">{emptyText}</p>
              )}
            </div>
            <PanelLinks sourceUrl={schoolYear.source.url} events={filteredYearEvents} />
          </section>
        ) : mode === "termPreview" ? (
          <PreviewPanel
            title={previewScope === "year" ? "年历预览" : "学期预览"}
            subtitle={previewScope === "year" ? `${schoolYear.label} · ${schoolYear.division}` : `${term.label} · ${term.rangeLabel}`}
            months={previewScope === "year" ? fullYearMonths : termMonths}
            events={previewScope === "year" ? yearPreviewEvents : termPreviewEvents}
            today={today}
            focusMonth={previewScope === "year" ? yearPreviewFocusMonth : termPreviewFocusMonth}
            sourceUrl={schoolYear.source.url}
            emptyText={emptyText}
            expanded={expanded}
            scope={previewScope}
            mobile={isMobile}
            onScopeChange={setPreviewScope}
            onToggleFullscreen={toggleFullscreen}
            onJumpToEvent={jumpToEvent}
          />
        ) : (
          <section className={`calendar-panel ${expanded ? "is-fullscreen" : ""}`} aria-label={`${term.label}${mode === "dayGridWeek" ? "周历" : "月历"}`} ref={calendarPanelRef}>
            <div className="calendar-toolbar">
              <div>
                <p>{term.label}</p>
                <h2>{rangeTitle || term.rangeLabel}</h2>
                <span className="swipe-hint">
                  <ArrowUpDown size={13} />
                  上下滑动 / 滚轮{mode === "dayGridWeek" ? "翻周" : "翻月"}
                </span>
              </div>
              <div className="calendar-nav">
                <button type="button" onClick={() => calendarApi()?.prev()}>
                  {mode === "dayGridWeek" ? "上周" : "上月"}
                </button>
                <button type="button" onClick={() => calendarApi()?.today()}>
                  今天
                </button>
                <button type="button" onClick={() => calendarApi()?.next()}>
                  {mode === "dayGridWeek" ? "下周" : "下月"}
                </button>
                <FullscreenToggle expanded={expanded} onToggle={toggleFullscreen} />
              </div>
            </div>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              locale={zhCnLocale}
              timeZone="Asia/Shanghai"
              initialView={isFullCalendarMode(mode) ? mode : "dayGridMonth"}
              initialDate={defaultFocusDate}
              events={calendarEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              headerToolbar={false}
              height="auto"
              dayMaxEventRows={false}
              dayCellClassNames={dayCellClassNames}
              eventDisplay="block"
              firstDay={1}
              fixedWeekCount={false}
              noEventsText={emptyText}
            />
            <PanelLinks sourceUrl={schoolYear.source.url} events={filteredEvents} />
          </section>
        )}
      </section>

      <EventSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <nav className="mobile-tabbar" aria-label="视图切换">
        {(
          [
            ["dayGridWeek", "周历"],
            ["dayGridMonth", "月历"],
            ["overview", "概览"],
            ["termPreview", "学期"]
          ] as Array<[CalendarMode, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={mode === value ? "active" : ""}
            aria-current={mode === value ? "page" : undefined}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
