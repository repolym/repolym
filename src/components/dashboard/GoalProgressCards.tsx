import React from 'react'
import type { GoalWithProgress } from '../../types/database'
import { formatMinutes } from '../../utils/date-utils'
import { Skeleton, EmptyState } from '../common/Loading'
import { Link } from 'react-router-dom'

interface GoalProgressCardsProps {
  goals: GoalWithProgress[]
  loading: boolean
}

const periodLabel: Record<string, string> = { day: 'امروز', week: 'این هفته', month: 'این ماه' }

export const GoalProgressCards: React.FC<GoalProgressCardsProps> = ({ goals, loading }) => {
  if (loading) {
    return (
      <div className="card p-5">
        <p className="label mb-4">اهداف</p>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label">اهداف</p>
        <Link to="/goals" className="text-xs text-text-tertiary hover:text-accent transition-colors">
          همه اهداف ←
        </Link>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="هدف فعالی وجود ندارد"
          description="برای پیگیری پیشرفت خود یک هدف مطالعه تعیین کنید"
          action={
            <Link to="/goals" className="btn-secondary text-xs">
              افزودن هدف
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {goals.slice(0, 4).map((goal) => (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-text-primary font-medium truncate pr-4">{goal.title}</p>
                <span
                  className={`text-xs font-mono tabular-nums flex-shrink-0 ${goal.progress_percent >= 100
                      ? 'text-success'
                      : goal.progress_percent >= 75
                        ? 'text-accent'
                        : 'text-text-tertiary'
                    }`}
                >
                  {goal.progress_percent}%
                </span>
              </div>

              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${goal.progress_percent >= 100 ? 'bg-success' : 'bg-accent'
                    }`}
                  style={{ width: `${Math.min(100, goal.progress_percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-2xs text-text-tertiary">
                  {formatMinutes(goal.progress_minutes)} / {formatMinutes(goal.target_minutes)}
                </p>
                <p className="text-2xs text-text-tertiary">{periodLabel[goal.period]}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}