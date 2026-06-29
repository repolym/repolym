import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import type { Subject } from '../../types/database'
import { Modal, ConfirmModal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { EmptyState, PageLoader } from '../common/Loading'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6',
  '#f97316', '#06b6d4',
]

interface SubjectFormData { name: string; color: string }

const SubjectForm: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (d: SubjectFormData) => Promise<boolean>
  editing?: Subject | null
}> = ({ isOpen, onClose, onSubmit, editing }) => {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (editing) { setName(editing.name); setColor(editing.color) }
    else { setName(''); setColor(PRESET_COLORS[0]) }
    setError('')
  }, [editing, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('نام درس الزامی است'); return }
    setLoading(true)
    try {
      const ok = await onSubmit({ name: name.trim(), color })
      if (ok) onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'ویرایش درس' : 'درس جدید'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="نام درس"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: ریاضی، فیزیک"
          error={error}
          required
          autoFocus
        />
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">رنگ</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-xs transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editing ? 'ذخیره' : 'افزودن'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: subjects, loading, createSubject, updateSubject, deleteSubject } = useSubjects(user?.id ?? null)

  const handleCreate = async (d: SubjectFormData) => {
    const ok = await createSubject(d)
    if (ok) showToast('درس اضافه شد', 'success')
    return ok
  }

  const handleUpdate = async (d: SubjectFormData) => {
    if (!editing) return false
    const ok = await updateSubject(editing.id, d)
    if (ok) { showToast('درس ویرایش شد', 'success'); setEditing(null) }
    return ok
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteSubject(deleting)
    showToast('درس حذف شد', 'success')
    setDeleting(null)
  }

  if (loading && subjects.length === 0) return <PageLoader />

  return (
    <div className="p-5 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-text-primary">دروس</h1>
          <p className="text-xs text-text-tertiary mt-0.5">برچسب‌گذاری جلسات و آزمون‌ها</p>
        </div>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          درس جدید
        </Button>
      </div>

      {subjects.length === 0 && (
        <EmptyState
          title="هنوز درسی تعریف نشده"
          description="دروست رو تعریف کن تا بتونی جلسات و آزمون‌ها رو دسته‌بندی کنی."
          action={<Button variant="primary" onClick={() => setFormOpen(true)}>اضافه کردن درس</Button>}
        />
      )}

      {subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subjects.map((s) => (
            <div key={s.id} className="card-hover px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-2xs flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-text-primary flex-1">{s.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(s); setFormOpen(true) }}
                  className="btn-ghost text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleting(s.id)}
                  className="btn-ghost text-xs hover:text-danger"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubjectForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={editing ? handleUpdate : handleCreate}
        editing={editing}
      />

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="حذف درس"
        message="این درس حذف می‌شود. جلسات مرتبط بدون درس باقی می‌مانند."
        confirmLabel="حذف"
      />
    </div>
  )
}
