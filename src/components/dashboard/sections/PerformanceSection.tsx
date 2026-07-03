import React from 'react'
import type { Test } from '../../../types/database'
import { TestScoresChart } from '../TestScoresChart'

interface PerformanceSectionProps {
    tests: Test[]
    loading: boolean
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({ tests, loading }) => {
    return (
        <div className="mt-6">
            <TestScoresChart tests={tests} loading={loading} />
        </div>
    )
}
export default PerformanceSection