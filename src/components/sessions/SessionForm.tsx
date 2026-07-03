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

  const minuteRegex = /(\d+(?:\.\d+)?)\s*دقیقه/g
  while ((match = minuteRegex.exec(text)) !== null) {
    totalHours += parseFloat(match[1]) / 60
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
  const [jalaliDate, setJalaliDate] = useState<string>(todayJalali())
  const [activities, setActivities] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepTime, setSleepTime] = useState('')
  const [phoneHours, setPhoneHours] = useState('')

  // New fields
  const [resource, setResource] = useState('')
  const [questionCount, setQuestionCount] = useState('')
  const [questionDifficulty, setQuestionDifficulty] = useState('')
  const [estimatedDifficulty, setEstimatedDifficulty] = useState('')
  const [questionType, setQuestionType] = useState('')
  const [todoRelation, setTodoRelation] = useState('')
  const [tags, setTags] = useState('')

  const [quickSubject, setQuickSubject] = useState('')
  const [quickDuration, setQuickDuration] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (editing) {
      const parsed = parseNotesJSON(editing.notes)
      setActivities(parsed.activities)
      setWakeTime(parsed.wake)
      setSleepTime(parsed.sleep)
      setPhoneHours(parsed.phone)
      setJalaliDate(toJalali(editing.date))
      // Set new fields from editing object
      setResource(editing.resource || '')
      setQuestionCount(editing.question_count?.toString() || '')
      setQuestionDifficulty(editing.question_difficulty || '')
      setEstimatedDifficulty(editing.estimated_difficulty?.toString() || '')
      setQuestionType(editing.question_type || '')
      setTodoRelation(editing.todo_relation || '')
      setTags(editing.tags || '')
    } else {
      setActivities('')
      setWakeTime('')
      setSleepTime('')
      setPhoneHours('')
      setJalaliDate(todayJalali())
      // Reset new fields
      setResource('')
      setQuestionCount('')
      setQuestionDifficulty('')
      setEstimatedDifficulty('')
      setQuestionType('')
      setTodoRelation('')
      setTags('')
    }
    setErrors({})
    setServerError(null)
  }, [editing, isOpen])

  const changeDate = (days: number) => {
    try {
      const greg = toGregorian(jalaliDate)
      const d = new Date(greg + 'T00:00:00')
      d.setDate(d.getDate() + days)
      const newGreg = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      const newJalali = toJalali(newGreg)
      setJalaliDate(newJalali)
    } catch { /* ignore */ }
  }

  const handleQuickAdd = () => {
    if (!quickSubject || !quickDuration) return
    const subj = subjects.find((s) => s.id === quickSubject)
    if (!subj) return
    const line = `• ${subj.name} - ${quickDuration} دقیقه\n`
    setActivities((prev) => (prev ? prev + line : line))
    setQuickSubject('')
    setQuickDuration('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
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
      newErrors.activities = 'حداقل یک فعالیت با ساعت یا دقیقه وارد کنید'
    } else if (computedDuration > 24 * 60) {
      newErrors.activities = 'مجموع ساعات مطالعه نمی‌تواند بیش از ۲۴ ساعت در روز باشد'
    } else if (!isNaN(phoneHoursNum) && phoneHoursNum >= 0 && computedDuration / 60 + phoneHoursNum > 24) {
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
        // New fields - optional
        resource: resource.trim() || null,
        question_count: questionCount ? Number(questionCount) : null,
        question_difficulty: questionDifficulty.trim() || null,
        estimated_difficulty: estimatedDifficulty ? Number(estimatedDifficulty) : null,
        question_type: questionType.trim() || null,
        todo_relation: todoRelation.trim() || null,
        tags: tags.trim() || null,
      }

      const ok = await onSubmit(data)
      if (ok) onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی')
    } finally {
      setLoading(false)
    }
  }

  const gregorianDisplayDate = (() => {
    try { return toGregorian(jalaliDate) }
    catch { return today() }
  })()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'ویرایش جلسه' : 'ثبت جلسه مطالعه'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="label mb-1 text-base">تاریخ</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeDate(-1)}
              className="btn-ghost p-1 text-text-secondary hover:text-text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-text-primary whitespace-nowrap">
                {(() => {
                  try { return toJalaliLong(gregorianDisplayDate) }
                  catch { return jalaliDate }
                })()}
              </p>
            </div>
            <button type="button" onClick={() => changeDate(1)}
              className="btn-ghost p-1 text-text-secondary hover:text-text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {errors.jalaliDate && <p className="text-xs text-danger mt-1">{errors.jalaliDate}</p>}
        </div>

        {/* Activities */}
        <div>
          <label className="label mb-1">فعالیت‌های آموزشی در طول روز</label>
          <Textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            placeholder="مثال: ۴ ساعت و نیم آزمون مانتیس - ۱ ساعت تحلیل آزمون - ۲ ساعت فصل ۴۱ کمپبل"
            rows={4}
          />
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
              step="1"
              min="1"
              value={quickDuration}
              onChange={(e) => setQuickDuration(e.target.value)}
              placeholder="مدت (دقیقه)"
              className="w-32"
            />
            <Button type="button" variant="secondary" onClick={handleQuickAdd} className="text-xs">
              افزودن
            </Button>
          </div>
          {errors.activities && <p className="text-xs text-danger mt-1">{errors.activities}</p>}
        </div>

        {/* Wake time */}
        <Input
          label="ساعت بیداری صبح"
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          placeholder="۰۶:۰۰"
          error={errors.wakeTime}
          required
        />

        {/* Sleep time */}
        <Input
          label="ساعت خواب شب"
          type="time"
          value={sleepTime}
          onChange={(e) => setSleepTime(e.target.value)}
          placeholder="۲۳:۰۰"
          error={errors.sleepTime}
          required
        />

        {/* Phone usage */}
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
              className="w-32"
            />
            <span className="text-sm text-text-secondary">ساعت</span>
          </div>
        </div>

        {/* ====== NEW FIELDS ====== */}
        <details className="mt-4 border-t border-gray-200 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
            جزئیات بیشتر (اختیاری)
          </summary>
          <div className="mt-4 space-y-4">
            <Input
              label="منبع مطالعه"
              type="text"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="نام کتاب، وب‌سایت، استاد..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="تعداد سوالات"
                type="number"
                min="0"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder="مثلاً ۲۰"
              />
              <Input
                label="سطح دشواری سوالات"
                type="text"
                value={questionDifficulty}
                onChange={(e) => setQuestionDifficulty(e.target.value)}
                placeholder="آسان، متوسط، سخت"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="دشواری تخمینی (از ۱ تا ۱۰)"
                type="number"
                min="1"
                max="10"
                value={estimatedDifficulty}
                onChange={(e) => setEstimatedDifficulty(e.target.value)}
                placeholder="عدد ۱ تا ۱۰"
              />
              <Input
                label="نوع سوالات"
                type="text"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                placeholder="تشریحی، تستی، ترکیبی"
              />
            </div>

            <Input
              label="ارتباط با وظیفه (Todo)"
              type="text"
              value={todoRelation}
              onChange={(e) => setTodoRelation(e.target.value)}
              placeholder="مثلاً: مرور فصل ۳"
            />

            <Input
              label="برچسب‌ها (با کاما جدا کنید)"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ریاضی, تست, مرور"
            />
          </div>
        </details>

        {serverError && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editing ? 'به‌روزرسانی' : 'ذخیره'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
