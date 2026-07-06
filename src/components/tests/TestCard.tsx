import React, { useState } from 'react'
import type { Test } from '../../types/database'
import { formatDate } from '../../utils/date-utils'
import { ConfirmModal } from '../common/Modal'
import { toPersianDigits } from '../../utils/jalali'

interface TestCardProps {
  test: Test
  onEdit: (test: Test) => void
  onDelete: (id: string) => Promise<void>
}

export const TestCard: React.FC<TestCardProps> = ({ test, onEdit, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const pct = Math.round((test.score / (test.max_score || 100)) * 100)
  const color = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-accent' : pct >= 40 ? 'text-warning' : 'text-danger'
  const barColor = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-accent' : pct >= 40 ? 'bg-warning' : 'bg-danger'
  const subject = test.subjects

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(test.id) }
    finally { setDeleting(false); setConfirmOpen(false) }
  }

  return (
    <>
      <div className="card-hover px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Score circle */}
          <div className={`text-center w-12 flex-shrink-0`}>
            <span className={`text-lg font-semibold font-mono ${color}`}>
              {toPersianDigits(pct)}%
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text-primary truncate">{test.name}</span>
              {subject && (
                <span
                  className="badge text-2xs"
                  style={{ backgroundColor: subject.color + '20', color: subject.color }}
                >
                  {subject.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-1 w-20 bg-surface-3 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-text-tertiary">
                {toPersianDigits(test.score)} از {toPersianDigits(test.max_score)}
              </span>
            </div>
          </div>

          {/* Date */}
          <p className="text-xs text-text-tertiary flex-shrink-0 hidden sm:block">
            {formatDate(test.date)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(test)} className="btn-ghost text-xs" title="ویرایش">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => setConfirmOpen(true)} className="btn-ghost text-xs hover:text-danger" title="حذف">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="حذف آزمون"
        message="این آزمون برای همیشه حذف می‌شود."
        confirmLabel="حذف"
        loading={deleting}
      />
    </>
  )
}
