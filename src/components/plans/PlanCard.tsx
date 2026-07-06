import React, { useState } from 'react'
import type { Plan } from '../../types/database'
import { formatDate, formatMinutes } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { ConfirmModal } from '../common/Modal'
import { CheckCircle, Clock, AlertCircle, Calendar, TrendingUp, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PlanCardProps {
    plan: Plan
    onEdit: (plan: Plan) => void
    onDelete: (id: string) => Promise<void>
    onStatusChange: (id: string, status: Plan['status']) => Promise<void>
    onProgressChange?: (id: string, progress: number) => Promise<void>
    dragHandle?: boolean
}

const statusConfig = {
    pending: { label: 'در انتظار', color: 'text-text-secondary', bg: 'bg-surface-3' },
    in_progress: { label: 'در حال انجام', color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: 'تکمیل شده', color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { label: 'لغو شده', color: 'text-red-600', bg: 'bg-red-50' },
}

const priorityConfig = {
    low: { label: 'کم', color: 'text-text-secondary' },
    medium: { label: 'متوسط', color: 'text-yellow-600' },
    high: { label: 'بالا', color: 'text-red-600' },
}

export const PlanCard: React.FC<PlanCardProps> = ({
    plan,
    onEdit,
    onDelete,
    onStatusChange,
    onProgressChange,
    dragHandle = false,
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [updating, setUpdating] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: plan.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const status = statusConfig[plan.status]
    const priority = priorityConfig[plan.priority]

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(plan.id)
        } finally {
            setDeleting(false)
            setConfirmOpen(false)
        }
    }

    const handleStatusToggle = async (newStatus: Plan['status']) => {
        setUpdating(true)
        try {
            await onStatusChange(plan.id, newStatus)
        } finally {
            setUpdating(false)
        }
    }

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value)
        if (onProgressChange) {
            onProgressChange(plan.id, val)
        }
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`card-hover px-4 py-3 flex flex-col gap-2 ${isDragging ? 'shadow-lg' : ''}`}
            >
                <div className="flex items-start gap-3">
                    {dragHandle && (
                        <div {...attributes} {...listeners} className="cursor-grab text-text-tertiary hover:text-text-secondary mt-1">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-text-primary truncate">{plan.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                            <span className={`text-xs ${priority.color}`}>· {priority.label}</span>
                        </div>

                        {plan.description && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{plan.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary flex-wrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(plan.start_date)}
                            </span>
                            {plan.end_date && (
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    تا {formatDate(plan.end_date)}
                                </span>
                            )}
                            {plan.estimated_duration && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatMinutes(plan.estimated_duration)}
                                </span>
                            )}
                            {plan.due_date && (
                                <span className="flex items-center gap-1 text-red-500">
                                    <AlertCircle className="w-3 h-3" />
                                    سررسید: {formatDate(plan.due_date)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => onEdit(plan)}
                            className="btn-ghost text-xs"
                            title="ویرایش"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className="btn-ghost text-xs hover:text-danger"
                            title="حذف"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent rounded-full transition-all duration-300"
                            style={{ width: `${plan.progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">{toPersianDigits(plan.progress)}%</span>
                    {onProgressChange && (
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={plan.progress}
                            onChange={handleProgressChange}
                            className="w-16 h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        />
                    )}
                </div>

                {/* Quick status actions */}
                {plan.status !== 'completed' && plan.status !== 'cancelled' && (
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => handleStatusToggle('in_progress')}
                            className="text-xs text-blue-600 hover:text-blue-700"
                            disabled={updating}
                        >
                            شروع
                        </button>
                        <button
                            onClick={() => handleStatusToggle('completed')}
                            className="text-xs text-green-600 hover:text-green-700"
                            disabled={updating}
                        >
                            <CheckCircle className="w-3 h-3 inline ml-0.5" />
                            تکمیل
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="حذف برنامه"
                message="این برنامه برای همیشه حذف خواهد شد."
                loading={deleting}
            />
        </>
    )
}
