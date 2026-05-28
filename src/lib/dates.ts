const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short"
});

export const addDays = (dateText: string, days: number): string => {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
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

export const localTodayText = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
