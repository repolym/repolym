// src/utils/auth-cleanup.ts
export const cleanupAuthParams = () => {
    const href = window.location.href;

    // بررسی می‌کنیم که آیا پارامترهای سوپابیس (در هش یا کوئری) وجود دارند یا خیر
    if (
        href.includes('access_token') ||
        href.includes('refresh_token') ||
        href.includes('type=recovery') ||
        href.includes('code=')
    ) {
        // ساخت یک URL تمیز که کاربر را مستقیماً به داشبورد هدایت کند
        // بدون اینکه صفحه رفرش شود (حفظ State اپلیکیشن)
        const cleanUrl = window.location.origin + import.meta.env.BASE_URL + '#/dashboard';

        try {
            window.history.replaceState({}, document.title, cleanUrl);
        } catch {
            window.location.hash = '#/dashboard';
        }
    }
}