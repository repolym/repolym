import type { StudySession, HeatmapDay } from '../types/database'
import { getDaysBetween } from './date-utils'

// آستانه‌های شدت بر اساس ساعت مطالعه واقعی (نه دقیقه‌های کوچک و غیرواقعی):
// ۰ ساعت → بدون مطالعه
// ۰ تا ۲ ساعت → ضعیف
// بیش از ۲ تا ۵ ساعت → متوسط (با دو سطح رنگی برای گرادیان بهتر)
// بیش از ۵ (۶+) ساعت → قوی
const getLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
  if (minutes <= 0) return 0
  if (minutes <= 120) return 1 // 0-2h: weak
  if (minutes <= 210) return 2 // 2-3.5h: medium
  if (minutes <= 300) return 3 // 3.5-5h: medium-strong
  return 4 // 5h+ (6h+): strong
}

export const buildHeatmapData = (sessions: StudySession[], from: string, to: string): HeatmapDay[] => {
  const minutesByDate = new Map<string, number>()

  for (const session of sessions) {
    const existing = minutesByDate.get(session.date) || 0
    minutesByDate.set(session.date, existing + session.duration_minutes)
  }

  const days = getDaysBetween(from, to)
  return days.map((date) => {
    const minutes = minutesByDate.get(date) || 0
    return { date, minutes, level: getLevel(minutes) }
  })
}
