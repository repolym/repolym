import React, { useEffect, useState } from 'react'
import { toJalali, toGregorian } from '../../utils/jalali'

interface JalaliDateInputProps {
  label?: string
  value: string // Gregorian ISO date, e.g. "2025-06-14"
  onChange: (gregorianISODate: string) => void
  error?: string
  required?: boolean
  min?: string // Gregorian ISO date
  max?: string // Gregorian ISO date
  id?: string
  className?: string
}

export const JalaliDateInput: React.FC<JalaliDateInputProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  min,
  max,
  id,
  className = '',
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const [text, setText] = useState<string>(() => (value ? toJalali(value) : ''))
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setText(value ? toJalali(value) : '')
    setLocalError(null)
  }, [value])

  const tryParse = (raw: string): string | null => {
    const normalized = raw.trim()
    if (!/^[\d۰-۹]{2,4}\/[\d۰-۹]{1,2}\/[\d۰-۹]{1,2}$/.test(normalized)) return null
    try {
      return toGregorian(normalized)
    } catch {
      return null
    }
  }

  const commit = (raw: string) => {
    if (!raw) {
      setLocalError(required ? 'تاریخ الزامی است' : null)
      return
    }
    const gregorian = tryParse(raw)
    if (!gregorian) {
      setLocalError('فرمت تاریخ صحیح نیست (مثال: ۱۴۰۴/۰۳/۲۵)')
      return
    }
    if (min && gregorian < min) {
      setLocalError('تاریخ نمی‌تواند قبل از حداقل مجاز باشد')
      return
    }
    if (max && gregorian > max) {
      setLocalError('تاریخ نمی‌تواند بعد از حداکثر مجاز باشد')
      return
    }
    setLocalError(null)
    onChange(gregorian)
  }

  const shiftDay = (days: number) => {
    try {
      const base = value ? new Date(value + 'T00:00:00') : new Date()
      base.setDate(base.getDate() + days)
      const y = base.getFullYear()
      const m = String(base.getMonth() + 1).padStart(2, '0')
      const d = String(base.getDate()).padStart(2, '0')
      const newGregorian = `${y}-${m}-${d}`
      if (min && newGregorian < min) return
      if (max && newGregorian > max) return
      setText(toJalali(newGregorian))
      onChange(newGregorian)
    } catch {
      // ignore
    }
  }

  const displayedError = error || localError || undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="btn-ghost p-1.5 text-text-secondary hover:text-text-primary flex-shrink-0"
          aria-label="روز قبل"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={text}
          placeholder="۱۴۰۴/۰۳/۲۵"
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          className={`input-base text-center flex-1 min-w-[120px] ${displayedError ? 'border-danger focus:ring-danger focus:border-danger' : ''} ${className}`}
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="btn-ghost p-1.5 text-text-secondary hover:text-text-primary flex-shrink-0"
          aria-label="روز بعد"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {displayedError && <p className="text-xs text-danger">{displayedError}</p>}
    </div>
  )
}