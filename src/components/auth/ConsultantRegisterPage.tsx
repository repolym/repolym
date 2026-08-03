import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';
import { AuthLayout } from './AuthLayout';
import { formatError } from '../../utils/error-handler';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, X, Eye, EyeOff, Shield } from 'lucide-react';

export const ConsultantRegisterPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { signUp, user, isLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [verifying, setVerifying] = useState(true);

    // Verify the registration token
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                setVerifying(false);
                return;
            }

            try {
                const { data, error: rpcError } = await supabase
                    .rpc('consume_consultant_registration_token', { p_token: token });

                if (rpcError) {
                    console.error('Token verification error:', rpcError);
                    setTokenValid(false);
                } else {
                    setTokenValid(data === true);
                }
            } catch (err) {
                console.error('Token verification error:', err);
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    // If user already logged in, redirect to consultant users page
    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === 'ai_olympiad_consultant') {
                navigate('/admin/ai/users', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isLoading, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenValid) {
            showToast('لینک ثبت‌نام معتبر نیست', 'error');
            return;
        }

        if (!email.trim() || password.length < 8) {
            setError('لطفاً ایمیل و رمز عبور معتبر وارد کنید');
            return;
        }

        if (password !== confirmPassword) {
            setError('رمز عبور و تأیید آن مطابقت ندارند');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Sign up with consultant role - no name, no subjects
            const { requiresEmailConfirmation } = await signUp(
                email.trim(),
                'مشاور AI', // placeholder name, will be updated if needed
                password,
                {
                    olympiadId: 'ai',
                    subjects: [],
                    role: 'ai_olympiad_consultant',
                }
            );

            if (requiresEmailConfirmation) {
                showToast('ایمیل تأیید ارسال شد. لطفاً ایمیل خود را تأیید کنید.', 'success');
                navigate('/login', { replace: true });
            } else {
                showToast('ثبت‌نام با موفقیت انجام شد', 'success');
                navigate('/admin/ai/users', { replace: true });
            }
        } catch (err) {
            setError(formatError(err));
            showToast(formatError(err), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-text-secondary">در حال بررسی لینک ثبت‌نام...</p>
                </div>
            </AuthLayout>
        );
    }

    if (!tokenValid) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">لینک نامعتبر</h2>
                    <p className="text-text-secondary text-sm">
                        این لینک ثبت‌نام معتبر نیست یا منقضی شده است.
                        <br />
                        لطفاً با مدیر سیستم تماس بگیرید.
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-bold text-text-primary">ثبت‌نام مشاور المپیاد هوش مصنوعی</h2>
                </div>
                <p className="text-sm text-text-secondary mb-8">
                    برای ایجاد حساب مشاور، ایمیل و رمز عبور خود را وارد کنید.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ایمیل"
                            required
                            autoFocus
                            className="w-full pr-12 pl-4 py-3.5 bg-surface-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="رمز عبور (حداقل ۸ کاراکتر)"
                            required
                            minLength={8}
                            className="w-full pr-12 pl-12 py-3.5 bg-surface-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="تأیید رمز عبور"
                            required
                            className="w-full pr-12 pl-4 py-3.5 bg-surface-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                ایجاد حساب مشاور
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-text-tertiary">
                    این صفحه فقط برای ایجاد حساب مشاور المپیاد هوش مصنوعی طراحی شده است.
                </p>
            </motion.div>
        </AuthLayout>
    );
};

export default ConsultantRegisterPage;