// src/components/admin/ConsultantTokenManager.tsx - FIXED
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Skeleton } from '../common/Loading';
import { formatDate } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import {
    RefreshCw,
    Plus,
    Copy,
    Check,
    Link as LinkIcon,
    Trash2,
    Shield,
} from 'lucide-react';

interface Token {
    id: string;
    token: string;
    expires_at: string;
    created_at: string;
    used_at: string | null;
    used_by: string | null;
    created_by: string | null;
    is_used: boolean;
    is_expired: boolean;
}

export const ConsultantTokenManager: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [expiryHours, setExpiryHours] = useState(720); // 30 days default

    // Only admins can access this page
    const isAdmin = user?.is_admin || user?.role === 'admin';

    const fetchTokens = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_consultant_registration_tokens');
            if (error) throw error;
            setTokens(data || []);
        } catch (err) {
            showToast('خطا در دریافت توکن‌ها', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchTokens();
        }
    }, [isAdmin]);

    const generateToken = async () => {
        setGenerating(true);
        try {
            const { data, error } = await supabase.rpc('generate_consultant_registration_token', {
                p_created_by: user?.id,
                p_expires_in_hours: expiryHours,
            });

            if (error) throw error;

            showToast('توکن با موفقیت تولید شد', 'success');
            await fetchTokens();

            // Copy the token link automatically
            const token = data as string;
            const link = `${window.location.origin}${import.meta.env.BASE_URL}#/register/consultant/${token}`;
            await navigator.clipboard.writeText(link);
            showToast('لینک ثبت‌نام در کلیپ‌بورد کپی شد', 'success');
        } catch (err) {
            showToast('خطا در تولید توکن', 'error');
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const copyLink = (token: string) => {
        const link = `${window.location.origin}${import.meta.env.BASE_URL}#/register/consultant/${token}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
            showToast('لینک کپی شد', 'success');
        }).catch(() => {
            showToast('خطا در کپی لینک', 'error');
        });
    };

    const deleteToken = async (tokenId: string) => {
        if (!confirm('آیا از حذف این توکن اطمینان دارید؟')) return;
        try {
            const { error } = await supabase
                .from('consultant_registration_tokens')
                .delete()
                .eq('id', tokenId);

            if (error) throw error;
            showToast('توکن حذف شد', 'success');
            await fetchTokens();
        } catch (err) {
            showToast('خطا در حذف توکن', 'error');
            console.error(err);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    شما دسترسی به این صفحه را ندارید.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    const activeTokens = tokens.filter(t => !t.is_used && !t.is_expired);
    const usedTokens = tokens.filter(t => t.is_used);
    const expiredTokens = tokens.filter(t => t.is_expired && !t.is_used);

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Shield className="w-6 h-6 text-accent" />
                        مدیریت توکن‌های ثبت‌نام مشاور
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        تولید و مدیریت لینک‌های ثبت‌نام برای نقش مشاور المپیاد هوش مصنوعی
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchTokens} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            {/* Generate Token Form */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 mb-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">تولید توکن جدید</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            مدت اعتبار (ساعت)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={8760} // 1 year
                            value={expiryHours}
                            onChange={(e) => setExpiryHours(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <Button
                        variant="primary"
                        onClick={generateToken}
                        loading={generating}
                        className="shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        تولید توکن جدید
                    </Button>
                </div>
                <p className="text-xs text-text-tertiary mt-3">
                    توکن تولید شده به‌صورت خودکار در کلیپ‌بورد کپی می‌شود.
                    <br />
                    لینک ثبت‌نام به این شکل است:{' '}
                    <code className="bg-surface-3 px-2 py-0.5 rounded text-xs">
                        /register/consultant/توکن
                    </code>
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">{toPersianDigits(activeTokens.length)}</p>
                    <p className="text-xs text-text-tertiary">توکن‌های فعال</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">{toPersianDigits(usedTokens.length)}</p>
                    <p className="text-xs text-text-tertiary">استفاده شده</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">{toPersianDigits(expiredTokens.length)}</p>
                    <p className="text-xs text-text-tertiary">منقضی شده</p>
                </div>
            </div>

            {/* Tokens Table */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-2/80 text-text-secondary border-b border-border">
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">توکن</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">تاریخ ایجاد</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">انقضا</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">وضعیت</th>
                                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-text-tertiary">
                                        هیچ توکنی ثبت نشده است.
                                    </td>
                                </tr>
                            ) : (
                                tokens.map((token) => {
                                    const isActive = !token.is_used && !token.is_expired;
                                    const statusLabel = token.is_used
                                        ? 'استفاده شده'
                                        : token.is_expired
                                            ? 'منقضی شده'
                                            : 'فعال';
                                    const statusColor = token.is_used
                                        ? 'bg-surface-3 text-text-secondary'
                                        : token.is_expired
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700';

                                    return (
                                        <tr key={token.id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                                            <td className="py-3 px-4 font-mono text-xs text-text-secondary truncate max-w-[150px]">
                                                {token.token.slice(0, 16)}...
                                            </td>
                                            <td className="py-3 px-4 text-text-secondary text-xs whitespace-nowrap">
                                                {formatDate(token.created_at)}
                                            </td>
                                            <td className="py-3 px-4 text-text-secondary text-xs whitespace-nowrap">
                                                {formatDate(token.expires_at)}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                                {token.used_by && (
                                                    <span className="text-2xs text-text-tertiary block mt-0.5">
                                                        کاربر: {token.used_by.slice(0, 8)}...
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    {isActive && (
                                                        <button
                                                            onClick={() => copyLink(token.token)}
                                                            className="p-1.5 rounded-lg text-accent hover:bg-accent-muted transition-colors"
                                                            title="کپی لینک"
                                                        >
                                                            {copiedToken === token.token ? (
                                                                <Check className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {!token.is_used && (
                                                        <button
                                                            onClick={() => deleteToken(token.id)}
                                                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="حذف توکن"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isActive && (
                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}${import.meta.env.BASE_URL}#/register/consultant/${token.token}`;
                                                                window.open(link, '_blank');
                                                            }}
                                                            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-colors"
                                                            title="باز کردن لینک"
                                                        >
                                                            <LinkIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultantTokenManager;