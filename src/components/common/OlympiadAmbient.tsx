import React from 'react'
import { motion } from 'framer-motion'
import type { OlympiadEffect } from '../../config/olympiads'

interface OlympiadAmbientProps {
  effect: OlympiadEffect
  color: string
  className?: string
}

// موقعیت‌های ثابت (نه تصادفی در هر رندر) تا با هر بار رندر شدن، جای ستاره‌ها
// عوض نشود و انیمیشن پایدار بماند.
const STAR_POINTS: [number, number][] = [
  [12, 18], [28, 8], [46, 22], [64, 6], [80, 16], [92, 30],
  [8, 42], [34, 46], [58, 40], [76, 50], [20, 64], [50, 70],
  [70, 68], [88, 60], [40, 88], [64, 92],
]

const GEOMETRIC_SHAPES: [number, number, number][] = [
  [18, 22, 9], [72, 18, 6], [82, 68, 11], [24, 78, 7],
]

const FLOW_LINES = [20, 45, 70]

/**
 * جلوهٔ بصری سبک و معنادار مخصوص هر خانوادهٔ المپیاد. به‌جای ۱۴ افکت کاملاً
 * مجزا (که هم پرهزینه و هم بی‌معنا می‌شد)، المپیادها بر اساس ماهیت‌شان در
 * یکی از چهار خانواده قرار می‌گیرند:
 *  - geometric: المپیادهای دقیق/فنی (ریاضی، هوش مصنوعی، کامپیوتر، نانو)
 *  - cosmic: المپیادهای فضا/انرژی (فیزیک، نجوم)
 *  - organic: المپیادهای زیستی/مادی (زیست، شیمی، سلول‌های بنیادی، علوم زمین)
 *  - flow: المپیادهای انسانی/اطلاعاتی (اقتصاد، جغرافیا، ادبی، رسانه)
 * تمام افکت‌ها فقط از SVG/CSS و framer-motion (که از قبل در پروژه هست)
 * استفاده می‌کنند — بدون کتابخانهٔ جدید و با تعداد المان کم برای پرفورمنس بالا.
 */
export const OlympiadAmbient: React.FC<OlympiadAmbientProps> = ({ effect, color, className = '' }) => {
  if (effect === 'cosmic') {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {STAR_POINTS.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 0.6 : 0.35}
            fill={color}
            initial={{ opacity: 0.15 }}
            animate={{ opacity: [0.15, 0.85, 0.15] }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i % 7) * 0.4,
            }}
          />
        ))}
      </svg>
    )
  }

  if (effect === 'geometric') {
    const patternId = `olympiad-grid-${color.replace('#', '')}`
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={color} strokeWidth="0.15" opacity="0.35" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${patternId})`} />
        {GEOMETRIC_SHAPES.map(([cx, cy, size], i) => (
          <motion.rect
            key={i}
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.35"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40 + i * 10, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>
    )
  }

  if (effect === 'flow') {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {FLOW_LINES.map((y, i) => (
          <motion.path
            key={i}
            d={`M -10 ${y} Q 25 ${y - 8} 50 ${y} T 110 ${y}`}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.3"
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
          />
        ))}
      </svg>
    )
  }

  // organic (پیش‌فرض): موج‌های نرم و ارگانیک — مناسب المپیادهای زیستی/مادی
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <motion.div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl"
        style={{ backgroundColor: color, opacity: 0.18 }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-14 -left-8 w-56 h-56 rounded-full blur-3xl"
        style={{ backgroundColor: color, opacity: 0.14 }}
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}