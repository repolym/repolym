import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Test } from '../../types/database'
import { formatDateShort } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, ArrowLeft } from 'lucide-react'

interface TestScoresChartProps {
  tests: Test[]
  loading: boolean
}

export const TestScoresChart: React.FC<TestScoresChartProps> = ({ tests, loading }) => {
  // Show up to 12 most recent tests (instead of 8)
  const recentTests = useMemo(() => [...tests].slice(0, 12).reverse(), [tests])

  const avgScore = useMemo(() => {
    if (!recentTests.length) return 0
    const total = recentTests.reduce((s, t) => s + (t.score / (t.max_score || 100)) * 100, 0)
    return Math.round(total / recentTests.length)
  }, [recentTests])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-end gap-2 h-48">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${15 + i * 12}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (tests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">نمرات آزمون‌ها</h3>
        </div>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">آزمونی ثبت نشده</p>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            برای پیگیری عملکرد خود نتایج آزمون را اضافه کنید
          </p>
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            افزودن آزمون
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">نمرات آزمون‌ها</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            میانگین: <span className="font-semibold text-gray-700">{toPersianDigits(avgScore)}%</span>
          </span>
          <Link to="/tests" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors">
            همه <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Taller chart */}
      <div className="flex items-end gap-2 h-48 px-1">
        {recentTests.map((test) => {
          const pct = Math.round((test.score / (test.max_score || 100)) * 100)
          let barColor = 'bg-gray-300'
          if (pct >= 80) barColor = 'bg-emerald-500'
          else if (pct >= 60) barColor = 'bg-indigo-500'
          else if (pct >= 40) barColor = 'bg-amber-500'
          else barColor = 'bg-rose-400'

          return (
            <div key={test.id} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                  <p className="font-medium">{test.name}</p>
                  <p className="text-gray-300">
                    {toPersianDigits(test.score)}/{toPersianDigits(test.max_score || 100)} ({toPersianDigits(pct)}%)
                  </p>
                </div>
              </div>

              <div className="w-full flex items-end h-40">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg ${barColor} transition-colors`}
                />
              </div>
              <p className="text-xs text-gray-400 truncate w-full text-center leading-tight">
                {formatDateShort(test.date)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}