const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short"
});

export const addDays = (dateText: string, days: number): string => {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const toExclusiveEnd = (dateText?: string): string | undefined =>
  dateText ? addDays(dateText, 1) : undefined;

export const formatDate = (dateText: string): string => formatter.format(new Date(`${dateText}T00:00:00`));

export const formatRange = (start: string, end?: string): string => {
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const compareDateText = (a: string, b: string): number => a.localeCompare(b);

export const todayText = (): string => new Date().toISOString().slice(0, 10);
