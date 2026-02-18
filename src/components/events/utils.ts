import type { EventWithDetails } from "@/domain/event";
import type { useI18n } from "@/hooks/use-i18n";

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];
export const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getWeekday(dateStr: string, isJapanese: boolean): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekdays = isJapanese ? WEEKDAYS_JA : WEEKDAYS_EN;
  return weekdays[date.getDay()];
}

export function formatEventDate(
  dateStr: string,
  t: ReturnType<typeof useI18n>,
): { label: string; isSpecial: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: t("events.today"), isSpecial: true };
  if (diffDays === 1) return { label: t("events.tomorrow"), isSpecial: true };

  const month = eventDate.getMonth() + 1;
  const day = eventDate.getDate();
  return { label: `${month}/${day}`, isSpecial: false };
}

function parseTimeToMinutes(time: string | null): number {
  if (!time) return Infinity;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Infinity;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export function groupEventsByDate(events: EventWithDetails[]): Map<string, EventWithDetails[]> {
  const grouped = new Map<string, EventWithDetails[]>();
  for (const event of events) {
    const existing = grouped.get(event.event_date) || [];
    existing.push(event);
    grouped.set(event.event_date, existing);
  }

  for (const [date, dateEvents] of grouped) {
    dateEvents.sort((a, b) => parseTimeToMinutes(a.event_time) - parseTimeToMinutes(b.event_time));
    grouped.set(date, dateEvents);
  }

  return grouped;
}

export interface CalendarDate {
  date: string;
  day: number;
  weekday: number;
  isToday: boolean;
}

export function generateCalendarDates(): CalendarDate[] {
  const dates: CalendarDate[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    dates.push({
      date: dateStr,
      day: date.getDate(),
      weekday: date.getDay(),
      isToday: i === 0,
    });
  }
  return dates;
}

// Re-export animation variants from centralized location
export { staggerContainer as containerVariants, staggerItem as itemVariants } from "@/lib/animation";
