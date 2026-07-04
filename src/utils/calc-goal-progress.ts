
import type { Goal, GoalWithProgress, StudySession } from '../types/database'
import { today, toLocalISODate } from './date-utils'

const getPeriodRange = (goal: Goal): { from: string; to: string } => {
  const todayStr = today()

  if (goal.period === 'day') {
    return { from: todayStr, to: todayStr }
  }

  if (goal.period === 'week') {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now)
    monday.setDate(diff)
    return {
      from: toLocalISODate(monday),
      to: todayStr,
    }
  }

  if (goal.period === 'month') {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return { from: monthStart, to: todayStr }
  }

  return { from: goal.start_date, to: goal.end_date || todayStr }
}

export const calculateGoalProgress = (goal: Goal, sessions: StudySession[]): GoalWithProgress => {
  const { from, to } = getPeriodRange(goal)

  const relevantSessions = sessions.filter((s) => {
    return s.date >= from && s.date <= to
  })

  const progress_minutes = relevantSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const progress_percent = Math.min(100, Math.round((progress_minutes / goal.target_minutes) * 100))

  return {
    ...goal,
    progress_minutes,
    progress_percent,
  }
}

export const calculateGoalsProgress = (goals: Goal[], sessions: StudySession[]): GoalWithProgress[] => {
  return goals.map((goal) => calculateGoalProgress(goal, sessions))
}
