import { format, isToday, isYesterday, startOfDay, startOfMonth, startOfWeek, startOfYear, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export type DashboardPeriod = 'today' | 'week' | 'month';

export type StatsPeriod = 'month' | 'quarter' | 'year';

export function periodFromDate(period: DashboardPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return startOfDay(now);
    case 'week':
      return startOfWeek(now, { locale: es });
    case 'month':
      return startOfMonth(now);
  }
}

export function periodLabel(period: DashboardPeriod): string {
  switch (period) {
    case 'today':
      return 'Hoy';
    case 'week':
      return 'Semana';
    case 'month':
      return 'Mes';
  }
}

export function statsPeriodFromDate(period: StatsPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'month':
      return startOfMonth(now);
    case 'quarter':
      return startOfMonth(subMonths(now, 2));
    case 'year':
      return startOfYear(now);
  }
}

export function statsPeriodLabel(period: StatsPeriod): string {
  switch (period) {
    case 'month':
      return 'Este mes';
    case 'quarter':
      return 'Últimos 3 meses';
    case 'year':
      return 'Este año';
  }
}

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
