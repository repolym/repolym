export interface AdminFilterState {
    search: string;
    olympiadId: string | null;
    riskLevel: 'low' | 'medium' | 'high' | 'critical' | null;
    status: 'active' | 'suspended' | null;
    dateRange: 'today' | 'week' | 'month' | 'quarter';
}

export interface RiskDistribution {
    low: number;
    medium: number;
    high: number;
    critical: number;
}