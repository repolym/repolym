
import React from 'react'
import { LayoutDashboard, Clock, BarChart3, TrendingUp, Activity, Trophy } from 'lucide-react'

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
}

interface DashboardTabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (id: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
    overview:     <LayoutDashboard className="w-4 h-4" />,
    study:        <Clock className="w-4 h-4" />,
    performance:  <BarChart3 className="w-4 h-4" />,
    growth:       <TrendingUp className="w-4 h-4" />,
    analytics:    <Activity className="w-4 h-4" />,
    leaderboard:  <Trophy className="w-4 h-4" />,
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ tabs, activeTab, onChange }) => {
    return (
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${isActive
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }
            `}
                    >
                        {iconMap[tab.id] || tab.icon || null}
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
