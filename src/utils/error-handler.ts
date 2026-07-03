// پیام‌های فنی (خطاهای SQL، HTTP، شبکه و غیره) هرگز نباید مستقیم به کاربر نمایش
// داده شوند. این تابع فقط الگوهای شناخته‌شده را به پیام فارسی قابل‌فهم ترجمه
// می‌کند و برای هر چیز دیگری (که می‌تواند جزئیات فنی داخلی باشد) یک پیام عمومی
// و امن برمی‌گرداند. جزئیات اصلی فقط در کنسول لاگ می‌شود (برای دیباگ توسعه‌دهنده).
export const formatError = (error: unknown): string => {
  let msg = ''
  if (typeof error === 'string') msg = error
  else if (error instanceof Error) msg = error.message
  else if (typeof error === 'object' && error !== null && 'message' in error) {
    msg = String((error as { message: unknown }).message)
  } else {
    msg = ''
  }

  // فقط برای لاگ داخلی/دیباگ — هرگز به کاربر نمایش داده نمی‌شود
  if (msg) {
    // eslint-disable-next-line no-console
    console.error('[internal error]', error)
  }

  // نگاشت خطاهای شناخته‌شده Supabase/Auth/Network به پیام فارسی قابل‌فهم
  if (msg.includes('Invalid login credentials')) return 'ایمیل یا رمز عبور اشتباه است'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'این ایمیل قبلاً ثبت‌نام کرده است'
  if (msg.includes('Email not confirmed')) return 'لطفاً ایمیل خود را تأیید کنید'
  if (msg.includes('Password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد'
  if (msg.includes('Unable to validate email address')) return 'فرمت ایمیل نامعتبر است'
  if (msg.includes('profile setup failed')) return 'مشکل در ساخت پروفایل — لطفاً دوباره وارد شوید'
  if (msg.includes('JWT') || msg.includes('jwt') || msg.toLowerCase().includes('session')) {
    return 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.'
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.'
  }
  if (msg.toLowerCase().includes('duplicate key') || msg.toLowerCase().includes('unique constraint')) {
    return 'این اطلاعات قبلاً ثبت شده است.'
  }
  if (msg.toLowerCase().includes('check constraint') || msg.toLowerCase().includes('violates')) {
    return 'اطلاعات وارد شده معتبر نیست.'
  }
  if (msg.toLowerCase().includes('permission denied') || msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
    return 'شما اجازه دسترسی به این اطلاعات را ندارید.'
  }
  if (msg.toLowerCase().includes('timeout')) {
    return 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.'
  }

  // پیام‌های فارسیِ از پیش تعریف‌شده (مثلاً RAISE EXCEPTION های دیتابیس برای
  // قوانین کسب‌وکار مثل «مجموع ساعت مطالعه و گوشی نمی‌تواند بیش از ۲۴ ساعت باشد»)
  // در واقع همان پیام‌های دوستانه‌ای هستند که باید مستقیم به کاربر نشان داده شوند.
  const isPersianMessage = /[\u0600-\u06FF]/.test(msg) && !msg.toLowerCase().includes('relation')
  if (isPersianMessage && msg.length < 200) {
    return msg
  }

  // هر خطای ناشناخته دیگر: هرگز جزئیات فنی (پیام SQL، کد خطا، Stack) نشان داده نشود
  return 'مشکلی در ثبت اطلاعات پیش آمد. لطفاً دوباره تلاش کنید.'
}

export const isAuthError = (error: unknown): boolean => {
  const msg = formatError(error).toLowerCase()
  return msg.includes('auth') || msg.includes('jwt') || msg.includes('session')
}
