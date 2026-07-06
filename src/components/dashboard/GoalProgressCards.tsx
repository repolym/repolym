import React from 'react'
import { motion } from 'framer-motion'
import type { GoalWithProgress } from '../../types/database'
import { formatMinutes } from '../../utils/date-utils'
import { Skeleton } from '../common/Loading'
import { Link } from 'react-router-dom'
import { Target, ArrowLeft } from 'lucide-react'

interface GoalProgressCardsProps {
  goals: GoalWithProgress[]
  loading: boolean
}

const periodLabel: Record<string, string> = { day: 'امروز', week: 'این هفته', month: 'این ماه' }

export const GoalProgressCards: React.FC<GoalProgressCardsProps> = ({ goals, loading }) => {
  if (loading) {
    return (
      <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent-muted flex items-center justify-center">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold text-text-primary">اهداف</h3>
        </div>
        <Link to="/goals" className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors">
          همه اهداف <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium mb-1">هدف فعالی وجود ندارد</p>
          <p className="text-sm text-text-tertiary mb-5 max-w-xs">
            برای پیگیری پیشرفت خود یک هدف مطالعه تعیین کنید
          </p>
          <Link
            to="/goals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            افزودن هدف
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {goals.slice(0, 4).map((goal) => {
            const isComplete = goal.progress_percent >= 100
            const progressColor = isComplete
              ? 'bg-green-500'
              : goal.progress_percent >= 75
              ? 'bg-accent'
              : goal.progress_percent >= 40
              ? 'bg-amber-500'
              : 'bg-surface-4'

            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-text-secondary truncate pr-3">{goal.title}</p>
                  <span
                    className={`text-sm font-mono tabular-nums flex-shrink-0 ${
                      isComplete ? 'text-green-600' : goal.progress_percent >= 75 ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    {goal.progress_percent}%
                  </span>
                </div>

                <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, goal.progress_percent)}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${progressColor}`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{formatMinutes(goal.progress_minutes)} / {formatMinutes(goal.target_minutes)}</span>
                  <span>{periodLabel[goal.period]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
