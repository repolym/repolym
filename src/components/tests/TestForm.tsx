import React, { useEffect, useState } from 'react'
import type { Test, TestFormData, Subject } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select, Textarea } from '../common/Input'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'
import { toJalaliLong } from '../../utils/jalali'

interface TestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TestFormData) => Promise<boolean>
  subjects: Subject[]
  editing?: Test | null
}

const defaultForm = (): TestFormData => ({
  subject_id: null,
  name: '',
  score: 0,
  max_score: 100,
  date: today(),
  notes: '',
})

export const TestForm: React.FC<TestFormProps> = ({ isOpen, onClose, onSubmit, subjects, editing }) => {
  const [form, setForm] = useState<TestFormData>(defaultForm())
  const [errors, setErrors] = useState<Partial<Record<keyof TestFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (editing) {
      setForm({
        subject_id: editing.subject_id,
        name: editing.name,
        score: editing.score,
        max_score: editing.max_score,
        date: editing.date,
        notes: editing.notes || '',
      })
    } else {
      setForm(defaultForm())
    }
    setErrors({})
    setServerError(null)
  }, [editing, isOpen])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'نام آزمون الزامی است'
    if (form.score < 0) e.score = 'نمره نمی‌تواند منفی باشد'
    if (form.score > form.max_score) e.score = 'نمره از حداکثر بیشتر است'
    if (!form.date) e.date = 'تاریخ الزامی است'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const ok = await onSubmit(form)
      if (ok) onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setLoading(false)
    }
  }

  const subjectOptions = [
    { value: '', label: 'بدون درس' },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'ویرایش آزمون' : 'ثبت آزمون'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="نام آزمون"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="مثلاً: آزمون فصل سوم فیزیک"
          error={errors.name}
          required
          autoFocus
        />

        <Select
          label="درس"
          value={form.subject_id || ''}
          onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value || null }))}
          options={subjectOptions}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="نمره"
            type="number"
            value={form.score}
            onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
            min={0}
            error={errors.score}
            required
          />
          <Input
            label="از"
            type="number"
            value={form.max_score}
            onChange={(e) => setForm((f) => ({ ...f, max_score: Number(e.target.value) }))}
            min={1}
          />
          <div>
            <Input
              label="تاریخ"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              max={today()}
              error={errors.date}
              required
            />
            {form.date && (
              <p className="text-2xs text-text-tertiary mt-0.5">
                {toJalaliLong(form.date)}
              </p>
            )}
          </div>
        </div>

        <Textarea
          label="یادداشت (اختیاری)"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="نکات مهم..."
        />

        {serverError && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editing ? 'ذخیره تغییرات' : 'ثبت آزمون'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}