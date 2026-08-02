import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/date-utils';

interface Anomaly {
    id: string;
    student: string;
    description: string;
    date: string;
    severity: 'low' | 'medium' | 'high';
}

interface AnomalyCardProps {
    anomalies: Anomaly[];
    onViewAll: () => void;
}

const severityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
};

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomalies, onViewAll }) => {
    return (
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    ناهنجاری‌های اخیر
                </h3>
                <button onClick={onViewAll} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                    مشاهده همه <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            {anomalies.length === 0 ? (
                <p className="text-center text-text-tertiary text-sm py-8">هیچ ناهنجاری ثبت نشده</p>
            ) : (
                <div className="space-y-3">
                    {anomalies.slice(0, 3).map((anomaly) => (
                        <div key={anomaly.id} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border-subtle">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${anomaly.severity === 'high' ? 'bg-red-500' : anomaly.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{anomaly.student}</p>
                                <p className="text-xs text-text-secondary">{anomaly.description}</p>
                                <p className="text-xs text-text-tertiary mt-0.5">{formatDate(anomaly.date)}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[anomaly.severity]}`}>
                                {anomaly.severity === 'low' ? 'کم' : anomaly.severity === 'medium' ? 'متوسط' : 'بالا'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};