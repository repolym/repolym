
import React, { useEffect, useState } from 'react'
import type { Todo, TodoFormData, Subject, StudySession, Plan } from '../../types/database'
import { Modal } from '../common/Modal'
import { Input, Select, Textarea } from '../common/Input'
import { JalaliDateInput } from '../common/JalaliDateInput'
import { Button } from '../common/Button'
import { today } from '../../utils/date-utils'

interface TodoFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: TodoFormData) => Promise<boolean>
    editing?: Todo | null
    subjects: Subject[]
    sessions: StudySession[]
    plans: Plan[]
}

const defaultForm = (): TodoFormData => ({
    title: '',
    description: '',
    subject_id: null,
    study_resource: '',
    question_count: null,
    difficulty: '',
    priority: 'medium',
    deadline: today(),
    estimated_time: null,
    actual_time: null,
    status: 'pending',
    session_id: null,
    plan_id: null,
})

const priorityOptions = [
    { value: 'low', label: 'کم' },
    { value: 'medium', label: 'متوسط' },
    { value: 'high', label: 'بالا' },
]

const difficultyOptions = [
    { value: '', label: 'انتخاب کنید' },
    { value: 'easy', label: 'آسان' },
    { value: 'medium', label: 'متوسط' },
    { value: 'hard', label: 'سخت' },
]

const statusOptions = [
    { value: 'pending', label: 'در انتظار' },
    { value: 'in_progress', label: 'در حال انجام' },
    { value: 'completed', label: 'تکمیل شده' },
    { value: 'cancelled', label: 'لغو شده' },
]

export const TodoForm: React.FC<TodoFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editing,
    subjects,
    sessions,
    plans,
}) => {
    const [form, setForm] = useState<TodoFormData>(defaultForm())
    const [errors, setErrors] = useState<Partial<Record<keyof TodoFormData, string>>>({})
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        if (editing) {
            setForm({
                title: editing.title,
                description: editing.description || '',
                subject_id: editing.subject_id,
                study_resource: editing.study_resource || '',
                question_count: editing.question_count,
                difficulty: editing.difficulty || '',
                priority: editing.priority,
                deadline: editing.deadline,
                estimated_time: editing.estimated_time,
                actual_time: editing.actual_time,
                status: editing.status,
                session_id: editing.session_id,
                plan_id: editing.plan_id,
            })
        } else {
            setForm(defaultForm())
        }
        setErrors({})
        setServerError(null)
    }, [editing, isOpen])

    const validate = (): boolean => {
        const e: typeof errors = {}
        if (!form.title.trim()) e.title = 'عنوان وظیفه الزامی است'
        if (form.estimated_time && form.estimated_time < 0) e.estimated_time = 'زمان تخمینی نمی‌تواند منفی باشد'
        if (form.actual_time && form.actual_time < 0) e.actual_time = 'زمان واقعی نمی‌تواند منفی باشد'
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
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'ویرایش وظیفه' : 'وظیفه جدید'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="عنوان"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="عنوان وظیفه"
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
                        label="وضعیت"
                        value={form.status || 'pending'}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Todo['status'] }))}
                        options={statusOptions}
                    />
                    <Select
                        label="اولویت"
                        value={form.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Todo['priority'] }))}
                        options={priorityOptions}
                    />
                </div>

                <Select
                    label="درس"
                    value={form.subject_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value || null }))}
                    options={[
                        { value: '', label: 'بدون درس' },
                        ...subjects.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                />

                <Input
                    label="منبع مطالعه"
                    type="text"
                    value={form.study_resource || ''}
                    onChange={(e) => setForm((f) => ({ ...f, study_resource: e.target.value }))}
                    placeholder="کتاب، وب‌سایت، استاد..."
                />

                <div className="grid grid-cols-3 gap-3">
                    <Input
                        label="تعداد سوالات"
                        type="number"
                        min={0}
                        value={form.question_count || ''}
                        onChange={(e) => setForm((f) => ({ ...f, question_count: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="۰"
                    />
                    <Select
                        label="سطح دشواری"
                        value={form.difficulty || ''}
                        onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value || null }))}
                        options={difficultyOptions}
                    />
                    <JalaliDateInput
                        label="مهلت"
                        value={form.deadline || ''}
                        onChange={(date) => setForm((f) => ({ ...f, deadline: date }))}
                        min={today()}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="زمان تخمینی (دقیقه)"
                        type="number"
                        min={0}
                        value={form.estimated_time || ''}
                        onChange={(e) => setForm((f) => ({ ...f, estimated_time: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="۶۰"
                        error={errors.estimated_time}
                    />
                    <Input
                        label="زمان واقعی (دقیقه)"
                        type="number"
                        min={0}
                        value={form.actual_time || ''}
                        onChange={(e) => setForm((f) => ({ ...f, actual_time: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="۴۵"
                        error={errors.actual_time}
                    />
                </div>

                <Select
                    label="جلسه مطالعه مرتبط"
                    value={form.session_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value || null }))}
                    options={[
                        { value: '', label: 'بدون جلسه' },
                        ...sessions.map((s) => ({ value: s.id, label: `${s.date} - ${s.subjects?.name || 'بدون درس'}` })),
                    ]}
                />

                <Select
                    label="برنامه مرتبط"
                    value={form.plan_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value || null }))}
                    options={[
                        { value: '', label: 'بدون برنامه' },
                        ...plans.map((p) => ({ value: p.id, label: p.title })),
                    ]}
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
