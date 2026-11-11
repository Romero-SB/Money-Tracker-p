import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) {
    return 'Hoy';
  }
  if (isYesterday(date)) {
    return 'Ayer';
  }
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es });
}

export function timeLabel(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

export function dateTimeLabel(iso: string): string {
  return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: es });
}

export function dayKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
