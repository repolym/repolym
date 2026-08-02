import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { toPersianDigits } from '../../utils/jalali';

interface RiskDistributionCardProps {
    data: { riskLevel: string; count: number }[];
    onRiskClick: (level: string) => void;
}

const COLORS = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

const LABELS = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا',
    critical: 'بحرانی',
};

export const RiskDistributionCard: React.FC<RiskDistributionCardProps> = ({ data, onRiskClick }) => {
    const chartData = data.map(item => ({
        ...item,
        label: LABELS[item.riskLevel as keyof typeof LABELS] || item.riskLevel,
        color: COLORS[item.riskLevel as keyof typeof COLORS] || '#94a3b8',
    }));

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
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(data) => onRiskClick(data.riskLevel)}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                {chartData.map((item) => (
                    <div key={item.riskLevel}>
                        <span className="block font-medium text-text-secondary">{item.label}</span>
                        <span className="text-text-primary">{toPersianDigits(item.count)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};