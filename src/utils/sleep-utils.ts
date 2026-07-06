/**
 * Calculates sleep duration in hours from a bedtime and a wake time.
 * Handles the case where sleep crosses midnight (e.g. 23:30 -> 07:00 = 7.5h).
 *
 * @param bedtime  "HH:mm" or "HH:mm:ss" string, or null
 * @param wakeTime "HH:mm" or "HH:mm:ss" string, or null
 * @returns sleep duration in hours (rounded to 1 decimal), or null if inputs are missing/invalid
 */
export function calculateSleepHours(
    bedtime: string | null | undefined,
    wakeTime: string | null | undefined
): number | null {
    if (!bedtime || !wakeTime) return null

    const bedMinutes = parseTimeToMinutes(bedtime)
    const wakeMinutes = parseTimeToMinutes(wakeTime)

    if (bedMinutes === null || wakeMinutes === null) return null

    let diff = wakeMinutes - bedMinutes
    if (diff <= 0) {
        // Crossed midnight: wake time is "earlier" in the day than bedtime
        diff += 24 * 60
    }

    if (diff <= 0 || diff > 24 * 60) return null

    return Math.round((diff / 60) * 10) / 10
}

function parseTimeToMinutes(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim())
    if (!match) return null

    const hours = Number(match[1])
    const minutes = Number(match[2])

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

    return hours * 60 + minutes
}
