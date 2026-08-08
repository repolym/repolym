// src/components/study/GoalProgressManager.tsx (new)
import React, { useState } from 'react'
import { useGoals } from '../../hooks/useGoals'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Goal } from '../../types/database'
import { toPersianDigits } from '../../utils/jalali'

export const GoalProgressManager: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const { data: goals, loading, updateGoal, refetch } = useGoals({
        userId: user?.id ?? null,
        status: 'active',
    })

    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const handleProgressChange = async (goal: Goal, value: number) => {
        setUpdatingId(goal.id)
        try {
            await updateGoal(goal.id, { manual_progress: value })
            showToast('پیشرفت به‌روز شد', 'success')
            refetch()
        } catch (err) {
            showToast('خطا در به‌روزرسانی', 'error')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleComplete = async (goal: Goal) => {
        setUpdatingId(goal.id)
        try {
            await updateGoal(goal.id, { manual_progress: 100, status: 'completed', completed_at: new Date().toISOString() })
            showToast('هدف تکمیل شد! 🎉', 'success')
            refetch()
        } catch (err) {
            showToast('خطا', 'error')
        } finally {
            setUpdatingId(null)
        }
    }

    if (loading) return <div className="text-sm text-text-tertiary">در حال بارگذاری اهداف...</div>
    if (goals.length === 0) return <div className="text-sm text-text-tertiary">هدف فعالی وجود ندارد.</div>

    return (
        <div className="bg-surface-1 rounded-2xl border border-border p-5 mt-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">پیشرفت اهداف</h3>
            <div className="space-y-4">
                {goals.map((goal) => {
                    const progress = goal.manual_progress !== null ? goal.manual_progress : (goal as any).progress_percent || 0
                    const isComplete = progress >= 100 || goal.status === 'completed'
                    return (
                        <div key={goal.id} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-text-primary">{goal.title}</span>
                                <span className="text-sm text-text-secondary">{toPersianDigits(Math.round(progress))}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={progress}
                                    onChange={(e) => handleProgressChange(goal, Number(e.target.value))}
                                    disabled={updatingId === goal.id || isComplete}
                                    className="flex-1 h-2 bg-surface-3 rounded-full appearance-none accent-accent"
                                />
                                {!isComplete && (
                                    <button
                                        onClick={() => handleComplete(goal)}
                                        disabled={updatingId === goal.id}
                                        className="text-xs bg-accent text-white px-3 py-1 rounded-xl hover:bg-accent-hover transition"
                                    >
                                        تکمیل
                                    </button>
                                )}
                                {isComplete && <span className="text-xs text-green-600 font-medium">✓ تکمیل شده</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}