// پیکربندی المپیادها: هر المپیاد یک هویت بصری (رنگ/گرادیان) و مجموعه‌ای از
// دروس پیش‌فرض دارد که هنگام ثبت‌نام به‌صورت خودکار پیشنهاد می‌شود و کاربر
// می‌تواند آن‌ها را سفارشی کند. این فایل تنها منبع حقیقت (single source of
// truth) برای هویت المپیادهاست تا در صفحه ثبت‌نام، داشبورد و تنظیمات یکسان
// استفاده شود.

export type OlympiadId =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer'
  | 'astronomy'
  | 'other'

export interface OlympiadSubject {
  name: string
  color: string
}

export interface OlympiadTheme {
  id: OlympiadId
  label: string
  shortLabel: string
  tagline: string
  icon: string // نام آیکون از lucide-react
  gradient: string // کلاس تیلویند برای پس‌زمینه گرادیانی
  glow: string // رنگ نور/سایه برای جلوه‌های نرم
  accent: string // رنگ اصلی به‌صورت hex (برای استفاده در نمودار/آیکون)
  defaultSubjects: OlympiadSubject[]
}

export const OLYMPIADS: OlympiadTheme[] = [
  {
    id: 'math',
    label: 'المپیاد ریاضی',
    shortLabel: 'ریاضی',
    tagline: 'دنیای اعداد، الگوها و برهان',
    icon: 'Sigma',
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    glow: '#4F46E5',
    accent: '#4F46E5',
    defaultSubjects: [
      { name: 'جبر', color: '#4F46E5' },
      { name: 'هندسه', color: '#0EA5E9' },
      { name: 'ترکیبیات', color: '#8B5CF6' },
      { name: 'نظریه اعداد', color: '#6366F1' },
    ],
  },
  {
    id: 'physics',
    label: 'المپیاد فیزیک',
    shortLabel: 'فیزیک',
    tagline: 'کشف قوانین حاکم بر جهان',
    icon: 'Atom',
    gradient: 'from-sky-500 via-cyan-600 to-blue-700',
    glow: '#0EA5E9',
    accent: '#0891B2',
    defaultSubjects: [
      { name: 'مکانیک', color: '#0891B2' },
      { name: 'الکترومغناطیس', color: '#0EA5E9' },
      { name: 'ترمودینامیک', color: '#F59E0B' },
      { name: 'فیزیک جدید', color: '#6366F1' },
    ],
  },
  {
    id: 'chemistry',
    label: 'المپیاد شیمی',
    shortLabel: 'شیمی',
    tagline: 'واکنش‌ها، مولکول‌ها و ماده',
    icon: 'FlaskConical',
    gradient: 'from-emerald-500 via-teal-600 to-green-700',
    glow: '#10B981',
    accent: '#059669',
    defaultSubjects: [
      { name: 'شیمی آلی', color: '#059669' },
      { name: 'شیمی معدنی', color: '#10B981' },
      { name: 'شیمی تجزیه', color: '#14B8A6' },
      { name: 'شیمی فیزیک', color: '#0D9488' },
    ],
  },
  {
    id: 'biology',
    label: 'المپیاد زیست‌شناسی',
    shortLabel: 'زیست',
    tagline: 'شگفتی‌های موجودات زنده',
    icon: 'Leaf',
    gradient: 'from-lime-500 via-green-600 to-emerald-700',
    glow: '#84CC16',
    accent: '#65A30D',
    defaultSubjects: [
      { name: 'زیست سلولی', color: '#65A30D' },
      { name: 'ژنتیک', color: '#84CC16' },
      { name: 'جانورشناسی', color: '#16A34A' },
      { name: 'گیاه‌شناسی', color: '#22C55E' },
    ],
  },
  {
    id: 'computer',
    label: 'المپیاد کامپیوتر',
    shortLabel: 'کامپیوتر',
    tagline: 'الگوریتم، منطق و برنامه‌نویسی',
    icon: 'Code2',
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-700',
    glow: '#A855F7',
    accent: '#9333EA',
    defaultSubjects: [
      { name: 'الگوریتم', color: '#9333EA' },
      { name: 'ساختمان داده', color: '#A855F7' },
      { name: 'ریاضیات گسسته', color: '#7C3AED' },
      { name: 'برنامه‌نویسی', color: '#C026D3' },
    ],
  },
  {
    id: 'astronomy',
    label: 'المپیاد نجوم',
    shortLabel: 'نجوم',
    tagline: 'کهکشان‌ها، ستاره‌ها و آسمان',
    icon: 'Telescope',
    gradient: 'from-indigo-800 via-blue-900 to-slate-900',
    glow: '#3B82F6',
    accent: '#312E81',
    defaultSubjects: [
      { name: 'اخترفیزیک', color: '#312E81' },
      { name: 'مکانیک سماوی', color: '#3B82F6' },
      { name: 'کیهان‌شناسی', color: '#6366F1' },
      { name: 'رصد عملی', color: '#1D4ED8' },
    ],
  },
  {
    id: 'other',
    label: 'سایر / سفارشی',
    shortLabel: 'سفارشی',
    tagline: 'مسیر خودت را بساز',
    icon: 'Sparkles',
    gradient: 'from-slate-600 via-gray-700 to-zinc-800',
    glow: '#64748B',
    accent: '#475569',
    defaultSubjects: [],
  },
]

export const getOlympiad = (id: string | null | undefined): OlympiadTheme =>
  OLYMPIADS.find((o) => o.id === id) ?? OLYMPIADS[OLYMPIADS.length - 1]
