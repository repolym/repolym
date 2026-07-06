// ============================================================
// FILE: src/components/profile/ProfilePage.tsx (COMPLETE)
// ============================================================
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSubjects } from '../../hooks/useSubjects'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import type { Subject } from '../../types/database'
import { ConfirmModal } from '../common/Modal'
import { SubjectForm, SubjectFormData } from '../common/SubjectForm'
import { OlympiadPicker } from '../common/OlympiadPicker'
import { AvatarCropModal } from './AvatarCropModal'
import { Avatar, getAvatarUrl } from '../common/Avatar'
import { getOlympiad } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import { formatError } from '../../utils/error-handler'
import { supabase } from '../../config/supabase'
import {
    User,
    Mail,
    Award,
    Palette,
    Edit2,
    Save,
    UserCircle2,
    LogOut,
    BookOpen,
    Plus,
    Trash2,
    Pencil,
    Camera,
    Moon,
    Sun,
    Monitor,
    Coffee,
    Check,
    Loader2,
} from 'lucide-react'

// ---------- Constants ----------
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

// 'sepia' is the new theme — a warm, paper-like palette (see index.css).
type ThemeMode = 'light' | 'dark' | 'sepia' | 'system'
const THEME_STORAGE_KEY = 'repolym_theme_preference'
const THEME_CLASSES = ['dark', 'theme-sepia'] as const

const getStoredTheme = (): ThemeMode => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
        if (stored && ['light', 'dark', 'sepia', 'system'].includes(stored)) return stored
    } catch { }
    return 'system'
}

const setStoredTheme = (theme: ThemeMode) => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch { }
}

const applyTheme = (theme: ThemeMode) => {
    const resolved =
        theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme

    const root = document.documentElement
    // Clear any previously-applied theme class first so switching between
    // dark / sepia / light never leaves a stale class behind.
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls))

    if (resolved === 'dark') root.classList.add('dark')
    else if (resolved === 'sepia') root.classList.add('theme-sepia')
    // 'light' needs no class — it's the :root default.
}

// ---------- Avatar Helpers ----------
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

// ---------- Profile Page ----------
export const ProfilePage: React.FC = () => {
    const { user, updateProfile, signOut } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const { data: subjects, loading: subjectsLoading, createSubject, updateSubject, deleteSubject, refetch: refetchSubjects } = useSubjects(user?.id ?? null)

    const [theme, setTheme] = useState<ThemeMode>(getStoredTheme)
    useEffect(() => {
        applyTheme(theme)
        setStoredTheme(theme)
    }, [theme])

    // Keep "system" theme in sync if the OS preference changes while the
    // profile tab is open.
    useEffect(() => {
        if (theme !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme('system')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme])

    const handleThemeChange = (newTheme: ThemeMode) => setTheme(newTheme)

    const [name, setName] = useState(user?.name || '')
    const [editingName, setEditingName] = useState(false)
    const [savingName, setSavingName] = useState(false)

    const [olympiadPickerOpen, setOlympiadPickerOpen] = useState(false)
    const [subjectFormOpen, setSubjectFormOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [cropSrc, setCropSrc] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const olympiadTheme = user?.olympiad_id ? getOlympiad(user.olympiad_id) : null
    const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null
    const existingSubjectNames = subjects.map((s) => s.name)

    const handleSaveName = async () => {
        if (!name.trim()) { showToast('نام نمی‌تواند خالی باشد', 'error'); return }
        if (name.trim() === user?.name) { setEditingName(false); return }
        setSavingName(true)
        try {
            await updateProfile({ name: name.trim() })
            showToast('نام با موفقیت به‌روزرسانی شد', 'success')
            setEditingName(false)
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setSavingName(false)
        }
    }

    const handleOlympiadComplete = () => refetchSubjects()

    const handleLogout = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    const handleCreateSubject = async (data: SubjectFormData) => {
        const ok = await createSubject(data)
        if (ok) showToast('درس اضافه شد', 'success')
        return ok
    }

    const handleUpdateSubject = async (data: SubjectFormData) => {
        if (!editingSubject) return false
        const ok = await updateSubject(editingSubject.id, data)
        if (ok) { showToast('درس ویرایش شد', 'success'); setEditingSubject(null) }
        return ok
    }

    const handleDeleteSubject = async () => {
        if (!deletingSubjectId) return
        await deleteSubject(deletingSubjectId)
        showToast('درس حذف شد', 'success')
        setDeletingSubjectId(null)
    }

    const handleAvatarClick = () => fileInputRef.current?.click()

    // Selecting a file only validates it and opens the crop modal — the
    // actual resize/compress/upload happens once the user confirms the crop.
    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { showToast('لطفاً یک فایل تصویری انتخاب کنید', 'error'); return }
        if (file.size > MAX_AVATAR_SIZE) {
            showToast(`حجم تصویر نباید بیشتر از ${MAX_AVATAR_SIZE / 1024 / 1024}MB باشد`, 'error')
            return
        }
        try {
            const dataUrl = await readFileAsDataURL(file)
            setCropSrc(dataUrl)
            setCropModalOpen(true)
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            // Reset so selecting the same file again still fires onChange.
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleCropModalClose = () => {
        if (uploadingAvatar) return
        setCropModalOpen(false)
        setCropSrc(null)
    }

    const handleCropConfirm = async (croppedDataUrl: string) => {
        if (!user?.id) return
        setUploadingAvatar(true)
        try {
            const fileName = `avatar_${Date.now()}.jpg`
            // Path convention `${userId}/...` matches the storage RLS policy
            // (see supabase/migrations — avatars bucket), which restricts
            // writes to the folder matching auth.uid().
            const filePath = `${user.id}/${fileName}`
            const blob = await fetch(croppedDataUrl).then(r => r.blob())

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true,
            })
            if (uploadError) {
                showToast('خطا در آپلود تصویر: ' + uploadError.message, 'error')
                return
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            // Cache-bust so the new photo shows immediately even though the
            // filename pattern can repeat across uploads.
            const versionedUrl = `${publicUrl}?v=${Date.now()}`

            // Goes through the same updateProfile() path as the name field,
            // which refreshes the user in context — no full page reload needed.
            await updateProfile({ preferences: { ...(user.preferences || {}), avatar_url: versionedUrl } })

            showToast('آواتار با موفقیت به‌روزرسانی شد', 'success')
            setCropModalOpen(false)
            setCropSrc(null)
        } catch (err) {
            showToast(formatError(err), 'error')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const avatarUrl = getAvatarUrl(user?.preferences)

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">پروفایل</h1>
                    <p className="text-sm text-text-secondary mt-1">اطلاعات حساب کاربری و تنظیمات</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    خروج
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-accent" />
                        </div>
                        <h2 className="font-semibold text-text-primary text-lg">اطلاعات شخصی</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-surface-2 rounded-xl">
                            <div className="relative">
                                <Avatar
                                    name={user?.name}
                                    avatarUrl={avatarUrl}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold"
                                />
                                <button
                                    onClick={handleAvatarClick}
                                    disabled={uploadingAvatar}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                                    title="تغییر و برش آواتار"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                                <p className="text-xs text-text-tertiary">تصویر پروفایل • حداکثر ۲MB • قابل برش قبل از ذخیره</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
                            <Mail className="w-5 h-5 text-text-tertiary" />
                            <div>
                                <p className="text-xs text-text-tertiary">ایمیل</p>
                                <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <UserCircle2 className="w-5 h-5 text-text-tertiary" />
                                <div className="flex-1">
                                    <p className="text-xs text-text-tertiary">نام</p>
                                    {editingName ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" placeholder="نام خود را وارد کنید" autoFocus />
                                            <Button variant="primary" size="sm" loading={savingName} onClick={handleSaveName}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingName(false); setName(user?.name || '') }}>
                                                انصراف
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                                            <button onClick={() => setEditingName(true)} className="text-text-tertiary hover:text-accent transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-text-primary">المپیاد</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {olympiadTheme && OlympiadIcon ? (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${olympiadTheme.accent}1A`, color: olympiadTheme.accent }}>
                                <OlympiadIcon className="w-6 h-6" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-text-tertiary text-xl">?</div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary">{olympiadTheme ? olympiadTheme.label : 'المپیادی انتخاب نشده'}</p>
                            <p className="text-xs text-text-tertiary">{olympiadTheme ? olympiadTheme.tagline : 'از دکمهٔ تغییر استفاده کنید'}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setOlympiadPickerOpen(true)}>تغییر</Button>
                    </div>
                </div>

                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="font-semibold text-text-primary">تم</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { mode: 'light', label: 'روشن', icon: Sun },
                            { mode: 'dark', label: 'تاریک', icon: Moon },
                            { mode: 'sepia', label: 'گرم', icon: Coffee },
                            { mode: 'system', label: 'سیستم', icon: Monitor },
                        ].map(({ mode, label, icon: Icon }) => {
                            const isActive = theme === mode
                            return (
                                <button
                                    key={mode}
                                    onClick={() => handleThemeChange(mode as ThemeMode)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isActive
                                        ? 'border-accent bg-accent-muted text-accent'
                                        : 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{label}</span>
                                    {isActive && <Check className="w-3 h-3 text-accent" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-accent" />
                            </div>
                            <h2 className="font-semibold text-text-primary">دروس</h2>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setSubjectFormOpen(true)}>
                            <Plus className="w-4 h-4" />
                            درس جدید
                        </Button>
                    </div>
                    {subjectsLoading && subjects.length === 0 ? (
                        <p className="text-sm text-text-tertiary">در حال بارگذاری...</p>
                    ) : subjects.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                                <BookOpen className="w-6 h-6 text-text-tertiary" />
                            </div>
                            <p className="text-sm text-text-secondary font-medium mb-1">هیچ درسی تعریف نشده است</p>
                            <p className="text-xs text-text-tertiary">برای شروع، اولین درس خود را اضافه کنید</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subjects.map((s) => (
                                <div key={s.id} className="card-hover px-4 py-3 flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="text-sm text-text-primary flex-1">{s.name}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingSubject(s); setSubjectFormOpen(true) }} className="btn-ghost text-xs">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeletingSubjectId(s.id)} className="btn-ghost text-xs hover:text-danger">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AvatarCropModal
                isOpen={cropModalOpen}
                imageSrc={cropSrc}
                loading={uploadingAvatar}
                onClose={handleCropModalClose}
                onConfirm={handleCropConfirm}
            />

            <OlympiadPicker
                isOpen={olympiadPickerOpen}
                onClose={() => setOlympiadPickerOpen(false)}
                currentOlympiadId={user?.olympiad_id ?? null}
                existingSubjectNames={existingSubjectNames}
                onComplete={handleOlympiadComplete}
            />

            <SubjectForm
                isOpen={subjectFormOpen}
                onClose={() => { setSubjectFormOpen(false); setEditingSubject(null) }}
                onSubmit={editingSubject ? handleUpdateSubject : handleCreateSubject}
                editing={editingSubject}
            />

            <ConfirmModal
                isOpen={!!deletingSubjectId}
                onClose={() => setDeletingSubjectId(null)}
                onConfirm={handleDeleteSubject}
                title="حذف درس"
                message="این درس حذف می‌شود. جلسات مرتبط بدون درس باقی می‌مانند."
                confirmLabel="حذف"
            />
        </div>
    )
}

export default ProfilePage