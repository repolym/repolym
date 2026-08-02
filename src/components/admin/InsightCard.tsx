import React from 'react';
import { Lightbulb, ChevronRight, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
    id: string;
    title: string;
    description: string;
    type: 'improvement' | 'risk' | 'achievement' | 'suggestion' | 'warning';
}

interface InsightCardProps {
    insights: Insight[];
    onViewAll: () => void;
}

const typeIcons = {
    improvement: <TrendingUp className="w-4 h-4 text-emerald-500" />,
    risk: <AlertTriangle className="w-4 h-4 text-red-500" />,
    achievement: <CheckCircle className="w-4 h-4 text-amber-500" />,
    suggestion: <Lightbulb className="w-4 h-4 text-blue-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-orange-500" />,
};

export const InsightCard: React.FC<InsightCardProps> = ({ insights, onViewAll }) => {
    return (
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    بینش‌های مربی
                </h3>
                <button onClick={onViewAll} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                    مشاهده همه <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            {insights.length === 0 ? (
                <p className="text-center text-text-tertiary text-sm py-8">هیچ بینشی موجود نیست</p>
            ) : (
                <div className="space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                        <div key={insight.id} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border-subtle">
                            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
                                {typeIcons[insight.type] || <Lightbulb className="w-4 h-4 text-accent" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{insight.title}</p>
                                <p className="text-xs text-text-secondary">{insight.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};