import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { CalendarApi, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { CalendarDays, ExternalLink, Rss, Search, Sparkles } from "lucide-react";
import { ACTIVE_SCHOOL_YEAR_ID, SCHOOL_YEARS } from "./data/schoolYears";
import type { CalendarEvent, SchoolYear, Term } from "./types";
import {
  categoryMeta,
  displayEventTitle,
  eventClassNames,
  eventColor,
  importantEvents,
  termStats,
  toFullCalendarEvent,
  upcomingEvents
} from "./lib/calendar";
import { addDays, compareDateText, formatRange, localTodayText } from "./lib/dates";
import { EventSheet } from "./components/EventSheet";
import "./styles.css";

type FullCalendarMode = "dayGridMonth";
type CalendarMode = FullCalendarMode | "overview" | "termPreview" | "yearPreview";
type MonthCell = { date?: string; day?: number; weekday?: number };

const GITHUB_ISSUE_URL = "https://github.com/ieduer/bdfz-calendar/issues/new";
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const yearOptions = Array.from(new Map(SCHOOL_YEARS.map((item) => [item.yearId, item.label])).entries()).sort((a, b) =>
  b[0].localeCompare(a[0])
);

const findCalendar = (calendarId: string) =>
  SCHOOL_YEARS.find((item) => item.id === calendarId) ?? SCHOOL_YEARS.find((item) => item.id === ACTIVE_SCHOOL_YEAR_ID) ?? SCHOOL_YEARS[0];

const getOrigin = () => (typeof window === "undefined" ? "https://cal.bdfz.net" : window.location.origin);
const isFullCalendarMode = (mode: CalendarMode): mode is FullCalendarMode => mode === "dayGridMonth";
const dateInRange = (date: string, start: string, end: string): boolean => date >= start && date <= end;
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

const eventAccentStyle = (event: CalendarEvent): EventAccentStyle => ({
  "--event-accent": eventColor(event)
});

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

type SheetDayCellProps = {
  cell: MonthCell;
  eventsByDate: Map<string, CalendarEvent[]>;
  isFirstWeek?: boolean;
  today: string;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetDayCell({ cell, eventsByDate, isFirstWeek = false, today, onJumpToEvent }: SheetDayCellProps) {
  if (!cell.date) return <div className="sheet-day-cell empty" aria-hidden="true" />;

  const dayEvents = sortDayEvents(eventsByDate.get(cell.date) ?? []);
  const className = [
    "sheet-day-cell",
    isFirstWeek ? "is-first-week" : "",
    dayEvents.length > 0 ? "has-events" : "",
    cell.date === today ? "is-today" : "",
    cell.weekday === 6 ? "is-saturday" : "",
    cell.weekday === 7 ? "is-sunday" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-label={`${cell.date}${dayEvents.length ? ` ${dayEvents.map(displayEventTitle).join(" ")}` : ""}`}>
      <span className="sheet-date-number">{sheetDateLabel(cell)}</span>
      <div className="sheet-day-events">
        {dayEvents.map((event) => (
          <SheetEventChip key={`${cell.date}-${event.id}`} event={event} compact onJumpToEvent={onJumpToEvent} />
        ))}
      </div>
    </div>
  );
}

type SheetMonthProps = {
  month: string;
  eventsByDate: Map<string, CalendarEvent[]>;
  today: string;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function SheetMonth({ month, eventsByDate, today, onJumpToEvent }: SheetMonthProps) {
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const weeks = useMemo(() => chunkWeeks(cells), [cells]);
  const eventCount = countMonthEvents(month, eventsByDate);

  return (
    <section className="sheet-month" data-month={month} aria-label={`${monthLabel(month)}预览`}>
      <div className="sheet-month-title">
        <strong>{monthLabel(month)}</strong>
        <span>{eventCount > 0 ? `${eventCount}项` : ""}</span>
      </div>
      <div className="sheet-month-label" style={{ gridRow: `span ${weeks.length}` }}>
        {monthName(month)}
      </div>
      {cells.map((cell, index) => (
        <SheetDayCell
          key={cell.date ?? `${month}-${index}`}
          cell={cell}
          eventsByDate={eventsByDate}
          isFirstWeek={index < 7}
          today={today}
          onJumpToEvent={onJumpToEvent}
        />
      ))}
    </section>
  );
}

type PreviewPanelProps = {
  title: string;
  subtitle: string;
  months: string[];
  events: CalendarEvent[];
  today: string;
  focusMonth: string;
  emptyText: string;
  onJumpToEvent: (event: CalendarEvent) => void;
};

function PreviewPanel({ title, subtitle, months, events, today, focusMonth, emptyText, onJumpToEvent }: PreviewPanelProps) {
  const sheetScrollRef = useRef<HTMLDivElement | null>(null);
  const eventsByDate = useMemo(() => buildEventsByDate(events), [events]);

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
    <section className="preview-panel sheet-preview-panel" aria-label={title}>
      <div className="section-heading">
        <p>{subtitle}</p>
        <h2>{title}</h2>
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
            <SheetMonth key={month} month={month} eventsByDate={eventsByDate} today={today} onJumpToEvent={onJumpToEvent} />
          ))}
        </div>
      ) : (
        <p className="empty-panel">{emptyText}</p>
      )}
    </section>
  );
}

export default function App() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const initialSchoolYear = findCalendar(ACTIVE_SCHOOL_YEAR_ID);
  const [calendarId, setCalendarId] = useState(ACTIVE_SCHOOL_YEAR_ID);
  const [termId, setTermId] = useState<Term["id"]>(() => preferredTermId(initialSchoolYear, localTodayText()));
  const [mode, setMode] = useState<CalendarMode>("dayGridMonth");
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [pendingJump, setPendingJump] = useState<CalendarEvent | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [rangeTitle, setRangeTitle] = useState("");
  const highlightTimeoutRef = useRef<number | undefined>(undefined);

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
      activities: yearEvents.filter((item) => item.category === "activity" || item.category === "ceremony").length
    }),
    [yearEvents]
  );
  const overviewMonths = useMemo(() => {
    const buckets = new Map<string, CalendarEvent[]>();
    filteredYearEvents.forEach((item) => {
      const month = item.date.slice(0, 7);
      buckets.set(month, [...(buckets.get(month) ?? []), item]);
    });
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredYearEvents]);
  const isYearScope = mode === "overview" || mode === "yearPreview";
  const displayStats = isYearScope ? overviewStats : stats;

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
    <main className="page-shell">
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
          <div className="term-strip">
            <nav className="term-tabs" aria-label="学期选择">
              {schoolYear.terms.map((item) => (
                <button key={item.id} type="button" className={item.id === term.id ? "active" : ""} onClick={() => setTermId(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="hero-stats" aria-label="当前校历统计">
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
            </div>
          </div>
        </div>
      </header>

      <section className={`workspace ${mode === "dayGridMonth" ? "calendar-workspace" : ""}`}>
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
              <button type="button" className={mode === "dayGridMonth" ? "active" : ""} onClick={() => setMode("dayGridMonth")}>
                月历
              </button>
              <button type="button" className={mode === "overview" ? "active" : ""} onClick={() => setMode("overview")}>
                概览
              </button>
              <button type="button" className={mode === "termPreview" ? "active" : ""} onClick={() => setMode("termPreview")} aria-label="学期预览">
                学期
              </button>
              <button type="button" className={mode === "yearPreview" ? "active" : ""} onClick={() => setMode("yearPreview")} aria-label="年历预览">
                年历
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
                        <small>{formatRange(item.date, item.endDate)}</small>
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
                        <small>{formatRange(item.date, item.endDate)}</small>
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="empty-row">{emptyText}</li>
              )}
            </ol>
          </div>
        </aside>

        {mode === "overview" ? (
          <section className="overview-panel" aria-label="学期整体概览">
            <div className="section-heading">
              <p>{schoolYear.label} · {schoolYear.division}</p>
              <h2>整体概览</h2>
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
            <div className="month-overview">
              {overviewMonths.length > 0 ? (
                overviewMonths.map(([month, items]) => (
                  <section key={month} className="month-row">
                    <h3>{month}</h3>
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
          </section>
        ) : mode === "termPreview" ? (
          <PreviewPanel
            title="学期预览"
            subtitle={`${term.label} · ${term.rangeLabel}`}
            months={termMonths}
            events={termPreviewEvents}
            today={today}
            focusMonth={termPreviewFocusMonth}
            emptyText={emptyText}
            onJumpToEvent={jumpToEvent}
          />
        ) : mode === "yearPreview" ? (
          <PreviewPanel
            title="年历预览"
            subtitle={`${schoolYear.label} · ${schoolYear.division}`}
            months={fullYearMonths}
            events={yearPreviewEvents}
            today={today}
            focusMonth={yearPreviewFocusMonth}
            emptyText={emptyText}
            onJumpToEvent={jumpToEvent}
          />
        ) : (
          <section className="calendar-panel" aria-label={`${term.label}月历`}>
            <div className="calendar-toolbar">
              <div>
                <p>{term.label}</p>
                <h2>{rangeTitle || term.rangeLabel}</h2>
              </div>
              <div className="calendar-nav">
                <button type="button" onClick={() => calendarApi()?.prev()}>
                  上月
                </button>
                <button type="button" onClick={() => calendarApi()?.today()}>
                  今天
                </button>
                <button type="button" onClick={() => calendarApi()?.next()}>
                  下月
                </button>
              </div>
            </div>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              locale={zhCnLocale}
              timeZone="Asia/Shanghai"
              initialView="dayGridMonth"
              initialDate={defaultFocusDate}
              events={calendarEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              headerToolbar={false}
              height="auto"
              dayMaxEventRows={false}
              eventDisplay="block"
              firstDay={1}
              fixedWeekCount={false}
              noEventsText={emptyText}
            />
          </section>
        )}
      </section>

      <footer className="page-footer">
        <a href={schoolYear.source.url} target="_blank" rel="noreferrer">
          数据源
        </a>
        <a href={GITHUB_ISSUE_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          官方改动？提交 GitHub issue
        </a>
      </footer>

      <EventSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </main>
  );
}
