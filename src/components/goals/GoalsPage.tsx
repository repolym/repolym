import React, { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGoals } from '../../hooks/useGoals'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useToast } from '../../context/ToastContext'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import type { Goal, GoalFormData } from '../../types/database'
import { GoalForm } from './GoalForm'
import { GoalCard } from './GoalCard'
import { Button } from '../common/Button'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { daysAgo, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'

export const GoalsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const { data: goals, loading, error, refetch, createGoal, updateGoal, deleteGoal } = useGoals({
    userId: user?.id ?? null,
    status: 'active',
  })

  const { data: sessions } = useStudySessions({
    userId: user?.id ?? null,
    dateFrom: daysAgo(31),
    dateTo: today(),
  })

  const goalsWithProgress = useMemo(
    () => calculateGoalsProgress(goals, sessions),
    [goals, sessions]
  )

  const handleCreate = async (data: GoalFormData): Promise<boolean> => {
    const ok = await createGoal(data)
    if (ok) showToast('هدف با موفقیت ایجاد شد', 'success')
    return ok
  }

  const handleUpdate = async (data: GoalFormData): Promise<boolean> => {
    if (!editing) return false
    const ok = await updateGoal(editing.id, data)
    if (ok) {
      showToast('هدف به‌روزرسانی شد', 'success')
      setEditing(null)
    }
    return ok
  }

  const handleDelete = async (id: string) => {
    await deleteGoal(id)
    showToast('هدف حذف شد', 'success')
  }

  const handleStatusChange = async (id: string, status: Goal['status']) => {
    await updateGoal(id, { status })
    showToast('هدف به عنوان تکمیل‌شده علامت خورد', 'success')
  }

  const openEdit = (goal: Goal) => {
    setEditing(goal)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  if (loading && goals.length === 0) return <PageLoader />

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-text-primary">اهداف</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{toPersianDigits(goals.length)} هدف فعال</p>
        </div>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          افزودن هدف
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!error && goals.length === 0 && (
        <EmptyState
          title="هدف فعالی وجود ندارد"
          description="برای پیگیری مطالعه خود اهداف روزانه، هفتگی یا ماهانه تعیین کنید"
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              ایجاد اولین هدف
            </Button>
          }
        />
      )}

      {goalsWithProgress.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goalsWithProgress.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <GoalForm
        isOpen={formOpen}
        onClose={handleClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        editing={editing}
      />
    </div>
  )
}
