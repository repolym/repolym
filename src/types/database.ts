export interface User {
  id: string
  email: string
  name: string
  is_admin: boolean
  olympiad_id: string | null
  onboarding_completed: boolean
  preferences: Record<string, unknown>
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
  date: string
  duration_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
  resource?: string | null
  question_count?: number | null
  question_difficulty?: string | null
  estimated_difficulty?: number | null  // ← number, not string
  question_type?: string | null
  todo_relation?: string | null
  tags?: string | null
  plan_id?: string | null
  plan?: Plan | null
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
  resource?: string | null
  question_count?: number | null
  question_difficulty?: string | null
  estimated_difficulty?: number | null  // ← number, not string
  question_type?: string | null
  todo_relation?: string | null
  tags?: string | null
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

export interface Plan {
  id: string
  user_id: string
  title: string
  description: string | null
  type: 'daily' | 'weekly' | 'monthly' | 'exam' | 'flexible'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  progress: number // 0-100
  start_date: string
  end_date: string | null
  due_date: string | null
  estimated_duration: number | null // minutes
  dependencies: string[] | null // array of plan IDs
  recurring: any | null // JSON
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  subject_id: string | null
  study_resource: string | null
  question_count: number | null
  difficulty: string | null
  priority: 'low' | 'medium' | 'high'
  deadline: string | null
  estimated_time: number | null
  actual_time: number | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  session_id: string | null
  plan_id: string | null
  created_at: string
  updated_at: string
  // joined
  subjects?: Subject
  study_session?: StudySession
  plan?: Plan
}

export interface TodoFormData {
  title: string
  description?: string | null
  subject_id?: string | null
  study_resource?: string | null
  question_count?: number | null
  difficulty?: string | null
  priority?: Todo['priority']
  deadline?: string | null
  estimated_time?: number | null
  actual_time?: number | null
  status?: Todo['status']
  session_id?: string | null
  plan_id?: string | null
}

export interface PlanFormData {
  title: string
  description?: string
  type: Plan['type']
  priority: Plan['priority']
  status?: Plan['status']
  progress?: number
  start_date: string
  end_date?: string | null
  due_date?: string | null
  estimated_duration?: number | null
  dependencies?: string[] | null
  recurring?: any | null
}

