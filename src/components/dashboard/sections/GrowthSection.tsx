
import React from 'react'
import type { StudySession } from '../../../types/database'
import { StudyTrendChart } from '../StudyTrendChart'

interface GrowthSectionProps {
    sessions: StudySession[]
    loading: boolean
}

export const GrowthSection: React.FC<GrowthSectionProps> = ({ sessions, loading }) => {
    return (
        <div className="mt-6">
            <StudyTrendChart sessions={sessions} loading={loading} />
        </div>
    )
}

export default GrowthSection
