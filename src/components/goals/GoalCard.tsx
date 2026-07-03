import React, { useState } from 'react'
import type { Goal, GoalWithProgress } from '../../types/database'
import { formatMinutes } from '../../utils/date-utils'
import { ConfirmModal } from '../common/Modal'
import { Button } from '../common/Button'
import { toPersianDigits } from '../../utils/jalali'
import { toJalaliShort } from '../../utils/jalali'

interface GoalCardProps {
  goal: GoalWithProgress
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: Goal['status']) => Promise<void>
}

const periodLabel: Record<string, string> = { day: 'روزانه', week: 'هفتگی', month: 'ماهانه' }

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onStatusChange }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(goal.id) }
    finally { setDeleting(false); setConfirmOpen(false) }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try { await onStatusChange(goal.id, 'completed') }
    finally { setCompleting(false) }
  }

  const isComplete = goal.progress_percent >= 100
  const statusColor = isComplete ? 'text-success' : goal.progress_percent >= 75 ? 'text-accent' : 'text-text-tertiary'

  return (
    <>
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-medium text-text-primary">{goal.title}</h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              {formatMinutes(goal.target_minutes)} {periodLabel[goal.period]}
              {goal.end_date && ` · پایان ${toJalaliShort(goal.end_date)}`}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(goal)} className="btn-ghost text-xs" title="ویرایش">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="btn-ghost text-xs hover:text-danger"
              title="حذف"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${isComplete ? 'bg-success' : 'bg-accent'} transition-all duration-500`}
            style={{ width: `${Math.min(100, goal.progress_percent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {formatMinutes(goal.progress_minutes)} / {formatMinutes(goal.target_minutes)}
          </p>
          <span className={`text-xs font-semibold font-mono ${statusColor}`}>
            {toPersianDigits(goal.progress_percent)}%
          </span>
        </div>

        {isComplete && goal.status === 'active' && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <Button
              variant="secondary"
              size="sm"
              loading={completing}
              onClick={handleComplete}
              className="w-full"
            >
              علامت‌گذاری به عنوان تکمیل‌شده
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="حذف هدف"
        message="این هدف برای همیشه حذف خواهد شد."
        loading={deleting}
      />
    </>
  )
}
