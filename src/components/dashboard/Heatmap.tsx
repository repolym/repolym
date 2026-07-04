import React, { useMemo, useState } from 'react'
import type { StudySession } from '../../types/database'
import { buildHeatmapData } from '../../utils/heatmap-utils'
import { formatDate, formatMinutes, daysAgo, today } from '../../utils/date-utils'
import { toPersianDigits, PERSIAN_MONTHS } from '../../utils/jalali'
import * as jalaali from 'jalaali-js'

interface HeatmapProps {
  sessions: StudySession[]
}

const levelColors = [
  'bg-gray-100',           // 0 - بدون مطالعه
  'bg-indigo-200',         // 1 - کمتر از ۳۰ دقیقه
  'bg-indigo-400',         // 2 - کمتر از ۹۰ دقیقه
  'bg-indigo-500',         // 3 - کمتر از ۱۸۰ دقیقه
  'bg-indigo-600',         // 4 - بیش از ۱۸۰ دقیقه
]

const PERSIAN_DAY_CHARS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const WEEKS = 16

export const Heatmap: React.FC<HeatmapProps> = ({ sessions }) => {
  const [tooltip, setTooltip] = useState<{ date: string; minutes: number; x: number; y: number } | null>(null)

  const from = daysAgo(WEEKS * 7 - 1)
  const to = today()

  const days = useMemo(() => buildHeatmapData(sessions, from, to), [sessions, from, to])

  const weeks = useMemo(() => {
    const result: typeof days[] = []
    let week: typeof days = []

    const firstDay = new Date(days[0]?.date + 'T00:00:00')
    const dayOfWeek = firstDay.getDay()
    const padCount = dayOfWeek === 6 ? 0 : dayOfWeek + 1
    for (let i = 0; i < padCount; i++) {
      week.push({ date: '', minutes: 0, level: 0 })
    }

    for (const day of days) {
      week.push(day)
      if (week.length === 7) {
        result.push(week)
        week = []
      }
    }
    if (week.length > 0) result.push(week)
    return result
  }, [days])

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, colIdx) => {
      const validDay = week.find((d) => d.date)
      if (!validDay) return
      const j = jalaali.toJalaali(new Date(validDay.date + 'T00:00:00'))
      const monthIndex = j.jm - 1
      if (monthIndex !== lastMonth) {
        labels.push({ label: PERSIAN_MONTHS[monthIndex], col: colIdx })
        lastMonth = monthIndex
      }
    })
    return labels
  }, [weeks])

  const totalMinutes = useMemo(() => days.reduce((s, d) => s + d.minutes, 0), [days])
  const activeDays = useMemo(() => days.filter((d) => d.minutes > 0).length, [days])

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            فعالیت
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {toPersianDigits(activeDays)} روز فعال · {formatMinutes(totalMinutes)} مجموع
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>کمتر</span>
          {levelColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>بیشتر</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${weeks.length * 15}px` }}>
          {/* Month labels */}
          <div className="flex mb-1.5" style={{ paddingLeft: '28px' }}>
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.col === i)
              return (
                <div key={i} className="w-4 text-xs text-gray-400 font-medium leading-none mr-0.5">
                  {label ? label.label : ''}
                </div>
              )
            })}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1.5 gap-0.5">
              {PERSIAN_DAY_CHARS.map((ch, i) => (
                <div key={i} className="w-3 h-3 text-xs text-gray-400 flex items-center justify-center">
                  {i % 2 !== 0 ? ch : ''}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`
                        w-3 h-3 rounded-sm transition-all duration-200
                        ${day.date ? levelColors[day.level] : 'opacity-0'}
                        ${day.date ? 'cursor-pointer hover:scale-125 hover:shadow-md' : ''}
                      `}
                      onMouseEnter={(e) => {
                        if (!day.date) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ date: day.date, minutes: day.minutes, x: rect.left, y: rect.top })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-xl"
          style={{ top: tooltip.y - 45, left: tooltip.x - 50 }}
        >
          <span className="text-gray-300">{formatDate(tooltip.date)}: </span>
          <span className="font-semibold">
            {tooltip.minutes === 0 ? 'مطالعه نداشتی' : formatMinutes(tooltip.minutes)}
          </span>
        </div>
      )}
    </div>
  )
}