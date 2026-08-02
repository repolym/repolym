export interface AdminFilters {
    olympiadId: string | null;
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'custom';
    dateFrom: string | null;
    dateTo: string | null;
    riskLevel: 'all' | 'low' | 'medium' | 'high' | 'critical';
    status: 'all' | 'active' | 'suspended';
    search: string;
}

export interface AdminAnalyticsData {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    totalTests: number;
    avgStudyMinutes: number;
    consistencyScore: number;
    recoveryScore: number;
    riskScore: number;
    studentsAtRisk: number;
    topOlympiads: { olympiad: string; count: number }[];
    dailyStudy: { date: string; minutes: number; average: number }[];
    subjectDistribution: { subject: string; minutes: number; color: string }[];
    riskDistribution: { riskLevel: string; count: number }[];
    recentActivity: { action: string; user: string; time: string }[];
    anomalies: Anomaly[];
    insights: Insight[];
}

export interface Anomaly {
    id: string;
    student: string;
    studentId: string;
    olympiad: string;
    description: string;
    date: string;
    type: 'drop' | 'increase' | 'inactivity' | 'sleep' | 'phone' | 'burnout' | 'irregular' | 'missing';
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
}

export interface Insight {
    id: string;
    title: string;
    description: string;
    recommendation: string;
    date: string;
    type: 'improvement' | 'risk' | 'achievement' | 'suggestion' | 'warning';
    studentId?: string;
    studentName?: string;
    olympiad?: string;
}