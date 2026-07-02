import type { LucideIcon } from 'lucide-react'
import { Sigma, Atom, FlaskConical, Leaf, Code2, Telescope, Sparkles } from 'lucide-react'

// نگاشت نام آیکون (رشته ذخیره‌شده در config/olympiads.ts) به کامپوننت واقعی —
// یک منبع مشترک تا AuthLayout و ویزارد ثبت‌نام دوباره تعریفش نکنند.
export const OLYMPIAD_ICON_MAP: Record<string, LucideIcon> = {
  Sigma,
  Atom,
  FlaskConical,
  Leaf,
  Code2,
  Telescope,
  Sparkles,
}
