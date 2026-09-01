export type EventCategory =
  | "holiday"
  | "exam"
  | "activity"
  | "sports"
  | "ceremony"
  | "practice"
  | "cleanup"
  | "cycle"
  | "note";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: EventCategory;
  audience?: string;
  note?: string;
  unnumberedCycle?: boolean;
  source?: "yuque-copy" | "official-pdf" | "manual-placeholder";
};

export type TermNotice = {
  id: string;
  title: string;
  category: EventCategory;
  audience?: string;
  note?: string;
};

export type Term = {
  id: "fall" | "spring";
  label: string;
  rangeLabel: string;
  start: string;
  end: string;
  focusMonths: string[];
  events: CalendarEvent[];
  notices?: TermNotice[];
};

export type SchoolYear = {
  id: string;
  label: string;
  yearId: string;
  divisionId: string;
  division: string;
  status?: "complete" | "partial-source" | "pending-source";
  activeTermId: Term["id"];
  source: {
    title: string;
    url: string;
    extractedFrom: string;
    extractedAt: string;
  };
  terms: Term[];
};
