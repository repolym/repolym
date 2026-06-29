import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import type { StudySession, SessionFormData } from '../../types/database'
import { SessionForm } from './SessionForm'
import { SessionCard } from './SessionCard'
import { Button } from '../common/Button'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { daysAgo, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'

export const SessionsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StudySession | null>(null)

  const { data: sessions, loading, error, refetch, createSession, updateSession, deleteSession } =
    useStudySessions({
      userId: user?.id ?? null,
      dateFrom: daysAgo(90),
      dateTo: today(),
    })

  const { data: subjects } = useSubjects(user?.id ?? null)

  const handleCreate = async (data: SessionFormData): Promise<boolean> => {
    const ok = await createSession(data)
    if (ok) showToast('جلسه با موفقیت ثبت شد', 'success')
    return ok
  }

  const handleUpdate = async (data: SessionFormData): Promise<boolean> => {
    if (!editing) return false
    const ok = await updateSession(editing.id, data)
    if (ok) {
      showToast('جلسه به‌روزرسانی شد', 'success')
      setEditing(null)
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
    const link = `${window.location.origin}/public/${user.id}`
    navigator.clipboard.writeText(link).then(() => {
      showToast('لینک کپی شد!', 'success')
    }).catch(() => {
      showToast('خطا در کپی لینک', 'error')
    })
  }

  if (loading && sessions.length === 0) return <PageLoader />

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-text-primary">جلسات مطالعه</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            ۹۰ روز اخیر · {toPersianDigits(sessions.length)} جلسه
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleShare} className="text-xs">
            <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            اشتراک‌گذاری ساعات مطالعه
          </Button>
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ثبت جلسه
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!error && sessions.length === 0 && (
        <EmptyState
          title="هنوز جلسه‌ای ثبت نشده"
          description="برای پیگیری پیشرفت خود جلسات مطالعه را ثبت کنید"
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              ثبت اولین جلسه
            </Button>
          }
        />
      )}

      {sessions.length > 0 && (
        <div className="space-y-1">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

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