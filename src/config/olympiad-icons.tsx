
import type { LucideIcon } from 'lucide-react'
import {
  Sigma, Brain, Code2, Dna, FlaskConical, Atom, Telescope,
  Landmark, Microscope, Stethoscope, Mountain, Globe2, BookOpen,
  Newspaper, Sparkles,
} from 'lucide-react'

// نگاشت نام آیکون (رشته ذخیره‌شده در config/olympiads.ts) به کامپوننت واقعی —
// یک منبع مشترک تا AuthLayout، ویزارد ثبت‌نام و AppShell دوباره تعریفش نکنند.
export const OLYMPIAD_ICON_MAP: Record<string, LucideIcon> = {
  Sigma,
  Brain,
  Code2,
  Dna,
  FlaskConical,
  Atom,
  Telescope,
  Landmark,
  Microscope,
  Stethoscope,
  Mountain,
  Globe2,
  BookOpen,
  Newspaper,
  Sparkles, // آیکون پیش‌فرض/بازگشتی
}
