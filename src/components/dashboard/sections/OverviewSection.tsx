import React from 'react'
import type { GoalWithProgress, StudySession, Test } from '../../../types/database'
import { GoalProgressCards } from '../GoalProgressCards'
import { formatMinutes } from '../../../utils/date-utils'

interface OverviewSectionProps {
    goals: GoalWithProgress[]
    loading: boolean
    sessions: StudySession[]
    tests: Test[]
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
    goals,
    loading,
    sessions,
    tests,
}) => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    const avgTestScore = tests.length
        ? Math.round(tests.reduce((sum, t) => sum + (t.score / t.max_score) * 100, 0) / tests.length)
        : 0

    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <p className="text-xs text-gray-400">مجموع مطالعه (بازه)</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatMinutes(totalMinutes)}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <p className="text-xs text-gray-400">میانگین نمرات آزمون</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{avgTestScore}%</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <p className="text-xs text-gray-400">اهداف فعال</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{goals.length}</p>
                </div>
            </div>

            <GoalProgressCards goals={goals} loading={loading} />
        </div>
    )
}
export default OverviewSection
