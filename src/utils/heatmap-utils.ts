import type { StudySession, HeatmapDay } from '../types/database'
import { getDaysBetween } from './date-utils'

const getLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
  if (minutes === 0) return 0
  if (minutes < 30) return 1
  if (minutes < 90) return 2
  if (minutes < 180) return 3
  return 4
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
