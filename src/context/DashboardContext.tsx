
import React, { createContext, useContext, useEffect, useState } from 'react'
import { daysAgo, today } from '../utils/date-utils'

interface DateRange {
  from: string
  to: string
}

interface DashboardContextType {
  dateRange: DateRange
  setDateRange: (from: string, to: string) => void
  selectedSubject: string | null
  setSelectedSubject: (id: string | null) => void
}

const STORAGE_KEY = 'olympiad_dashboard_prefs'

const defaultRange = (): DateRange => ({
  from: daysAgo(90),
  to: today(),
})

const DashboardContext = createContext<DashboardContextType | null>(null)

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // اگر محدوده ذخیره‌شده مربوط به روز دیگری باشد (مثلاً کاربر یک شب با تب
        // باز مانده)، آن را نادیده می‌گیریم — وگرنه «تا تاریخ» برای همیشه روی
        // یک روز قدیمی ثابت می‌ماند و داده‌های جدید هرگز نمایش داده نمی‌شوند.
        if (parsed.dateRange?.to === today()) {
          return parsed.dateRange
        }
      }
    } catch {}
    return defaultRange()
  })

  const [selectedSubject, setSelectedSubjectState] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dateRange }))
  }, [dateRange])

  const setDateRange = (from: string, to: string) => {
    setDateRangeState({ from, to })
  }

  const setSelectedSubject = (id: string | null) => {
    setSelectedSubjectState(id)
  }

  return (
    <DashboardContext.Provider value={{ dateRange, setDateRange, selectedSubject, setSelectedSubject }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = (): DashboardContextType => {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
