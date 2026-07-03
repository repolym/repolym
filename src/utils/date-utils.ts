import {
  toJalaliLong,
  toJalaliShort,
  formatMinutesPersian,
} from './jalali'

// پایه: تاریخ‌ها در کل برنامه به صورت ISO میلادی ذخیره می‌شوند
//
// نکته مهم: هرگز از Date.prototype.toISOString() برای استخراج تاریخ محلی استفاده نکنید.
// toISOString() همیشه بر اساس UTC است، نه زمان محلی کاربر. برای کاربرانی که در
// منطقه‌ زمانی جلوتر از UTC هستند (مثل ایران، UTC+3:30) این تابع می‌تواند یک روز
// قبل‌تر از تاریخ واقعی محلی را برگرداند (مخصوصاً بین ساعت ۰۰:۰۰ تا ۰۳:۳۰ بامداد)،
// و در کد ناوبری تاریخ (تغییر روز به جلو/عقب) این خطا با هر بار محاسبه دوباره تکرار
// و انباشته می‌شود و باعث می‌شود تاریخ نمایش داده‌شده پیوسته به عقب برود.
// به همین دلیل از toLocalISODate که از متدهای محلی (getFullYear/getMonth/getDate)
// استفاده می‌کند، در سراسر پروژه استفاده می‌کنیم.
export const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const today = (): string => {
  return toLocalISODate(new Date())
}

export const daysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toLocalISODate(d)
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
    days.push(toLocalISODate(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export const getWeekStart = (): string => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return toLocalISODate(d)
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

export type GreetingPeriod = 'morning' | 'noon' | 'afternoon' | 'night'

export interface Greeting {
  period: GreetingPeriod
  text: string
  subtitle: string
}

// احوال‌پرسی و زیرعنوان پویا بر اساس ساعت محلی کاربر (هرگز هاردکد نشود)
export const getGreeting = (date: Date = new Date()): Greeting => {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      text: 'صبح بخیر',
      subtitle: 'امروز یک روز عالی برای مطالعه‌ست. ادامه بده!',
    }
  }
  if (hour >= 12 && hour < 16) {
    return {
      period: 'noon',
      text: 'ظهر بخیر',
      subtitle: 'نیمی از روز گذشت، با همین انرژی ادامه بده!',
    }
  }
  if (hour >= 16 && hour < 19) {
    return {
      period: 'afternoon',
      text: 'عصر بخیر',
      subtitle: 'وقت خوبیه برای مرور و تثبیت آموخته‌های امروز.',
    }
  }
  return {
    period: 'night',
    text: 'شب بخیر',
    subtitle: 'یک مرور سبک قبل از خواب می‌تونه خیلی مؤثر باشه.',
  }
}