import React, { useEffect, useState } from 'react'
import type { Goal, GoalFormData } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select } from '../common/Input'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'

interface GoalFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: GoalFormData) => Promise<boolean>
  editing?: Goal | null
}

const defaultForm = (): GoalFormData => ({
  title: '',
  target_minutes: 120,
  period: 'week',
  start_date: today(),
  end_date: null,
})

const periodOptions = [
  { value: 'day', label: 'روزانه' },
  { value: 'week', label: 'هفتگی' },
  { value: 'month', label: 'ماهانه' },
]

export const GoalForm: React.FC<GoalFormProps> = ({ isOpen, onClose, onSubmit, editing }) => {
  const [form, setForm] = useState<GoalFormData>(defaultForm())
  const [errors, setErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        target_minutes: editing.target_minutes,
        period: editing.period,
        start_date: editing.start_date,
        end_date: editing.end_date || '',
      })
    } else {
      setForm(defaultForm())
    }
    setErrors({})
    setServerError(null)
  }, [editing, isOpen])

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'عنوان هدف الزامی است'
    if (!form.target_minutes || form.target_minutes <= 0) e.target_minutes = 'باید بیشتر از ۰ باشد'
    if (!form.start_date) e.start_date = 'تاریخ شروع الزامی است'
    if (form.end_date && form.end_date < form.start_date) e.end_date = 'باید بعد از تاریخ شروع باشد'
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
      setServerError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'ویرایش هدف' : 'ایجاد هدف'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="عنوان هدف"
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="مثلاً ۱۰ ساعت ریاضی در هفته"
          error={errors.title}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="مدت هدف (دقیقه)"
            type="number"
            value={form.target_minutes}
            onChange={(e) => setForm((f) => ({ ...f, target_minutes: Number(e.target.value) }))}
            min={1}
            error={errors.target_minutes}
            required
          />
          <Select
            label="بازه"
            value={form.period}
            onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as GoalFormData['period'] }))}
            options={periodOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="تاریخ شروع"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            error={errors.start_date}
            required
          />
          <Input
            label="تاریخ پایان (اختیاری)"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            min={form.start_date}
            error={errors.end_date}
          />
        </div>

        {serverError && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {editing ? 'به‌روزرسانی' : 'ایجاد هدف'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}