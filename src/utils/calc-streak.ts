import type { StudySession } from '../types/database'
import { today, daysAgo } from './date-utils'

export const calculateCurrentStreak = (sessions: StudySession[]): number => {
  if (!sessions.length) return 0

  const studyDates = new Set(sessions.map((s) => s.date))
  const sortedDates = Array.from(studyDates).sort((a, b) => b.localeCompare(a))

  if (!sortedDates.length) return 0

  let streak = 0
  const todayStr = today()
  const yesterdayStr = daysAgo(1)

  // Streak must start from today or yesterday
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0
  }

  let expectedDate = new Date(sortedDates[0] + 'T00:00:00')

  for (const date of sortedDates) {
    const d = new Date(date + 'T00:00:00')
    const diff = Math.round((expectedDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0) {
      streak++
      expectedDate = new Date(d)
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export const calculateLongestStreak = (sessions: StudySession[]): number => {
  if (!sessions.length) return 0

  const studyDates = Array.from(new Set(sessions.map((s) => s.date))).sort()
  if (!studyDates.length) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < studyDates.length; i++) {
    const prev = new Date(studyDates[i - 1] + 'T00:00:00')
    const curr = new Date(studyDates[i] + 'T00:00:00')
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}
