export const formatError = (error: unknown): string => {
  let msg = ''
  if (typeof error === 'string') msg = error
  else if (error instanceof Error) msg = error.message
  else if (typeof error === 'object' && error !== null && 'message' in error) {
    msg = String((error as { message: unknown }).message)
  } else {
    msg = 'خطای غیرمنتظره‌ای رخ داد'
  }

  // Map common Supabase errors to Persian
  if (msg.includes('Invalid login credentials')) return 'ایمیل یا رمز عبور اشتباه است'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'این ایمیل قبلاً ثبت‌نام کرده است'
  if (msg.includes('Email not confirmed')) return 'لطفاً ایمیل خود را تأیید کنید'
  if (msg.includes('Password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد'
  if (msg.includes('Unable to validate email address')) return 'فرمت ایمیل نامعتبر است'
  if (msg.includes('profile setup failed')) return 'مشکل در ساخت پروفایل — لطفاً دوباره وارد شوید'

  return msg
}

export const isAuthError = (error: unknown): boolean => {
  const msg = formatError(error).toLowerCase()
  return msg.includes('auth') || msg.includes('jwt') || msg.includes('session')
}
