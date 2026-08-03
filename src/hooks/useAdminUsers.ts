// src/hooks/useAdminUsers.ts - UPDATED
import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';
import type { User } from '../types/database';
import { useAuth } from '../context/AuthContext';

interface UseAdminUsersParams {
    search?: string;
    status?: 'active' | 'suspended' | 'all';
    isAdmin?: boolean;
    olympiadId?: string | null;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const useAdminUsers = (params: UseAdminUsersParams = {}) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isConsultant = currentUser?.role === 'ai_olympiad_consultant';

    // Use a stable object based on primitive values
    const stableParams = useMemo(() => ({
        search: params.search,
        status: params.status,
        isAdmin: isConsultant ? false : params.isAdmin,
        olympiadId: isConsultant ? 'ai' : params.olympiadId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'created_at',
        sortOrder: params.sortOrder || 'desc',
    }), [params.search, params.status, params.isAdmin, params.olympiadId, params.dateFrom, params.dateTo, params.page, params.limit, params.sortBy, params.sortOrder, isConsultant]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await adminService.getUsers(stableParams);
            setUsers(result.users);
            setTotal(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران');
        } finally {
            setLoading(false);
        }
    }, [stableParams]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const suspendUser = async (userId: string) => {
        await adminService.suspendUser(userId);
        await fetchUsers();
    };

    const activateUser = async (userId: string) => {
        await adminService.activateUser(userId);
        await fetchUsers();
    };

    const deleteUser = async (userId: string) => {
        await adminService.deleteUser(userId);
        await fetchUsers();
    };

    const refetch = fetchUsers;

    return { users, total, loading, error, refetch, suspendUser, activateUser, deleteUser };
};