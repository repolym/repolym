import React, { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import type { Subject } from '../../types/database'
import { Modal, ConfirmModal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { EmptyState, PageLoader } from '../common/Loading'
import { OLYMPIADS, getOlympiad, type OlympiadId } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import { formatError } from '../../utils/error-handler'
import { Check } from 'lucide-react'

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

const OlympiadPicker: React.FC<{
  isOpen: boolean
  onClose: () => void
  currentOlympiadId: string | null
  existingSubjectNames: string[]
}> = ({ isOpen, onClose, currentOlympiadId, existingSubjectNames }) => {
  const { completeOnboarding } = useAuth()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<OlympiadId | null>(currentOlympiadId as OlympiadId | null)
  const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const olympiad = useMemo(() => OLYMPIADS.find((o) => o.id === selected) ?? null, [selected])

  const pick = (id: OlympiadId) => {
    setSelected(id)
    const preset = OLYMPIADS.find((o) => o.id === id)
    // فقط دروسی که هنوز در فهرست کاربر نیستند به‌صورت پیش‌فرض تیک می‌خورند
    const fresh = (preset?.defaultSubjects ?? []).filter((s) => !existingSubjectNames.includes(s.name))
    setCheckedSubjects(new Set(fresh.map((s) => s.name)))
  }

  const toggleSubject = (name: string) => {
    setCheckedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const preset = OLYMPIADS.find((o) => o.id === selected)
      const subjectsToAdd = (preset?.defaultSubjects ?? []).filter((s) => checkedSubjects.has(s.name))
      await completeOnboarding({ olympiadId: selected, subjects: subjectsToAdd })
      showToast('المپیاد به‌روزرسانی شد', 'success')
      onClose()
    } catch (err) {
      showToast(formatError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تغییر المپیاد" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {OLYMPIADS.map((o) => {
            const Icon = OLYMPIAD_ICON_MAP[o.icon]
            const active = selected === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o.id)}
                className={`relative text-right p-3 rounded-xl border-2 transition-all overflow-hidden ${
                  active ? 'border-accent ring-2 ring-accent-subtle' : 'border-border hover:border-border-strong'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${o.accent}1A`, color: o.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-text-primary">{o.shortLabel}</p>
                {active && (
                  <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {olympiad && olympiad.defaultSubjects.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-tertiary mb-2">
              دروس پیشنهادی {olympiad.shortLabel} — موارد انتخاب‌شده به دروس شما اضافه می‌شود
            </p>
            <div className="flex flex-wrap gap-2">
              {olympiad.defaultSubjects.map((s) => {
                const already = existingSubjectNames.includes(s.name)
                const checked = checkedSubjects.has(s.name)
                return (
                  <button
                    key={s.name}
                    type="button"
                    disabled={already}
                    onClick={() => toggleSubject(s.name)}
                    className={`inline-flex items-center gap-1.5 pr-3 pl-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      already
                        ? 'opacity-50 cursor-not-allowed'
                        : checked
                          ? ''
                          : 'grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                    }`}
                    style={{ backgroundColor: `${s.color}14`, borderColor: `${s.color}33`, color: s.color }}
                    title={already ? 'قبلاً اضافه شده' : undefined}
                  >
                    {checked || already ? <Check className="w-3 h-3" /> : null}
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="button" variant="primary" loading={saving} disabled={!selected} onClick={handleSave}>
            ذخیره
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [olympiadPickerOpen, setOlympiadPickerOpen] = useState(false)

  const { data: subjects, loading, createSubject, updateSubject, deleteSubject, refetch } = useSubjects(user?.id ?? null)

  const olympiadTheme = user?.olympiad_id ? getOlympiad(user.olympiad_id) : null
  const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null

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
      <div className="flex items-center justify-between mb-4">
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

      {/* نوار هویت المپیاد */}
      <button
        type="button"
        onClick={() => setOlympiadPickerOpen(true)}
        className="w-full flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-border-subtle hover:border-border transition-colors text-right"
      >
        {olympiadTheme && OlympiadIcon ? (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${olympiadTheme.accent}1A`, color: olympiadTheme.accent }}
          >
            <OlympiadIcon className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0 text-text-tertiary text-xs">
            ؟
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {olympiadTheme ? olympiadTheme.label : 'المپیادی انتخاب نشده'}
          </p>
          <p className="text-xs text-text-tertiary">برای تغییر المپیاد و افزودن دروس پیشنهادی کلیک کنید</p>
        </div>
      </button>

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

      <OlympiadPicker
        isOpen={olympiadPickerOpen}
        onClose={() => { setOlympiadPickerOpen(false); refetch() }}
        currentOlympiadId={user?.olympiad_id ?? null}
        existingSubjectNames={subjects.map((s) => s.name)}
      />
    </div>
  )
}
