import { booking, schedule } from "@/data/site";

export type Day = {
  /** Fecha a medianoche, hora local */
  date: Date;
  /** "Hoy", "Mañana" o el nombre del día ("Miércoles") */
  label: string;
  /** "22 de octubre" */
  dayMonth: string;
  slots: string[];
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Horarios de inicio en un día en que el servicio termina antes del cierre. */
export function slotsFor(date: Date, duration: number, now: Date): string[] {
  const hours = schedule[date.getDay()];
  if (!hours) return [];
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);

  const isToday = date.toDateString() === now.toDateString();
  const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + booking.minNoticeMinutes : 0;

  const slots: string[] = [];
  for (let t = open; t + duration <= close; t += booking.slotMinutes) {
    if (t >= earliest) slots.push(toHHMM(t));
  }
  return slots;
}

/** Próximos días abiertos que todavía tienen algún horario libre para el servicio. */
export function upcomingDays(duration: number, now = new Date()): Day[] {
  const weekday = new Intl.DateTimeFormat("es", { weekday: "long" });
  const dayMonth = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const days: Day[] = [];
  for (let i = 0; i < booking.daysAhead; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const slots = slotsFor(date, duration, now);
    if (slots.length === 0) continue;
    days.push({
      date,
      label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : capitalize(weekday.format(date)),
      dayMonth: dayMonth.format(date),
      slots,
    });
  }
  return days;
}

/** "miércoles 22 de octubre" */
export const longDate = (date: Date) =>
  new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(date);

/** Separa los horarios en mañana (antes de las 13:00) y tarde. */
export function splitByPartOfDay(slots: string[]) {
  return {
    morning: slots.filter((s) => toMinutes(s) < 13 * 60),
    afternoon: slots.filter((s) => toMinutes(s) >= 13 * 60),
  };
}
