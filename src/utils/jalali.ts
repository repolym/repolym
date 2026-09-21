import * as jalaali from 'jalaali-js'

const PERSIAN_WEEKDAYS = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
]

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

const toPersianDigits = (num: number | string): string =>
    num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)])

export const toJalali = (gregorianISODate: string): string => {
    const date = new Date(gregorianISODate + 'T00:00:00')
    const j = jalaali.toJalaali(date)
    return `${toPersianDigits(j.jy)}/${toPersianDigits(j.jm)}/${toPersianDigits(j.jd)}`
}

export const toJalaliLong = (gregorianISODate: string): string => {
    const date = new Date(gregorianISODate + 'T00:00:00')
    const j = jalaali.toJalaali(date)
    const dayIndex = (date.getDay() + 1) % 7 // convert JS Sunday=0 to Saturday=0
    const weekday = PERSIAN_WEEKDAYS[dayIndex]
    const month = PERSIAN_MONTHS[j.jm - 1]
    return `${weekday} - ${toPersianDigits(j.jd)} ${month} ${toPersianDigits(j.jy)}`
}

export const toJalaliShort = (gregorianISODate: string): string => {
    const date = new Date(gregorianISODate + 'T00:00:00')
    const j = jalaali.toJalaali(date)
    const month = PERSIAN_MONTHS[j.jm - 1]
    return `${toPersianDigits(j.jd)} ${month}`
}

export const toGregorian = (jalaliStr: string): string => {
    // expects format "YYYY/MM/DD" with Persian digits
    const persianToEnglish = (s: string) => s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    const parts = jalaliStr.split('/').map(p => parseInt(persianToEnglish(p)))
    if (parts.length !== 3) throw new Error('فرمت تاریخ باید YYYY/MM/DD باشد')
    const g = jalaali.toGregorian(parts[0], parts[1], parts[2])
    return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
}

export interface JalaliMonthRange {
    year: number
    month: number
    monthName: string
    label: string
    from: string
    to: string
}

const gregorianToISO = (gy: number, gm: number, gd: number): string =>
    `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`

export const getJalaliParts = (gregorianISODate: string): { jy: number; jm: number; jd: number } => {
    const date = new Date(gregorianISODate + 'T00:00:00')
    return jalaali.toJalaali(date)
}

export const getJalaliMonthRange = (date: Date = new Date()): JalaliMonthRange => {
    const j = jalaali.toJalaali(date)
    const lastDay = j.jm <= 6
        ? 31
        : j.jm <= 11
            ? 30
            : (jalaali.isLeapJalaaliYear(j.jy) ? 30 : 29)
    const start = jalaali.toGregorian(j.jy, j.jm, 1)
    const end = jalaali.toGregorian(j.jy, j.jm, lastDay)
    const monthName = PERSIAN_MONTHS[j.jm - 1]

    return {
        year: j.jy,
        month: j.jm,
        monthName,
        label: `${monthName} ${toPersianDigits(j.jy)}`,
        from: gregorianToISO(start.gy, start.gm, start.gd),
        to: gregorianToISO(end.gy, end.gm, end.gd),
    }
}

export const todayJalali = (): string => {
    const now = new Date()
    const j = jalaali.toJalaali(now)
    return `${toPersianDigits(j.jy)}/${toPersianDigits(j.jm)}/${toPersianDigits(j.jd)}`
}

export const formatMinutesPersian = (minutes: number): string => {
    if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (m === 0) return `${toPersianDigits(h)} ساعت`
    return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`
}

export { toPersianDigits, PERSIAN_WEEKDAYS, PERSIAN_MONTHS }
