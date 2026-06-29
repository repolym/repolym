import {
  toJalali,
  toJalaliLong,
  toJalaliShort,
  todayJalali,
  toGregorian,
  formatMinutesPersian,
  toPersianDigits,
} from './jalali'

// پایه: تاریخ‌ها در کل برنامه به صورت ISO میلادی ذخیره می‌شوند
export const today = (): string => {
  return new Date().toISOString().split('T')[0] // همچنان میلادی برای کوئری‌ها
}

export const daysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export const formatDate = (gregorianDate: string): string => {
  return toJalaliLong(gregorianDate)
}

export const formatDateShort = (gregorianDate: string): string => {
  return toJalaliShort(gregorianDate)
}

export const formatMinutes = (minutes: number): string => {
  return formatMinutesPersian(minutes)
}

export const getDaysBetween = (from: string, to: string): string[] => {
  const days: string[] = []
  const current = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

export const getWeekStart = (): string => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export const getMonthStart = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export const isToday = (date: string): boolean => date === today()

export const dayOfWeek = (gregorianDate: string): string => {
  return toJalaliLong(gregorianDate).split(' - ')[0] // فقط نام روز
}

export const monthLabel = (gregorianDate: string): string => {
  return toJalaliShort(gregorianDate).split(' ')[1] // فقط نام ماه
}