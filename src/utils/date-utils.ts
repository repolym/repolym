import {
  toJalaliLong,
  toJalaliShort,
  formatMinutesPersian,
} from './jalali';

export const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const today = (): string => {
  return toLocalISODate(new Date());
};

export const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalISODate(d);
};

export const formatDate = (gregorianDate: string | null | undefined): string => {
  if (!gregorianDate) return '—';
  try {
    return toJalaliLong(gregorianDate);
  } catch {
    return '—';
  }
};

export const formatDateShort = (gregorianDate: string | null | undefined): string => {
  if (!gregorianDate) return '—';
  try {
    return toJalaliShort(gregorianDate);
  } catch {
    return '—';
  }
};

// FIXED: Round minutes to nearest whole number before formatting
export const formatMinutes = (minutes: number): string => {
  const rounded = Math.round(minutes);
  return formatMinutesPersian(rounded);
};

export const getDaysBetween = (from: string, to: string): string[] => {
  const days: string[] = [];
  const current = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (current <= end) {
    days.push(toLocalISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const getWeekStart = (dateStr?: string): string => {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toLocalISODate(d);
};

export const getWeekEnd = (dateStr?: string): string => {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  return toLocalISODate(d);
};

export const getMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export const isToday = (date: string): boolean => date === today();

export const isSameDay = (date1: string, date2: string): boolean => date1 === date2;

export const dayOfWeek = (gregorianDate: string): string => {
  return toJalaliLong(gregorianDate).split(' - ')[0];
};

export const monthLabel = (gregorianDate: string): string => {
  return toJalaliShort(gregorianDate).split(' ')[1];
};

export type GreetingPeriod = 'morning' | 'noon' | 'afternoon' | 'night';

export interface Greeting {
  period: GreetingPeriod;
  text: string;
  subtitle: string;
}

export const getGreeting = (date: Date = new Date()): Greeting => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      text: 'صبح بخیر',
      subtitle: 'امروز یک روز عالی برای مطالعه‌ست. ادامه بده!',
    };
  }
  if (hour >= 12 && hour < 16) {
    return {
      period: 'noon',
      text: 'ظهر بخیر',
      subtitle: 'نیمی از روز گذشت، با همین انرژی ادامه بده!',
    };
  }
  if (hour >= 16 && hour < 19) {
    return {
      period: 'afternoon',
      text: 'عصر بخیر',
      subtitle: 'وقت خوبیه برای مرور و تثبیت آموخته‌های امروز.',
    };
  }
  return {
    period: 'night',
    text: 'شب بخیر',
    subtitle: 'یک مرور سبک قبل از خواب می‌تونه خیلی مؤثر باشه.',
  };
};