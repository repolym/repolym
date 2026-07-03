import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTodos } from '../../hooks/useTodos'
import { useSubjects } from '../../hooks/useSubjects'
import { useStudySessions } from '../../hooks/useStudySessions'
import { usePlans } from '../../hooks/usePlans'
import { useToast } from '../../context/ToastContext'
import type { Todo, TodoFormData } from '../../types/database'
import { TodoForm } from './TodoForm'
import { TodoCard } from './TodoCard'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { today, daysAgo } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Search, Plus } from 'lucide-react'

export const TodosPage: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Todo | null>(null)
    const [statusFilter, setStatusFilter] = useState<Todo['status'] | 'all'>('all')
    const [subjectFilter, setSubjectFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Fetch data
    const { data: todos, loading, error, refetch, createTodo, updateTodo, deleteTodo } = useTodos({
        userId: user?.id ?? null,
        status: statusFilter,
        subjectId: subjectFilter === 'all' ? null : subjectFilter,
        search: debouncedSearch,
        dateFrom: daysAgo(30),
        dateTo: undefined, // ✅ fixed: changed from null to undefined
    })

    const { data: subjects } = useSubjects(user?.id ?? null)
    const { data: sessions } = useStudySessions({
        userId: user?.id ?? null,
        dateFrom: daysAgo(365),
        dateTo: today(),
    })
    const { data: plans } = usePlans({
        userId: user?.id ?? null,
        dateFrom: daysAgo(365),
        dateTo: today(),
    })

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const stats = useMemo(() => {
        const total = todos.length
        const completed = todos.filter(t => t.status === 'completed').length
        const pending = todos.filter(t => t.status === 'pending').length
        const inProgress = todos.filter(t => t.status === 'in_progress').length
        const cancelled = todos.filter(t => t.status === 'cancelled').length
        return { total, completed, pending, inProgress, cancelled }
    }, [todos])

    const handleCreate = async (data: TodoFormData): Promise<boolean> => {
        const ok = await createTodo(data)
        if (ok) showToast('وظیفه با موفقیت ایجاد شد', 'success')
        return ok
    }

    const handleUpdate = async (data: TodoFormData): Promise<boolean> => {
        if (!editing) return false
        const ok = await updateTodo(editing.id, data)
        if (ok) {
            showToast('وظیفه به‌روزرسانی شد', 'success')
            setEditing(null)
        }
        return ok
    }

    const handleDelete = async (id: string) => {
        await deleteTodo(id)
        showToast('وظیفه حذف شد', 'success')
    }

    const handleStatusChange = async (id: string, status: Todo['status']) => {
        await updateTodo(id, { status })
        showToast('وضعیت به‌روزرسانی شد', 'success')
    }

    const openEdit = (todo: Todo) => {
        setEditing(todo)
        setFormOpen(true)
    }

    const handleClose = () => {
        setFormOpen(false)
        setEditing(null)
    }

    if (loading && todos.length === 0) return <PageLoader />

    return (
        <div className="p-5 md:p-6 max-w-4xl mx-auto" dir="rtl">
            {/* Header with stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-base font-semibold text-text-primary">وظایف</h1>
                    <p className="text-xs text-text-tertiary mt-0.5">
                        {toPersianDigits(stats.total)} وظیفه · {toPersianDigits(stats.completed)} تکمیل‌شده · {toPersianDigits(stats.pending)} در انتظار
                    </p>
                </div>
                <Button variant="primary" onClick={() => setFormOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    وظیفه جدید
                </Button>
            </div>

            {/* Filters and search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="جستجو در عنوان وظایف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm w-36"
                >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="completed">تکمیل‌شده</option>
                    <option value="cancelled">لغو‌شده</option>
                </select>
                <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm w-36"
                >
                    <option value="all">همه دروس</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {error && <ErrorMessage message={error} onRetry={refetch} />}

            {!error && todos.length === 0 && (
                <EmptyState
                    title="وظیفه‌ای وجود ندارد"
                    description="برای مدیریت بهتر برنامه‌ریزی، اولین وظیفه خود را ایجاد کنید"
                    action={
                        <Button variant="primary" onClick={() => setFormOpen(true)}>
                            ایجاد وظیفه
                        </Button>
                    }
                />
            )}

            {todos.length > 0 && (
                <div className="space-y-1">
                    {todos.map((todo) => (
                        <TodoCard
                            key={todo.id}
                            todo={todo}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}

            <TodoForm
                isOpen={formOpen}
                onClose={handleClose}
                onSubmit={editing ? handleUpdate : handleCreate}
                editing={editing}
                subjects={subjects}
                sessions={sessions}
                plans={plans}
            />
        </div>
    )
}
