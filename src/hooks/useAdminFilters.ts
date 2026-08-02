import { useState, useCallback } from 'react';
import { AdminFilterState } from '../types/admin';

const defaultFilters: AdminFilterState = {
    search: '',
    olympiadId: null,
    riskLevel: null,
    status: null,
    dateRange: 'month',
};

export const useAdminFilters = () => {
    const [filters, setFiltersState] = useState<AdminFilterState>(defaultFilters);

    const setFilter = useCallback((key: keyof AdminFilterState, value: any) => {
        setFiltersState((prev: AdminFilterState) => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
    }, []);

    return { filters, setFilter, resetFilters };
};