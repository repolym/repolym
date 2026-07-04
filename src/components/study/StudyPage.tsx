import React, { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import type { StudySession, SessionFormData } from '../../types/database'
import { SessionForm } from '../sessions/SessionForm'
import { SessionCard } from '../sessions/SessionCard'
import { Button } from '../common/Button'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { daysAgo, today, formatDate, getWeekStart, getWeekEnd } from '../../utils/date-utils'
import { toPersianDigits, toJalaliLong } from '../../utils/jalali'
import { Calendar, Clock, BookOpen } from 'lucide-react'
import DailyCheckInForm from '../DailyCheckIn'

type FilterType = 'daily' | 'weekly' | 'date'

interface FilterState {
  type: FilterType
  selectedDate: string | null
}

export const StudyPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StudySession | null>(null)
  const [filter, setFilter] = useState<FilterState>({ type: 'daily', selectedDate: null })

  // Fetch sessions for last 90 days (enough for all filter types)
  const { data: sessions, loading, error, refetch, createSession, updateSession, deleteSession } =
    useStudySessions({
      userId: user?.id ?? null,
      dateFrom: daysAgo(90),
      dateTo: today(),
    })

  const { data: subjects } = useSubjects(user?.id ?? null)

  // Determine date range based on filter
  const getDateRange = (): [string, string] => {
    const t = today()
    switch (filter.type) {
      case 'daily':
        return [t, t]
      case 'weekly':
        return [getWeekStart(t), getWeekEnd(t)]
      case 'date':
        return filter.selectedDate ? [filter.selectedDate, filter.selectedDate] : [t, t]
      default:
        return [t, t]
    }
  }

  // Filter sessions based on active filter
  const filteredSessions = useMemo(() => {
    const [dateFrom, dateTo] = getDateRange()
    return sessions.filter((s) => {
      const sessionDate = s.date
      return sessionDate >= dateFrom && sessionDate <= dateTo
    })
  }, [sessions, filter])

  // Calculate totals for filtered sessions
  const totals = useMemo(() => {
    const totalMinutes = filteredSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    return {
      count: filteredSessions.length,
      minutes: totalMinutes,
      hours: totalHours,
      remainingMinutes,
      formatted: `${totalHours}س ${remainingMinutes}د`,
    }
  }, [filteredSessions])

  const handleCreate = async (data: SessionFormData): Promise<boolean> => {
    const ok = await createSession(data)
    if (ok) {
      showToast('جلسه با موفقیت ثبت شد', 'success')
      // Reset form and close
      setFormOpen(false)
    }
    return ok
  }

  const handleUpdate = async (data: SessionFormData): Promise<boolean> => {
    if (!editing) return false
    const ok = await updateSession(editing.id, data)
    if (ok) {
      showToast('جلسه به‌روزرسانی شد', 'success')
      setEditing(null)
      setFormOpen(false)
    }
    return ok
  }

  const handleDelete = async (id: string) => {
    await deleteSession(id)
    showToast('جلسه حذف شد', 'success')
  }

  const openEdit = (session: StudySession) => {
    setEditing(session)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleShare = () => {
    if (!user?.id) return
    const link = `${window.location.origin}#/public/${user.id}`
    navigator.clipboard.writeText(link).then(() => {
      showToast('لینک کپی شد!', 'success')
    }).catch(() => {
      showToast('خطا در کپی لینک', 'error')
    })
  }

  const getFilterLabel = (): string => {
    switch (filter.type) {
      case 'daily':
        return 'امروز'
      case 'weekly':
        return `این هفته (${formatDate(getWeekStart(today()))})`
      case 'date':
        return filter.selectedDate ? `${toJalaliLong(filter.selectedDate)}` : 'انتخاب تاریخ'
      default:
        return ''
    }
  }

  if (loading && sessions.length === 0) return <PageLoader />

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">مطالعات من</h1>
          <p className="text-gray-500 text-sm mt-1">جلسات مطالعه و پیشرفت روزانه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleShare} size="sm">
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            اشتراک‌گذاری
          </Button>
          <Button variant="primary" onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }} size="sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ثبت جلسه
          </Button>
        </div>
      </div>

      {/* Daily Check-In Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DailyCheckInForm />
        </div>

        {/* Quick Stats Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-indigo-900 mb-4">خلاصه امروز</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium mb-1">تعداد جلسات</p>
              <p className="text-2xl font-bold text-indigo-900">{toPersianDigits(totals.count)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium mb-1">مجموع زمان</p>
              <p className="text-2xl font-bold text-indigo-900">{totals.hours}س</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Session Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">ثبت جلسه مطالعه جدید</h2>
            <p className="text-xs text-gray-500 mt-0.5">درس، مدت زمان و توضیحات را وارد کنید</p>
          </div>
        </div>

        {/* Quick Add Form (Inline) */}
        <QuickAddSessionForm
          subjects={subjects}
          onSubmit={async (data) => {
            const ok = await createSession(data)
            if (ok) {
              showToast('جلسه با موفقیت ثبت شد', 'success')
            }
            return ok
          }}
        />

        <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
          برای ثبت جلسات پیچیده‌تر با جزئیات بیشتر، از دکمه "ثبت جلسه" در بالا استفاده کنید
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-800">فیلتر بر اساس تاریخ</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter({ type: 'daily', selectedDate: null })}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter.type === 'daily'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            امروز
          </button>

          <button
            onClick={() => setFilter({ type: 'weekly', selectedDate: null })}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter.type === 'weekly'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            این هفته
          </button>

          <div className="relative">
            <input
              type="date"
              value={filter.type === 'date' && filter.selectedDate ? filter.selectedDate : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setFilter({ type: 'date', selectedDate: e.target.value })
                }
              }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer ${filter.type === 'date'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          فیلتر فعلی: <span className="font-medium text-gray-700">{getFilterLabel()}</span>
        </p>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="font-bold text-gray-800">جلسات {getFilterLabel()}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {toPersianDigits(totals.count)} جلسه · {totals.formatted}
              </p>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {!error && filteredSessions.length === 0 && (
          <EmptyState
            title={filter.type === 'daily' ? 'هنوز جلسه‌ای برای امروز ثبت نشده' : 'جلسه‌ای در این دوره یافت نشد'}
            description="برای شروع مطالعه‌ی خود جلسه‌ای جدید ثبت کنید"
            action={
              <Button variant="primary" onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}>
                ثبت اولین جلسه
              </Button>
            }
          />
        )}

        {filteredSessions.length > 0 && (
          <div className="space-y-1">
            {filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <SessionForm
        isOpen={formOpen}
        onClose={handleClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        subjects={subjects}
        editing={editing}
      />
    </div>
  )
}

// Quick Add Form Component
interface QuickAddSessionFormProps {
  subjects: any[]
  onSubmit: (data: SessionFormData) => Promise<boolean>
}

const QuickAddSessionForm: React.FC<QuickAddSessionFormProps> = ({ subjects, onSubmit }) => {
  const [subjectId, setSubjectId] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !duration) {
      showToast('لطفاً درس و مدت زمان را انتخاب کنید', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const ok = await onSubmit({
        subject_id: subjectId,
        date: today(),
        duration_minutes: parseInt(duration, 10),
        notes: description.trim() || '',
      })
      if (ok) {
        setSubjectId('')
        setDuration('')
        setDescription('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">درس / مبحث *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          >
            <option value="">-- انتخاب کنید --</option>
            {subjects?.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">مدت زمان (دقیقه) *</label>
          <input
            type="number"
            min="1"
            placeholder="مثلاً 90"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات (اختیاری)</label>
          <input
            type="text"
            placeholder="توضیح کوتاه..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? 'در حال ثبت...' : 'ثبت سریع'}
      </Button>
    </form>
  )
}