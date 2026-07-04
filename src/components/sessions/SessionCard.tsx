
import React, { useState } from 'react'
import type { StudySession } from '../../types/database'
import { formatDate, formatMinutes } from '../../utils/date-utils'
import { ConfirmModal } from '../common/Modal'

interface SessionCardProps {
  session: StudySession
  onEdit: (session: StudySession) => void
  onDelete: (id: string) => Promise<void>
}

const getNotesPreview = (notes: string | null): string => {
  if (!notes) return ''
  try {
    const parsed = JSON.parse(notes)
    if (parsed.activities) {
      return parsed.activities.split('\n')[0]?.slice(0, 120) || ''
    }
    return notes.slice(0, 120)
  } catch {
    return notes.slice(0, 120)
  }
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onEdit, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(session.id)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const subject = session.subjects
  const notesPreview = getNotesPreview(session.notes)

  return (
    <>
      <div className="card-hover px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          {/* Subject color dot */}
          <div
            className="w-1.5 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: subject?.color || '#3a3a3f' }}
          />

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text-primary font-mono">
                {formatMinutes(session.duration_minutes)}
              </span>
              {subject && (
                <span
                  className="badge text-2xs"
                  style={{ backgroundColor: subject.color + '20', color: subject.color }}
                >
                  {subject.name}
                </span>
              )}
            </div>
            {notesPreview && (
              <p className="text-xs text-text-tertiary truncate mt-0.5">{notesPreview}</p>
            )}
          </div>

          {/* Date */}
          <p className="text-xs text-text-tertiary flex-shrink-0 hidden sm:block">
            {formatDate(session.date)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(session)}
              className="btn-ghost text-xs"
              title="ویرایش"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="btn-ghost text-xs text-text-tertiary hover:text-danger"
              title="حذف"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ====== NEW FIELDS DISPLAY ====== */}
        {(session.resource || session.question_count || session.tags) && (
          <div className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-500 grid grid-cols-2 gap-x-2 gap-y-0.5">
            {session.resource && (
              <p><span className="font-medium">منبع:</span> {session.resource}</p>
            )}
            {session.question_count != null && (
              <p><span className="font-medium">تعداد سوالات:</span> {session.question_count}</p>
            )}
            {session.question_difficulty && (
              <p><span className="font-medium">دشواری:</span> {session.question_difficulty}</p>
            )}
            {session.estimated_difficulty != null && (
              <p><span className="font-medium">دشواری تخمینی:</span> {session.estimated_difficulty}/۱۰</p>
            )}
            {session.question_type && (
              <p><span className="font-medium">نوع:</span> {session.question_type}</p>
            )}
            {session.todo_relation && (
              <p><span className="font-medium">ارتباط:</span> {session.todo_relation}</p>
            )}
            {session.tags && (
              <p className="col-span-2"><span className="font-medium">برچسب‌ها:</span> {session.tags}</p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="حذف جلسه"
        message="این جلسه مطالعه برای همیشه حذف خواهد شد."
        loading={deleting}
      />
    </>
  )
}
