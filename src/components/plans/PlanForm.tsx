import React, { useEffect, useState } from 'react'
import type { Plan, PlanFormData } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select, Textarea } from '../common/Input'
import { JalaliDateInput } from '../common/JalaliDateInput'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'

interface PlanFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: PlanFormData) => Promise<boolean>
    editing?: Plan | null
}

const defaultForm = (): PlanFormData => ({
    title: '',
    description: '',
    type: 'daily',
    priority: 'medium',
    status: 'pending',
    progress: 0,
    start_date: today(),
    end_date: null,
    due_date: null,
    estimated_duration: 60,
    dependencies: null,
    recurring: null,
})

const typeOptions = [
    { value: 'daily', label: 'روزانه' },
    { value: 'weekly', label: 'هفتگی' },
    { value: 'monthly', label: 'ماهانه' },
    { value: 'exam', label: 'آزمون' },
    { value: 'flexible', label: 'انعطاف‌پذیر' },
]

const priorityOptions = [
    { value: 'low', label: 'کم' },
    { value: 'medium', label: 'متوسط' },
    { value: 'high', label: 'بالا' },
]

export const PlanForm: React.FC<PlanFormProps> = ({ isOpen, onClose, onSubmit, editing }) => {
    const [form, setForm] = useState<PlanFormData>(defaultForm())
    const [errors, setErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({})
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        if (editing) {
            setForm({
                title: editing.title,
                description: editing.description || '',
                type: editing.type,
                priority: editing.priority,
                status: editing.status,
                progress: editing.progress,
                start_date: editing.start_date,
                end_date: editing.end_date,
                due_date: editing.due_date,
                estimated_duration: editing.estimated_duration,
                dependencies: editing.dependencies || null,
                recurring: editing.recurring || null,
            })
        } else {
            setForm(defaultForm())
        }
        setErrors({})
        setServerError(null)
    }, [editing, isOpen])

const validate = (): boolean => {
  const e: typeof errors = {}
  if (!form.title.trim()) e.title = 'عنوان برنامه الزامی است'
  if (!form.start_date) e.start_date = 'تاریخ شروع الزامی است'
  
  if (form.end_date && form.end_date < form.start_date) {
    e.end_date = 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد'
  }
  if (form.due_date && form.due_date < form.start_date) {
    e.due_date = 'تاریخ سررسید نمی‌تواند قبل از تاریخ شروع باشد'
  }
  
  // اضافه: بررسی معتبر بودن نوع و اولویت (اگر از select می‌آید، معمولاً درست است)
  const validTypes = ['daily', 'weekly', 'monthly', 'exam', 'flexible'];
  if (!validTypes.includes(form.type)) {
    e.type = 'نوع برنامه نامعتبر است';
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
            setServerError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'ویرایش برنامه' : 'برنامه جدید'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="عنوان"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="عنوان برنامه"
                    error={errors.title}
                    required
                    autoFocus
                />

                <Textarea
                    label="توضیحات"
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="توضیحات بیشتر..."
                />

                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="نوع"
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Plan['type'] }))}
                        options={typeOptions}
                    />
                    <Select
                        label="اولویت"
                        value={form.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Plan['priority'] }))}
                        options={priorityOptions}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <JalaliDateInput
                        label="تاریخ شروع"
                        value={form.start_date}
                        onChange={(date) => setForm((f) => ({ ...f, start_date: date }))}
                        error={errors.start_date}
                        required
                    />
                    <JalaliDateInput
                        label="تاریخ پایان (اختیاری)"
                        value={form.end_date || ''}
                        onChange={(date) => setForm((f) => ({ ...f, end_date: date || null }))}
                        min={form.start_date}
                        error={errors.end_date}
                    />
                    <JalaliDateInput
                        label="سررسید (اختیاری)"
                        value={form.due_date || ''}
                        onChange={(date) => setForm((f) => ({ ...f, due_date: date || null }))}
                        min={form.start_date}
                        error={errors.due_date}
                    />
                </div>

                <Input
                    label="مدت تخمینی (دقیقه)"
                    type="number"
                    min={0}
                    value={form.estimated_duration || ''}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_duration: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="۶۰"
                />

                {serverError && (
                    <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">
                        {serverError}
                    </p>
                )}

                <div className="flex gap-2 justify-end pt-1">
                    <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        {editing ? 'به‌روزرسانی' : 'ایجاد'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}