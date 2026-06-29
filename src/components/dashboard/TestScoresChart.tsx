import React, { useMemo } from 'react'
import type { Test } from '../../types/database'
import { formatDateShort } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton, EmptyState } from '../common/Loading'
import { Link } from 'react-router-dom'

interface TestScoresChartProps {
  tests: Test[]
  loading: boolean
}

export const TestScoresChart: React.FC<TestScoresChartProps> = ({ tests, loading }) => {
  const recentTests = useMemo(() => [...tests].slice(0, 8).reverse(), [tests])

  const maxScore = useMemo(() => {
    if (!recentTests.length) return 100
    return Math.max(...recentTests.map((t) => t.max_score || 100))
  }, [recentTests])

  const avgScore = useMemo(() => {
    if (!recentTests.length) return 0
    const total = recentTests.reduce((s, t) => s + (t.score / (t.max_score || 100)) * 100, 0)
    return Math.round(total / recentTests.length)
  }, [recentTests])

  if (loading) {
    return (
      <div className="card p-5">
        <p className="label mb-4">نمرات آزمون‌ها</p>
        <div className="flex items-end gap-2 h-24">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={`flex-1 rounded-xs`} style={{ height: `${20 + i * 12}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <div className="card p-5">
        <p className="label mb-4">نمرات آزمون‌ها</p>
        <EmptyState
          title="آزمونی ثبت نشده"
          description="برای پیگیری عملکرد خود نتایج آزمون را اضافه کنید"
          action={
            <Link to="/tests" className="btn-secondary text-xs">
              افزودن آزمون
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label">نمرات آزمون‌ها</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">
            میانگین: <span className="text-text-secondary font-medium">{toPersianDigits(avgScore)}%</span>
          </span>
          <Link to="/tests" className="text-xs text-text-tertiary hover:text-accent transition-colors">
            همه ←
          </Link>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24">
        {recentTests.map((test) => {
          const pct = Math.round((test.score / (test.max_score || 100)) * 100)
          const color =
            pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-accent' : pct >= 40 ? 'bg-warning' : 'bg-danger'
          return (
            <div
              key={test.id}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-surface-4 border border-border text-2xs rounded-xs px-2 py-1 whitespace-nowrap shadow">
                  <p className="text-text-primary font-medium">{test.name}</p>
                  <p className="text-text-tertiary">
                    {toPersianDigits(test.score)}/{toPersianDigits(test.max_score || 100)} ({toPersianDigits(pct)}%)
                  </p>
                </div>
              </div>

              <div className="w-full flex items-end h-20">
                <div
                  className={`w-full rounded-2xs transition-all ${color}/70 hover:${color}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <p className="text-2xs text-text-tertiary truncate w-full text-center">
                {formatDateShort(test.date)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}