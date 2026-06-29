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
  'bg-surface-3',         // 0 - no study
  'bg-accent/20',         // 1 - < 30 min
  'bg-accent/40',         // 2 - < 90 min
  'bg-accent/65',         // 3 - < 180 min
  'bg-accent',            // 4 - 180+ min
]

const PERSIAN_DAY_CHARS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const WEEKS = 16

export const Heatmap: React.FC<HeatmapProps> = ({ sessions }) => {
  const [tooltip, setTooltip] = useState<{ date: string; minutes: number; x: number; y: number } | null>(null)

  const from = daysAgo(WEEKS * 7 - 1)
  const to = today()

  const days = useMemo(() => buildHeatmapData(sessions, from, to), [sessions, from, to])

  // Group into weeks (Sat–Fri columns)
  const weeks = useMemo(() => {
    const result: typeof days[] = []
    let week: typeof days = []

    // Pad start so first day aligns with Saturday (6 = Sat in JS Sunday=0)
    const firstDay = new Date(days[0]?.date + 'T00:00:00')
    const dayOfWeek = firstDay.getDay() // 0=Sun, 6=Sat
    const padCount = dayOfWeek === 6 ? 0 : dayOfWeek + 1 // we want Saturday = index 0
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
    <div className="card p-4 md:p-5" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">فعالیت</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {toPersianDigits(activeDays)} روز فعال · {formatMinutes(totalMinutes)} مجموع
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-text-tertiary">
          <span>کمتر</span>
          {levelColors.map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-2xs ${c}`} />
          ))}
          <span>بیشتر</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${weeks.length * 14}px` }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.col === i)
              return (
                <div key={i} className="w-3 mr-0.5 text-2xs text-text-tertiary leading-none">
                  {label ? label.label : ''}
                </div>
              )
            })}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1 gap-0.5">
              {PERSIAN_DAY_CHARS.map((ch, i) => (
                <div key={i} className="w-3 h-3 text-2xs text-text-tertiary flex items-center justify-center">
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
                        w-3 h-3 rounded-2xs heatmap-cell
                        ${day.date ? levelColors[day.level] : 'opacity-0'}
                        ${day.date ? 'cursor-pointer' : ''}
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
          className="fixed z-50 bg-surface-4 border border-border text-xs rounded-xs px-2.5 py-1.5 pointer-events-none shadow-lg"
          style={{ top: tooltip.y - 40, left: tooltip.x - 40 }}
        >
          <span className="text-text-secondary">{formatDate(tooltip.date)}: </span>
          <span className="text-text-primary font-medium">
            {tooltip.minutes === 0 ? 'مطالعه نداشتی' : formatMinutes(tooltip.minutes)}
          </span>
        </div>
      )}
    </div>
  )
}