import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTests } from '../../hooks/useTests'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import type { Test, TestFormData } from '../../types/database'
import { TestForm } from './TestForm'
import { TestCard } from './TestCard'
import { Button } from '../common/Button'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { daysAgo, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'

export const TestsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Test | null>(null)

  const { data: tests, loading, error, refetch, createTest, updateTest, deleteTest } = useTests({
    userId: user?.id ?? null,
    dateFrom: daysAgo(180),
    dateTo: today(),
  })

  const { data: subjects } = useSubjects(user?.id ?? null)

  const handleCreate = async (data: TestFormData): Promise<boolean> => {
    const ok = await createTest(data)
    if (ok) showToast('آزمون با موفقیت ثبت شد', 'success')
    return ok
  }

  const handleUpdate = async (data: TestFormData): Promise<boolean> => {
    if (!editing) return false
    const ok = await updateTest(editing.id, data)
    if (ok) { showToast('آزمون به‌روزرسانی شد', 'success'); setEditing(null) }
    return ok
  }

  const handleDelete = async (id: string) => {
    await deleteTest(id)
    showToast('آزمون حذف شد', 'success')
  }

  const handleClose = () => { setFormOpen(false); setEditing(null) }

  if (loading && tests.length === 0) return <PageLoader />

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-text-primary">آزمون‌ها</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            {toPersianDigits(tests.length)} آزمون ثبت‌شده
          </p>
        </div>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ثبت آزمون
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!error && tests.length === 0 && (
        <EmptyState
          title="آزمونی ثبت نشده"
          description="نتایج آزمون‌هایت را اینجا ثبت کن تا پیشرفتت را ببینی"
          action={<Button variant="primary" onClick={() => setFormOpen(true)}>ثبت اولین آزمون</Button>}
        />
      )}

      {tests.length > 0 && (
        <div className="space-y-1">
          {tests.map((t) => (
            <TestCard
              key={t.id}
              test={t}
              onEdit={(test) => { setEditing(test); setFormOpen(true) }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TestForm
        isOpen={formOpen}
        onClose={handleClose}
        onSubmit={editing ? handleUpdate : handleCreate}
        subjects={subjects}
        editing={editing}
      />
    </div>
  )
}