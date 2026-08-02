import { useState, useMemo, useCallback } from 'react';
import { AdminFilters } from '../types/admin';

const defaultFilters: AdminFilters = {
    olympiadId: null,
    dateRange: 'month',
    dateFrom: null,
    dateTo: null,
    riskLevel: 'all',
    status: 'all',
    search: '',
};

export const useAdminFilters = () => {
    const [filters, setFiltersState] = useState<AdminFilters>(defaultFilters);

    const setFilters = useCallback((newFilters: Partial<AdminFilters>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
    }, []);

    const isFiltered = useMemo(() => {
        return (
            filters.olympiadId !== null ||
            filters.dateRange !== 'month' ||
            filters.riskLevel !== 'all' ||
            filters.status !== 'all' ||
            filters.search !== ''
        );
    }, [filters]);

    return { filters, setFilters, resetFilters, isFiltered };
};