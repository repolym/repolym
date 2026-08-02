import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { toPersianDigits } from '../../utils/jalali';

interface RiskDistributionProps {
    data: { riskLevel: string; count: number }[];
    onRiskClick: (level: string) => void;
}

const riskColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

const riskLabels = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا',
    critical: 'بحرانی',
};

export const RiskDistributionCard: React.FC<RiskDistributionProps> = ({ data, onRiskClick }) => {
    const chartData = data.map(item => ({
        ...item,
        label: riskLabels[item.riskLevel as keyof typeof riskLabels] || item.riskLevel,
        color: riskColors[item.riskLevel as keyof typeof riskColors] || '#94a3b8',
    }));

    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
            <h3 className="text-sm font-semibold text-text-secondary mb-4">توزیع ریسک</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => toPersianDigits(v)} />
                        <Tooltip formatter={(value: any) => toPersianDigits(value)} />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            onClick={(data) => {
                                if (data && data.payload) {
                                    onRiskClick(data.payload.riskLevel);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {chartData.map((entry, index) => (
                                <rect
                                    key={`bar-${index}`}
                                    fill={entry.color}
                                    width={40}
                                    height={entry.count / (Math.max(...chartData.map(d => d.count)) || 1) * 200}
                                    x={index * 60 + 20}
                                    y={200 - entry.count / (Math.max(...chartData.map(d => d.count)) || 1) * 200}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {chartData.map((item) => (
                    <div key={item.riskLevel} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.label}: {toPersianDigits(item.count)} ({toPersianDigits(total > 0 ? Math.round((item.count / total) * 100) : 0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};