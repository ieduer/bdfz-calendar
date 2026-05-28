import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { CalendarApi, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import { CalendarDays, CalendarRange, ExternalLink, ListFilter, Rss, Search, Sparkles } from "lucide-react";
import { ACTIVE_SCHOOL_YEAR_ID, SCHOOL_YEARS } from "./data/schoolYears";
import type { CalendarEvent, EventCategory, Term } from "./types";
import { categoryMeta, importantEvents, termStats, toFullCalendarEvent, upcomingEvents } from "./lib/calendar";
import { compareDateText, formatRange, todayText } from "./lib/dates";
import { EventSheet } from "./components/EventSheet";
import "./styles.css";

type CalendarMode = "dayGridMonth" | "listMonth" | "overview";

const GITHUB_ISSUE_URL = "https://github.com/ieduer/bdfz-calendar/issues/new";

const visibleCategories: EventCategory[] = [
  "holiday",
  "exam",
  "activity",
  "sports",
  "ceremony",
  "practice",
  "cleanup",
  "note",
  "cycle"
];

const yearOptions = Array.from(new Map(SCHOOL_YEARS.map((item) => [item.yearId, item.label])).entries()).sort((a, b) =>
  b[0].localeCompare(a[0])
);

const findCalendar = (calendarId: string) =>
  SCHOOL_YEARS.find((item) => item.id === calendarId) ?? SCHOOL_YEARS.find((item) => item.id === ACTIVE_SCHOOL_YEAR_ID) ?? SCHOOL_YEARS[0];

const getOrigin = () => (typeof window === "undefined" ? "https://cal.bdfz.net" : window.location.origin);

export default function App() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [calendarId, setCalendarId] = useState(ACTIVE_SCHOOL_YEAR_ID);
  const [termId, setTermId] = useState<Term["id"]>(() => findCalendar(ACTIVE_SCHOOL_YEAR_ID).activeTermId);
  const [mode, setMode] = useState<CalendarMode>(() => (window.innerWidth < 720 ? "listMonth" : "dayGridMonth"));
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rangeTitle, setRangeTitle] = useState("");

  const schoolYear = findCalendar(calendarId);
  const divisionsForYear = SCHOOL_YEARS.filter((item) => item.yearId === schoolYear.yearId);
  const term = schoolYear.terms.find((item) => item.id === termId) ?? schoolYear.terms[0];
  const stats = useMemo(() => termStats(term), [term]);
  const today = todayText();
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    setTermId(schoolYear.activeTermId);
  }, [schoolYear.id, schoolYear.activeTermId]);

  const matchesFilters = (item: CalendarEvent) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const haystack = `${item.title} ${item.audience ?? ""} ${categoryMeta[item.category].label}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  };

  const eventById = useMemo(() => new Map(term.events.map((item) => [item.id, item])), [term.events]);

  const filteredEvents = useMemo(() => term.events.filter(matchesFilters), [normalizedQuery, selectedCategory, term.events]);
  const calendarEvents = useMemo(() => filteredEvents.map(toFullCalendarEvent), [filteredEvents]);
  const important = useMemo(() => importantEvents(term.events), [term.events]);
  const nextEvents = useMemo(() => upcomingEvents(term, today, 7), [term, today]);

  const yearEvents = useMemo(
    () => schoolYear.terms.flatMap((item) => importantEvents(item.events)).sort((a, b) => compareDateText(a.date, b.date)),
    [schoolYear]
  );
  const filteredYearEvents = useMemo(() => yearEvents.filter(matchesFilters), [normalizedQuery, selectedCategory, yearEvents]);
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

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || mode === "overview") return;
    api.changeView(mode);
  }, [mode]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || mode === "overview") return;
    api.gotoDate(term.start);
  }, [mode, term.start]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    const firstMatch = filteredEvents.find((item) => item.category !== "cycle") ?? filteredEvents[0];
    if (!api || mode === "overview" || !firstMatch || (!query.trim() && selectedCategory === "all")) return;
    api.gotoDate(firstMatch.date);
  }, [filteredEvents, mode, query, selectedCategory]);

  const calendarApi = (): CalendarApi | undefined => calendarRef.current?.getApi();

  const handleEventClick = (click: EventClickArg) => {
    const item = eventById.get(click.event.id);
    if (item) setSelectedEvent(item);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setRangeTitle(arg.view.title);
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
      <header className="topbar">
        <a className="brand" href="/" aria-label="北大附中校历首页">
          <span className="brand-mark">校历</span>
          <span>
            <strong>北大附中校历</strong>
            <small>{schoolYear.label} · {schoolYear.division}</small>
          </span>
        </a>
        <nav className="term-tabs" aria-label="学期选择">
          {schoolYear.terms.map((item) => (
            <button key={item.id} type="button" className={item.id === term.id ? "active" : ""} onClick={() => setTermId(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="hero-panel">
        <div>
          <p className="source-line">
            {schoolYear.label} · {schoolYear.division} · {term.label}
          </p>
          <h1>北大附中校历</h1>
        </div>
        <div className="hero-stats" aria-label="当前校历统计">
          <span>
            <strong>{mode === "overview" ? overviewStats.events : stats.events}</strong>
            事件
          </span>
          <span>
            <strong>{mode === "overview" ? overviewStats.exams : stats.exams}</strong>
            考试
          </span>
          <span>
            <strong>{mode === "overview" ? overviewStats.holidays : stats.holidays}</strong>
            假期
          </span>
        </div>
      </section>

      <section className="workspace">
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
                <CalendarDays size={16} />
                月历
              </button>
              <button type="button" className={mode === "listMonth" ? "active" : ""} onClick={() => setMode("listMonth")}>
                <ListFilter size={16} />
                列表
              </button>
              <button type="button" className={mode === "overview" ? "active" : ""} onClick={() => setMode("overview")}>
                <CalendarRange size={16} />
                概览
              </button>
            </div>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as EventCategory | "all")}>
              <option value="all">全部类型</option>
              {visibleCategories.map((category) => (
                <option key={category} value={category}>
                  {categoryMeta[category].label}
                </option>
              ))}
            </select>
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

          <div className="upcoming-block">
            <div className="block-title">
              <Sparkles size={16} />
              近期/重点
            </div>
            <ol className="event-list">
              {nextEvents.length > 0 ? (
                nextEvents.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelectedEvent(item)}>
                      <span className={`dot ${categoryMeta[item.category].className}`} />
                      <span>
                        <strong>{item.title}</strong>
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
                        <button key={item.id} type="button" onClick={() => setSelectedEvent(item)}>
                          <span className={`dot ${categoryMeta[item.category].className}`} />
                          <strong>{item.title}</strong>
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
              plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
              locale={zhCnLocale}
              timeZone="Asia/Shanghai"
              initialView={mode}
              initialDate={term.start}
              events={calendarEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              headerToolbar={false}
              height="auto"
              dayMaxEventRows={4}
              eventDisplay="block"
              firstDay={1}
              fixedWeekCount={false}
              noEventsText={emptyText}
            />
          </section>
        )}
      </section>

      <section className="timeline-section" aria-label="本学期事件索引">
        <div className="section-heading">
          <p>{term.focusMonths.join(" / ")}</p>
          <h2>事件索引</h2>
        </div>
        <div className="timeline-grid">
          {important
            .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
            .filter((item) => !normalizedQuery || `${item.title}${item.audience ?? ""}`.toLowerCase().includes(normalizedQuery))
            .sort((a, b) => compareDateText(a.date, b.date))
            .map((item) => (
              <button key={item.id} className="timeline-card" type="button" onClick={() => setSelectedEvent(item)}>
                <span className={`timeline-tag ${categoryMeta[item.category].className}`}>{categoryMeta[item.category].label}</span>
                <strong>{item.title}</strong>
                <small>{formatRange(item.date, item.endDate)}</small>
                {item.audience ? <em>{item.audience}</em> : null}
              </button>
            ))}
          {important.length === 0 ? <p className="empty-panel">{emptyText}</p> : null}
        </div>
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
