import React from 'react'
import type { StudySession } from '../../../types/database'
import { Heatmap } from '../Heatmap'
import { StreakCard } from '../StreakCard'

interface StudySectionProps {
    sessions: StudySession[]
    loading: boolean
}

export const StudySection: React.FC<StudySectionProps> = ({ sessions, loading }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
                <Heatmap sessions={sessions} />
            </div>
            <div className="lg:col-span-1">
                <StreakCard sessions={sessions} loading={loading} />
            </div>
        </div>
    )
}
export default StudySection