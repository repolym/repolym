import React, { useState } from 'react'
import type { Todo } from '../../types/database'
import { formatDate, formatMinutes } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { ConfirmModal } from '../common/Modal'
import { Calendar, Clock, CheckCircle, AlertCircle, BookOpen, Layers } from 'lucide-react'

interface TodoCardProps {
    todo: Todo
    onEdit: (todo: Todo) => void
    onDelete: (id: string) => Promise<void>
    onStatusChange: (id: string, status: Todo['status']) => Promise<void>
}

const statusConfig = {
    pending: { label: 'در انتظار', color: 'text-gray-500', bg: 'bg-gray-100' },
    in_progress: { label: 'در حال انجام', color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: 'تکمیل شده', color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { label: 'لغو شده', color: 'text-red-600', bg: 'bg-red-50' },
}

const priorityConfig = {
    low: { label: 'کم', color: 'text-gray-500' },
    medium: { label: 'متوسط', color: 'text-yellow-600' },
    high: { label: 'بالا', color: 'text-red-600' },
}

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onEdit, onDelete, onStatusChange }) => {
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [updating, setUpdating] = useState(false)

    const status = statusConfig[todo.status]
    const priority = priorityConfig[todo.priority]

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(todo.id)
        } finally {
            setDeleting(false)
            setConfirmOpen(false)
        }
    }

    const handleStatusChange = async (newStatus: Todo['status']) => {
        setUpdating(true)
        try {
            await onStatusChange(todo.id, newStatus)
        } finally {
            setUpdating(false)
        }
    }

    const isCompleted = todo.status === 'completed'
    const isCancelled = todo.status === 'cancelled'

    return (
        <>
            <div className="card-hover px-4 py-3 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isCompleted || isCancelled ? 'line-through text-gray-400' : 'text-text-primary'}`}>
                                {todo.title}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                            <span className={`text-xs ${priority.color}`}>· {priority.label}</span>
                        </div>

                        {todo.description && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{todo.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary flex-wrap">
                            {todo.subjects && (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: todo.subjects.color }} />
                                    {todo.subjects.name}
                                </span>
                            )}
                            {todo.deadline && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(todo.deadline)}
                                </span>
                            )}
                            {todo.estimated_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    تخمین: {formatMinutes(todo.estimated_time)}
                                </span>
                            )}
                            {todo.actual_time && (
                                <span className="flex items-center gap-1 text-indigo-600">
                                    <CheckCircle className="w-3 h-3" />
                                    واقعی: {formatMinutes(todo.actual_time)}
                                </span>
                            )}
                            {todo.study_resource && (
                                <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {todo.study_resource}
                                </span>
                            )}
                            {todo.difficulty && (
                                <span className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    دشواری: {todo.difficulty === 'easy' ? 'آسان' : todo.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => onEdit(todo)}
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

                {/* Quick status actions */}
                {!isCompleted && !isCancelled && (
                    <div className="flex gap-2 mt-1">
                        {todo.status !== 'in_progress' && (
                            <button
                                onClick={() => handleStatusChange('in_progress')}
                                className="text-xs text-blue-600 hover:text-blue-700"
                                disabled={updating}
                            >
                                شروع
                            </button>
                        )}
                        {todo.status !== 'completed' && (
                            <button
                                onClick={() => handleStatusChange('completed')}
                                className="text-xs text-green-600 hover:text-green-700"
                                disabled={updating}
                            >
                                تکمیل
                            </button>
                        )}
                        {todo.status !== 'cancelled' && (
                            <button
                                onClick={() => handleStatusChange('cancelled')}
                                className="text-xs text-red-500 hover:text-red-700"
                                disabled={updating}
                            >
                                لغو
                            </button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="حذف وظیفه"
                message="این وظیفه برای همیشه حذف خواهد شد."
                loading={deleting}
            />
        </>
    )
}