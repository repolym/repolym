import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Test, TestFormData, Subject } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select, Textarea } from '../common/Input'
import { JalaliDateInput } from '../common/JalaliDateInput'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'

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
  correct_count: null,
  wrong_count: null,
  skipped_count: null,
  total_questions: null,
  avg_time_seconds: null,
})

export const TestForm: React.FC<TestFormProps> = ({ isOpen, onClose, onSubmit, subjects, editing }) => {
  const [form, setForm] = useState<TestFormData>(defaultForm())
  const [errors, setErrors] = useState<Partial<Record<keyof TestFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        subject_id: editing.subject_id,
        name: editing.name,
        score: editing.score,
        max_score: editing.max_score,
        date: editing.date,
        notes: editing.notes || '',
        correct_count: editing.correct_count ?? null,
        wrong_count: editing.wrong_count ?? null,
        skipped_count: editing.skipped_count ?? null,
        total_questions: editing.total_questions ?? null,
        avg_time_seconds: editing.avg_time_seconds ?? null,
      })
      setShowAdvanced(
        editing.correct_count != null ||
        editing.wrong_count != null ||
        editing.skipped_count != null ||
        editing.total_questions != null ||
        editing.avg_time_seconds != null
      )
    } else {
      setForm(defaultForm())
      setShowAdvanced(false)
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

    const { correct_count, wrong_count, skipped_count, total_questions } = form
    const parts = [correct_count, wrong_count, skipped_count].filter((v) => v != null) as number[]
    if (parts.some((v) => v < 0)) {
      e.correct_count = 'مقادیر نمی‌توانند منفی باشند'
    }
    if (total_questions != null && parts.length > 0) {
      const sum = (correct_count ?? 0) + (wrong_count ?? 0) + (skipped_count ?? 0)
      if (sum > total_questions) {
        e.total_questions = 'مجموع صحیح+غلط+نزده از تعداد کل سوالات بیشتر است'
      }
    }
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

        {/* Layout: date takes 2 columns, score and max_score stacked in 1 column */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <JalaliDateInput
              label="تاریخ"
              value={form.date}
              onChange={(date) => setForm((f) => ({ ...f, date }))}
              max={today()}
              error={errors.date}
              required
            />
          </div>
          <div className="col-span-1 space-y-3">
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
          </div>
        </div>

        <div className="border border-border rounded-xs">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>جزئیات پاسخگویی (اختیاری) — برای آمار دقیق درصد صحیح/غلط/نزده</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          {showAdvanced && (
            <div className="p-3 pt-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="تعداد کل سوالات"
                  type="number"
                  min={0}
                  value={form.total_questions ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, total_questions: e.target.value === '' ? null : Number(e.target.value) }))}
                  error={errors.total_questions}
                />
                <Input
                  label="پاسخ صحیح"
                  type="number"
                  min={0}
                  value={form.correct_count ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, correct_count: e.target.value === '' ? null : Number(e.target.value) }))}
                  error={errors.correct_count}
                />
                <Input
                  label="پاسخ غلط"
                  type="number"
                  min={0}
                  value={form.wrong_count ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, wrong_count: e.target.value === '' ? null : Number(e.target.value) }))}
                />
                <Input
                  label="نزده"
                  type="number"
                  min={0}
                  value={form.skipped_count ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, skipped_count: e.target.value === '' ? null : Number(e.target.value) }))}
                />
              </div>
              <Input
                label="میانگین زمان هر سوال (ثانیه)"
                type="number"
                min={0}
                value={form.avg_time_seconds ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, avg_time_seconds: e.target.value === '' ? null : Number(e.target.value) }))}
                placeholder="مثلاً ۹۰"
              />
            </div>
          )}
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
