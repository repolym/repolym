export interface User {
  id: string
  email: string
  name: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject_id: string | null
  date: string // YYYY-MM-DD
  duration_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  subjects?: Subject
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_minutes: number
  period: 'day' | 'week' | 'month'
  start_date: string
  end_date: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface GoalWithProgress extends Goal {
  progress_minutes: number
  progress_percent: number
}

export interface Test {
  id: string
  user_id: string
  subject_id: string | null
  name: string
  score: number
  max_score: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  subjects?: Subject
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_study_date: string | null
  updated_at: string
}

// Form types
export interface SessionFormData {
  subject_id: string | null
  date: string
  duration_minutes: number
  notes: string
}

export interface GoalFormData {
  title: string
  target_minutes: number
  period: 'day' | 'week' | 'month'
  start_date: string
  end_date: string | null
}

export interface TestFormData {
  subject_id: string | null
  name: string
  score: number
  max_score: number
  date: string
  notes: string
}

export interface SubjectFormData {
  name: string
  color: string
}

// Query state
export interface QueryState<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface SingleQueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Dashboard
export interface HeatmapDay {
  date: string
  minutes: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface DashboardStats {
  totalMinutesThisWeek: number
  totalMinutesThisMonth: number
  avgMinutesPerDay: number
  studyDaysThisMonth: number
}
