import React, { useEffect, useState } from 'react'
import type { StudySession, SessionFormData, Subject } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select, Textarea } from '../common/Input'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'
import {
  toJalali,
  toJalaliLong,
  toGregorian,
  todayJalali,
  toPersianDigits,
} from '../../utils/jalali'

interface SessionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SessionFormData) => Promise<boolean>
  subjects: Subject[]
  editing?: StudySession | null
}

// --- Helpers ---
const parseActivitiesDuration = (text: string): number => {
  let totalHours = 0
  const halfRegex = /(\d+(?:\.\d+)?)\s*ساعت\s*و\s*نیم/g
  let match
  while ((match = halfRegex.exec(text)) !== null) {
    totalHours += parseFloat(match[1]) + 0.5
  }
  const cleaned = text.replace(halfRegex, '')
  const hourRegex = /(\d+(?:\.\d+)?)\s*ساعت/g
  while ((match = hourRegex.exec(cleaned)) !== null) {
    totalHours += parseFloat(match[1])
  }
  return Math.round(totalHours * 60)
}

const buildNotesJSON = (activities: string, wake: string, sleep: string, phone: string): string =>
  JSON.stringify({ activities, wake, sleep, phone })

const parseNotesJSON = (notes: string | null) => {
  if (!notes) return { activities: '', wake: '', sleep: '', phone: '' }
  try {
    const parsed = JSON.parse(notes)
    return {
      activities: parsed.activities || '',
      wake: parsed.wake || '',
      sleep: parsed.sleep || '',
      phone: parsed.phone || '',
    }
  } catch {
    return { activities: notes, wake: '', sleep: '', phone: '' }
  }
}

// --- Component ---
export const SessionForm: React.FC<SessionFormProps> = ({ isOpen, onClose, onSubmit, subjects, editing }) => {
  // ---- NAME REMOVED ----
  const [jalaliDate, setJalaliDate] = useState<string>(todayJalali())
  const [activities, setActivities] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepTime, setSleepTime] = useState('')
  const [phoneHours, setPhoneHours] = useState('')

  const [quickSubject, setQuickSubject] = useState('')
  const [quickDuration, setQuickDuration] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Load editing data or reset
  useEffect(() => {
    if (editing) {
      const parsed = parseNotesJSON(editing.notes)
      setActivities(parsed.activities)
      setWakeTime(parsed.wake)
      setSleepTime(parsed.sleep)
      setPhoneHours(parsed.phone)
      setJalaliDate(toJalali(editing.date))
    } else {
      setActivities('')
      setWakeTime('')
      setSleepTime('')
      setPhoneHours('')
      setJalaliDate(todayJalali())
    }
    setErrors({})
    setServerError(null)
  }, [editing, isOpen])

  // Date navigation
  const changeDate = (days: number) => {
    try {
      const greg = toGregorian(jalaliDate)
      const d = new Date(greg + 'T00:00:00')
      d.setDate(d.getDate() + days)
      // استفاده از متد ساده و امن برای تبدیل به YYYY-MM-DD
      const newGreg = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      const newJalali = toJalali(newGreg)
      setJalaliDate(newJalali)
    } catch {
      // ignore
    }
  }

  // Quick-add
  const handleQuickAdd = () => {
    if (!quickSubject || !quickDuration) return
    const subj = subjects.find((s) => s.id === quickSubject)
    if (!subj) return
    const line = `• ${subj.name} - ${quickDuration} ساعت\n`
    setActivities((prev) => (prev ? prev + line : line))
    setQuickSubject('')
    setQuickDuration('')
  }

  // Validation & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    // NAME VALIDATION REMOVED
    if (!jalaliDate) newErrors.jalaliDate = 'تاریخ الزامی است'
    if (!wakeTime) newErrors.wakeTime = 'ساعت بیداری الزامی است'
    if (!sleepTime) newErrors.sleepTime = 'ساعت خواب الزامی است'

    const phoneHoursNum = Number(phoneHours)
    if (!phoneHours || isNaN(phoneHoursNum)) {
      newErrors.phoneHours = 'مقدار نامعتبر'
    } else if (phoneHoursNum < 0) {
      newErrors.phoneHours = 'مقدار نمی‌تواند منفی باشد'
    } else if (phoneHoursNum > 24) {
      newErrors.phoneHours = 'یک روز نمی‌تواند بیش از ۲۴ ساعت باشد'
    }

    const computedDuration = parseActivitiesDuration(activities)
    if (!activities.trim() || computedDuration <= 0) {
      newErrors.activities = 'حداقل یک فعالیت با ساعت مشخص وارد کنید (مثال: ۲ ساعت ریاضی)'
    } else if (computedDuration > 24 * 60) {
      newErrors.activities = 'مجموع ساعات مطالعه نمی‌تواند بیش از ۲۴ ساعت در روز باشد'
    } else if (
      !isNaN(phoneHoursNum) &&
      phoneHoursNum >= 0 &&
      computedDuration / 60 + phoneHoursNum > 24
    ) {
      newErrors.activities = 'مجموع ساعت مطالعه و کار با گوشی نمی‌تواند بیش از ۲۴ ساعت در روز باشد'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setServerError(null)

    try {
      const gregorianDate = toGregorian(jalaliDate)
      const duration = parseActivitiesDuration(activities)
      const notes = buildNotesJSON(activities, wakeTime, sleepTime, phoneHours)

      const data: SessionFormData = {
        subject_id: editing?.subject_id ?? null,
        date: gregorianDate,
        duration_minutes: duration || 0,
        notes,
      }

      const ok = await onSubmit(data)
      if (ok) {
        onClose()
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی')
    } finally {
      setLoading(false)
    }
  }

  const gregorianDisplayDate = (() => {
    try {
      return toGregorian(jalaliDate)
    } catch {
      return today()
    }
  })()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'ویرایش جلسه' : 'ثبت جلسه مطالعه'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 2: Date */}
        <div>
          <label className="label mb-1 text-base">تاریخ</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="btn-ghost p-1 text-text-secondary hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-text-primary">
                {(() => {
                  try {
                    return toJalaliLong(gregorianDisplayDate)
                  } catch {
                    return jalaliDate
                  }
                })()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="btn-ghost p-1 text-text-secondary hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {errors.jalaliDate && (
            <p className="text-xs text-danger mt-1">{errors.jalaliDate}</p>
          )}
        </div>

        {/* Field 3: Activities */}
        <div>
          <label className="label mb-1">فعالیت‌های آموزشی در طول روز</label>
          <Textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            placeholder="مثال: ۴ ساعت و نیم آزمون مانتیس - ۱ ساعت تحلیل آزمون - ۲ ساعت فصل ۴۱ کمپبل"
            rows={4}
          />
          {/* Quick-add row */}
          <div className="mt-2 flex gap-2 items-end">
            <Select
              label=""
              value={quickSubject}
              onChange={(e) => setQuickSubject(e.target.value)}
              options={[
                { value: '', label: 'درس...' },
                ...subjects.map((s) => ({ value: s.id, label: s.name })),
              ]}
              className="flex-1"
            />
            <Input
              label=""
              type="number"
              step="0.5"
              min="0.5"
              value={quickDuration}
              onChange={(e) => setQuickDuration(e.target.value)}
              placeholder="مدت (ساعت)"
              className="w-24"
            />
            <Button type="button" variant="secondary" onClick={handleQuickAdd} className="text-xs">
              افزودن
            </Button>
          </div>
          {errors.activities && (
            <p className="text-xs text-danger mt-1">{errors.activities}</p>
          )}
        </div>

        {/* Field 4: Wake time */}
        <Input
          label="ساعت بیداری صبح"
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          placeholder="۰۶:۰۰"
          error={errors.wakeTime}
          required
        />

        {/* Field 5: Sleep time */}
        <Input
          label="ساعت خواب شب"
          type="time"
          value={sleepTime}
          onChange={(e) => setSleepTime(e.target.value)}
          placeholder="۲۳:۰۰"
          error={errors.sleepTime}
          required
        />

        {/* Field 6: Phone usage */}
        <div>
          <label className="label mb-1">مجموع ساعت کار با گوشی (غیردرسی)</label>
          <div className="flex items-center gap-2">
            <Input
              label=""
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={phoneHours}
              onChange={(e) => setPhoneHours(e.target.value)}
              placeholder="۲"
              error={errors.phoneHours}
              required
              className="w-24"
            />
            <span className="text-sm text-text-secondary">ساعت</span>
          </div>
        </div>

        {serverError && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editing ? 'به‌روزرسانی' : 'ذخیره'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}