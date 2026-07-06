import React, { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePlans } from '../../hooks/usePlans'
import { useToast } from '../../context/ToastContext'
import { usePlanSessions } from '../../hooks/usePlanSessions'
import { useStudySessions } from '../../hooks/useStudySessions'
import type { Plan, PlanFormData } from '../../types/database'
import { PlanForm } from './PlanForm'
import { PlanCard } from './PlanCard'
import { Button } from '../common/Button'
import { EmptyState, PageLoader, ErrorMessage } from '../common/Loading'
import { daysAgo, today, formatDate } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
    CalendarDays,
    ListTodo,
    Timeline,
    Plus,
    Link as LinkIcon,
    Unlink,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

type ViewMode = 'list' | 'calendar' | 'timeline'

export const PlanningPage: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Plan | null>(null)
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

    // Fetch plans
    const { data: plans, loading, error, refetch, createPlan, updatePlan, deletePlan } = usePlans({
        userId: user?.id ?? null,
        dateFrom: daysAgo(90),
        dateTo: today(),
    })

    // Fetch sessions for linking
    const { data: allSessions } = useStudySessions({
        userId: user?.id ?? null,
        dateFrom: daysAgo(365),
        dateTo: today(),
    })

    // Fetch sessions linked to selected plan
    const { data: planSessions, linkSession, unlinkSession, refetch: refetchPlanSessions } =
        usePlanSessions(selectedPlanId)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Drag end handler - just refetch to sync UI (no order persistence yet)
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        // No order stored yet; just refetch to keep UI consistent
        refetch()
    }

    // Handlers
    const handleCreate = async (data: PlanFormData): Promise<boolean> => {
        const ok = await createPlan(data)
        if (ok) showToast('برنامه با موفقیت ایجاد شد', 'success')
        return ok
    }

    const handleUpdate = async (data: PlanFormData): Promise<boolean> => {
        if (!editing) return false
        const ok = await updatePlan(editing.id, data)
        if (ok) {
            showToast('برنامه به‌روزرسانی شد', 'success')
            setEditing(null)
        }
        return ok
    }

    const handleDelete = async (id: string) => {
        await deletePlan(id)
        showToast('برنامه حذف شد', 'success')
    }

    const handleStatusChange = async (id: string, status: Plan['status']) => {
        await updatePlan(id, { status })
        showToast('وضعیت برنامه به‌روزرسانی شد', 'success')
    }

    const handleProgressChange = async (id: string, progress: number) => {
        await updatePlan(id, { progress })
    }

    const handleLinkSession = async (sessionId: string) => {
        if (!selectedPlanId) return
        await linkSession(sessionId)
        showToast('جلسه به برنامه متصل شد', 'success')
        refetchPlanSessions()
    }

    const handleUnlinkSession = async (sessionId: string) => {
        await unlinkSession(sessionId)
        showToast('جلسه از برنامه جدا شد', 'success')
        refetchPlanSessions()
    }

    const openEdit = (plan: Plan) => {
        setEditing(plan)
        setFormOpen(true)
    }

    const handleClose = () => {
        setFormOpen(false)
        setEditing(null)
    }

    // Calendar view helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay()

    const [calendarDate, setCalendarDate] = useState(new Date())
    const calendarYear = calendarDate.getFullYear()
    const calendarMonth = calendarDate.getMonth() + 1
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth)

    const plansByDate = useMemo(() => {
        const map: Record<string, Plan[]> = {}
        plans.forEach((p) => {
            const d = p.start_date
            if (!map[d]) map[d] = []
            map[d].push(p)
        })
        return map
    }, [plans])

    const renderCalendar = () => {
        const days = []
        const todayStr = today()
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 border border-border-subtle rounded-lg" />)
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(calendarYear, calendarMonth - 1, d)
            const dateStr = dateObj.toISOString().split('T')[0]
            const isToday = dateStr === todayStr
            const dayPlans = plansByDate[dateStr] || []
            days.push(
                <div
                    key={dateStr}
                    className={`h-24 border border-border-subtle rounded-lg p-1 overflow-y-auto ${isToday ? 'bg-accent-muted' : ''}`}
                >
                    <div className={`text-xs font-medium ${isToday ? 'text-accent-hover' : 'text-text-secondary'}`}>
                        {toPersianDigits(d)}
                    </div>
                    <div className="space-y-0.5 mt-1">
                        {dayPlans.slice(0, 3).map((p) => (
                            <div
                                key={p.id}
                                className="text-2xs truncate px-1 py-0.5 rounded bg-accent-muted text-accent-hover cursor-pointer hover:bg-accent-subtle"
                                onClick={() => setSelectedPlanId(p.id)}
                            >
                                {p.title}
                            </div>
                        ))}
                        {dayPlans.length > 3 && (
                            <div className="text-2xs text-text-tertiary">+{dayPlans.length - 3} بیشتر</div>
                        )}
                    </div>
                </div>
            )
        }
        return days
    }

    const prevMonth = () => {
        const newDate = new Date(calendarDate)
        newDate.setMonth(newDate.getMonth() - 1)
        setCalendarDate(newDate)
    }
    const nextMonth = () => {
        const newDate = new Date(calendarDate)
        newDate.setMonth(newDate.getMonth() + 1)
        setCalendarDate(newDate)
    }

    // Timeline view: group plans by week
    const renderTimeline = () => {
        const groups: Record<string, Plan[]> = {}
        plans.forEach((p) => {
            const week = p.start_date
            if (!groups[week]) groups[week] = []
            groups[week].push(p)
        })
        const sortedWeeks = Object.keys(groups).sort()
        return (
            <div className="space-y-6 mt-4">
                {sortedWeeks.map((week) => (
                    <div key={week}>
                        <h3 className="text-sm font-medium text-text-secondary mb-2">
                            هفته {formatDate(week)}
                        </h3>
                        <div className="space-y-2">
                            {groups[week].map((p) => (
                                <PlanCard
                                    key={p.id}
                                    plan={p}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onStatusChange={handleStatusChange}
                                    onProgressChange={handleProgressChange}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (loading && plans.length === 0) return <PageLoader />

    return (
        <div className="p-5 md:p-6 max-w-5xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-base font-semibold text-text-primary">برنامه‌ریزی</h1>
                    <p className="text-xs text-text-tertiary mt-0.5">
                        {toPersianDigits(plans.length)} برنامه
                    </p>
                </div>
                <Button variant="primary" onClick={() => setFormOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    برنامه جدید
                </Button>
            </div>

            {/* View mode tabs */}
            <div className="flex gap-2 border-b border-border pb-2 mb-4">
                {[
                    { id: 'list', label: 'لیست', icon: ListTodo },
                    { id: 'calendar', label: 'تقویم', icon: CalendarDays },
                    { id: 'timeline', label: 'زمان‌بندی', icon: Timeline },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setViewMode(id as ViewMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === id
                            ? 'bg-accent-muted text-accent-hover shadow-sm'
                            : 'text-text-secondary hover:bg-surface-2 hover:text-text-secondary'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {error && <ErrorMessage message={error} onRetry={refetch} />}

            {!error && plans.length === 0 && (
                <EmptyState
                    title="برنامه‌ای وجود ندارد"
                    description="برای برنامه‌ریزی بهتر، اولین برنامه خود را ایجاد کنید"
                    action={
                        <Button variant="primary" onClick={() => setFormOpen(true)}>
                            ایجاد برنامه
                        </Button>
                    }
                />
            )}

            {/* Views */}
            {viewMode === 'list' && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                            {plans.map((p) => (
                                <PlanCard
                                    key={p.id}
                                    plan={p}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onStatusChange={handleStatusChange}
                                    onProgressChange={handleProgressChange}
                                    dragHandle
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {viewMode === 'calendar' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="btn-ghost p-1">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-text-primary">
                            {new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(calendarDate)}
                        </h2>
                        <button onClick={nextMonth} className="btn-ghost p-1">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => (
                            <div key={d} className="text-xs font-medium text-text-tertiary text-center py-1">
                                {d}
                            </div>
                        ))}
                        {renderCalendar()}
                    </div>
                </div>
            )}

            {viewMode === 'timeline' && renderTimeline()}

            {/* Plan linking section */}
            {selectedPlanId && (
                <div className="mt-8 p-4 bg-surface-2 rounded-2xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-text-secondary">
                            جلسات مرتبط با برنامه
                        </h3>
                        <button
                            onClick={() => setSelectedPlanId(null)}
                            className="text-xs text-text-tertiary hover:text-text-secondary"
                        >
                            بستن
                        </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {planSessions.length === 0 && (
                            <p className="text-xs text-text-tertiary">هیچ جلسه‌ای به این برنامه متصل نیست</p>
                        )}
                        {planSessions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between bg-surface-1 p-2 rounded-lg">
                                <span className="text-sm truncate">
                                    {formatDate(s.date)} - {s.subjects?.name || 'بدون درس'}
                                </span>
                                <button
                                    onClick={() => handleUnlinkSession(s.id)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    <Unlink className="w-3 h-3 inline" /> جدا کردن
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3">
                        <h4 className="text-xs font-medium text-text-secondary mb-2">اتصال جلسه جدید</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {allSessions
                                .filter((s) => !s.plan_id)
                                .slice(0, 10)
                                .map((s) => (
                                    <div key={s.id} className="flex items-center justify-between bg-surface-1 p-2 rounded-lg">
                                        <span className="text-sm truncate">
                                            {formatDate(s.date)} - {s.subjects?.name || 'بدون درس'}
                                        </span>
                                        <button
                                            onClick={() => handleLinkSession(s.id)}
                                            className="text-xs text-accent hover:text-accent-hover"
                                        >
                                            <LinkIcon className="w-3 h-3 inline" /> اتصال
                                        </button>
                                    </div>
                                ))}
                            {allSessions.filter((s) => !s.plan_id).length === 0 && (
                                <p className="text-xs text-text-tertiary">همه جلسات به برنامه‌ای متصل هستند</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PlanForm
                isOpen={formOpen}
                onClose={handleClose}
                onSubmit={editing ? handleUpdate : handleCreate}
                editing={editing}
            />
        </div>
    )
}
