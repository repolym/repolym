/**
 * Production-grade input validation and sanitization
 */

export interface ValidationError {
  field: string
  message: string
}

export class ValidationErrorCollection {
  private errors: Map<string, string> = new Map()

  add(field: string, message: string): void {
    this.errors.set(field, message)
  }

  has(field: string): boolean {
    return this.errors.has(field)
  }

  get(field: string): string | undefined {
    return this.errors.get(field)
  }

  all(): ValidationError[] {
    return Array.from(this.errors.entries()).map(([field, message]) => ({ field, message }))
  }

  isEmpty(): boolean {
    return this.errors.size === 0
  }

  clear(): void {
    this.errors.clear()
  }

  toJSON(): Record<string, string> {
    return Object.fromEntries(this.errors)
  }
}

// ========================
// String Validation
// ========================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128
}

export const validateName = (name: string): boolean => {
  const trimmed = name.trim()
  return trimmed.length >= 2 && trimmed.length <= 100
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const validateHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// ========================
// Number Validation
// ========================

export const validateDurationMinutes = (minutes: number): boolean => {
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 1440
}

export const validateTestScore = (score: number, maxScore: number): boolean => {
  return (
    Number.isInteger(score) &&
    Number.isInteger(maxScore) &&
    score >= 0 &&
    maxScore > 0 &&
    score <= maxScore &&
    maxScore <= 10000
  )
}

export const validateTargetMinutes = (minutes: number): boolean => {
  return Number.isInteger(minutes) && minutes > 0 && minutes <= 10080 // Max: 7 days
}

// ========================
// Date Validation
// ========================

export const validateDateString = (date: string): boolean => {
  try {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  } catch {
    return false
  }
}

export const validateDateRange = (startDate: string, endDate: string | null): boolean => {
  if (!validateDateString(startDate)) return false
  if (!endDate) return true
  if (!validateDateString(endDate)) return false

  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end
}

// ========================
// Array Validation
// ========================

export const validateStringArray = (arr: unknown[], maxLength: number = 100): boolean => {
  if (!Array.isArray(arr)) return false
  return arr.length <= maxLength && arr.every((item) => typeof item === 'string')
}

// ========================
// Form Data Validation
// ========================

export interface SessionFormValidation {
  durationMinutes: boolean
  date: boolean
  allValid: boolean
}

export const validateSessionForm = (data: {
  date: string
  duration_minutes: number
}): SessionFormValidation => {
  const errors = new ValidationErrorCollection()

  if (!validateDateString(data.date)) {
    errors.add('date', 'تاریخ نامعتبر است')
  }

  if (!validateDurationMinutes(data.duration_minutes)) {
    errors.add('duration_minutes', 'مدت مطالعه باید بین ۱ دقیقه و ۲۴ ساعت باشد')
  }

  return {
    durationMinutes: !errors.has('duration_minutes'),
    date: !errors.has('date'),
    allValid: errors.isEmpty(),
  }
}

// ========================
// Input Sanitization
// ========================

export const sanitizeString = (input: string, maxLength: number = 1000): string => {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
}

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().substring(0, 255)
}

export const sanitizeJson = (input: unknown): unknown => {
  try {
    return JSON.parse(JSON.stringify(input))
  } catch {
    return null
  }
}

// ========================
// Validation Composites
// ========================

export const validateUserProfile = (data: {
  email?: string
  name?: string
}): ValidationErrorCollection => {
  const errors = new ValidationErrorCollection()

  if (data.email && !validateEmail(data.email)) {
    errors.add('email', 'ایمیل نامعتبر است')
  }

  if (data.name && !validateName(data.name)) {
    errors.add('name', 'نام باید بین ۲ تا ۱۰۰ کاراکتر باشد')
  }

  return errors
}

export const validateGoalForm = (data: {
  title: string
  targetMinutes: number
  startDate: string
  endDate: string | null
}): ValidationErrorCollection => {
  const errors = new ValidationErrorCollection()

  if (!validateName(data.title)) {
    errors.add('title', 'عنوان باید بین ۲ تا ۱۰۰ کاراکتر باشد')
  }

  if (!validateTargetMinutes(data.targetMinutes)) {
    errors.add('targetMinutes', 'هدف باید بیشتر از صفر باشد')
  }

  if (!validateDateRange(data.startDate, data.endDate)) {
    errors.add('dates', 'دامنه تاریخ نامعتبر است')
  }

  return errors
}

export const validateTestForm = (data: {
  name: string
  score: number
  maxScore: number
  date: string
}): ValidationErrorCollection => {
  const errors = new ValidationErrorCollection()

  if (!validateName(data.name)) {
    errors.add('name', 'نام آزمون باید بین ۲ تا ۱۰۰ کاراکتر باشد')
  }

  if (!validateTestScore(data.score, data.maxScore)) {
    errors.add('score', 'امتیاز نامعتبر است')
  }

  if (!validateDateString(data.date)) {
    errors.add('date', 'تاریخ نامعتبر است')
  }

  return errors
}