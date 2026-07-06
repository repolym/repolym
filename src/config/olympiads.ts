// پیکربندی المپیادها: هر المپیاد یک هویت بصری (رنگ/گرادیان/جلوهٔ پویا) و
// مجموعه‌ای از دروس پیش‌فرض دارد که هنگام ثبت‌نام به‌صورت خودکار پیشنهاد
// می‌شود و کاربر می‌تواند آن‌ها را سفارشی کند. این فایل تنها منبع حقیقت
// (single source of truth) برای هویت المپیادهاست تا در صفحه ثبت‌نام،
// داشبورد و تنظیمات یکسان استفاده شود.

export type OlympiadId =
  | 'math'
  | 'ai'
  | 'computer'
  | 'biology'
  | 'chemistry'
  | 'physics'
  | 'astronomy'
  | 'economics'
  | 'nanotech'
  | 'stemcell'
  | 'earth'
  | 'geography'
  | 'literary'
  | 'media'

// خانوادهٔ جلوهٔ بصری پویا — هر المپیاد بر اساس ماهیت موضوعش در یکی از این
// چهار خانواده قرار می‌گیرد تا افکت‌ها معنادار باشند نه صرفاً تزئینی:
// geometric (دقیق/فنی)، cosmic (فضا/انرژی)، organic (زیستی/مادی)، flow (انسانی/اطلاعاتی)
export type OlympiadEffect = 'geometric' | 'cosmic' | 'organic' | 'flow'

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
  effect: OlympiadEffect
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
    effect: 'geometric',
    defaultSubjects: [
      { name: 'جبر', color: '#4F46E5' },
      { name: 'هندسه', color: '#0EA5E9' },
      { name: 'نظریه اعداد', color: '#6366F1' },
      { name: 'ترکیبیات', color: '#8B5CF6' },
      { name: 'حسابان', color: '#4338CA' },
      { name: 'احتمال', color: '#3B82F6' },
    ],
  },
  {
    id: 'ai',
    label: 'المپیاد هوش مصنوعی',
    shortLabel: 'هوش مصنوعی',
    tagline: 'یادگیری ماشین‌ها و آیندهٔ هوشمند',
    icon: 'Brain',
    gradient: 'from-fuchsia-600 via-purple-600 to-violet-700',
    glow: '#9333EA',
    accent: '#9333EA',
    effect: 'geometric',
    defaultSubjects: [
      { name: 'جبر خطی', color: '#9333EA' },
      { name: 'حسابان', color: '#A855F7' },
      { name: 'آمار و احتمال', color: '#7C3AED' },
      { name: 'برنامه‌نویسی', color: '#C026D3' },
      { name: 'الگوریتم', color: '#A21CAF' },
      { name: 'یادگیری ماشین', color: '#D946EF' },
      { name: 'یادگیری عمیق', color: '#86198F' },
      { name: 'بهینه‌سازی', color: '#7E22CE' },
    ],
  },
  {
    id: 'computer',
    label: 'المپیاد کامپیوتر',
    shortLabel: 'کامپیوتر',
    tagline: 'الگوریتم، منطق و برنامه‌نویسی',
    icon: 'Code2',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    glow: '#0D9488',
    accent: '#0D9488',
    effect: 'geometric',
    defaultSubjects: [
      { name: 'برنامه‌نویسی', color: '#0D9488' },
      { name: 'الگوریتم', color: '#14B8A6' },
      { name: 'ساختمان داده', color: '#0891B2' },
      { name: 'ریاضیات گسسته', color: '#059669' },
      { name: 'نظریه اعداد', color: '#0E7490' },
      { name: 'ترکیبیات', color: '#06B6D4' },
      { name: 'گراف', color: '#0F766E' },
    ],
  },
  {
    id: 'biology',
    label: 'المپیاد زیست‌شناسی',
    shortLabel: 'زیست‌شناسی',
    tagline: 'شگفتی‌های موجودات زنده',
    icon: 'Dna',
    gradient: 'from-lime-500 via-green-600 to-emerald-700',
    glow: '#84CC16',
    accent: '#65A30D',
    effect: 'organic',
    defaultSubjects: [
      { name: 'زیست سلولی و مولکولی', color: '#65A30D' },
      { name: 'ژنتیک', color: '#16A34A' },
      { name: 'بیوشیمی', color: '#22C55E' },
      { name: 'فیزیولوژی', color: '#4D7C0F' },
      { name: 'اکولوژی', color: '#15803D' },
      { name: 'فرگشت', color: '#84CC16' },
    ],
  },
  {
    id: 'chemistry',
    label: 'المپیاد شیمی',
    shortLabel: 'شیمی',
    tagline: 'واکنش‌ها، مولکول‌ها و ماده',
    icon: 'FlaskConical',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    glow: '#F97316',
    accent: '#EA580C',
    effect: 'organic',
    defaultSubjects: [
      { name: 'شیمی عمومی', color: '#EA580C' },
      { name: 'شیمی آلی', color: '#F97316' },
      { name: 'شیمی معدنی', color: '#D97706' },
      { name: 'شیمی فیزیک', color: '#DC2626' },
      { name: 'شیمی تجزیه', color: '#C2410C' },
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
    effect: 'cosmic',
    defaultSubjects: [
      { name: 'مکانیک', color: '#0891B2' },
      { name: 'الکترومغناطیس', color: '#0EA5E9' },
      { name: 'گرما', color: '#F59E0B' },
      { name: 'نور', color: '#FBBF24' },
      { name: 'فیزیک مدرن', color: '#6366F1' },
      { name: 'ریاضیات', color: '#0369A1' },
    ],
  },
  {
    id: 'astronomy',
    label: 'المپیاد نجوم و اخترفیزیک',
    shortLabel: 'نجوم و اخترفیزیک',
    tagline: 'کهکشان‌ها، ستاره‌ها و آسمان',
    icon: 'Telescope',
    gradient: 'from-indigo-800 via-blue-900 to-slate-900',
    glow: '#3B82F6',
    accent: '#312E81',
    effect: 'cosmic',
    defaultSubjects: [
      { name: 'نجوم', color: '#312E81' },
      { name: 'اخترفیزیک', color: '#3B82F6' },
      { name: 'مکانیک سماوی', color: '#6366F1' },
      { name: 'کیهان‌شناسی', color: '#4C1D95' },
      { name: 'فیزیک', color: '#1D4ED8' },
      { name: 'ریاضیات', color: '#4338CA' },
    ],
  },
  {
    id: 'economics',
    label: 'المپیاد اقتصاد، مدیریت و حکمرانی',
    shortLabel: 'اقتصاد و مدیریت',
    tagline: 'اقتصاد، مدیریت و حکمرانی جامعه',
    icon: 'Landmark',
    gradient: 'from-yellow-600 via-amber-700 to-stone-700',
    glow: '#CA8A04',
    accent: '#A16207',
    effect: 'flow',
    defaultSubjects: [
      { name: 'اقتصاد', color: '#A16207' },
      { name: 'مدیریت', color: '#B45309' },
      { name: 'ریاضیات', color: '#92400E' },
      { name: 'آمار', color: '#CA8A04' },
      { name: 'جامعه‌شناسی', color: '#78716C' },
      { name: 'روان‌شناسی', color: '#C2410C' },
      { name: 'حکمرانی', color: '#854D0E' },
    ],
  },
  {
    id: 'nanotech',
    label: 'المپیاد علوم و فناوری نانو',
    shortLabel: 'علوم و فناوری نانو',
    tagline: 'دنیای شگفت‌انگیز در مقیاس نانو',
    icon: 'Microscope',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    glow: '#38BDF8',
    accent: '#2563EB',
    effect: 'geometric',
    defaultSubjects: [
      { name: 'نانوشیمی', color: '#2563EB' },
      { name: 'نانوفیزیک', color: '#0EA5E9' },
      { name: 'نانوزیست', color: '#06B6D4' },
      { name: 'مواد', color: '#1D4ED8' },
      { name: 'مشخصه‌یابی', color: '#0284C7' },
      { name: 'نانوفناوری', color: '#3B82F6' },
    ],
  },
  {
    id: 'stemcell',
    label: 'المپیاد سلول‌های بنیادی و پزشکی بازساختی',
    shortLabel: 'سلول‌های بنیادی',
    tagline: 'بازسازی حیات در سطح سلولی',
    icon: 'Stethoscope',
    gradient: 'from-rose-500 via-pink-600 to-red-700',
    glow: '#F43F5E',
    accent: '#E11D48',
    effect: 'organic',
    defaultSubjects: [
      { name: 'زیست سلولی', color: '#E11D48' },
      { name: 'ژنتیک', color: '#F43F5E' },
      { name: 'زیست مولکولی', color: '#DB2777' },
      { name: 'بیوشیمی', color: '#BE123C' },
      { name: 'بافت‌شناسی', color: '#EC4899' },
      { name: 'پزشکی بازساختی', color: '#9F1239' },
    ],
  },
  {
    id: 'earth',
    label: 'المپیاد علوم زمین',
    shortLabel: 'علوم زمین',
    tagline: 'لایه‌های زمین و تاریخ کرهٔ ما',
    icon: 'Mountain',
    gradient: 'from-stone-600 via-orange-800 to-amber-900',
    glow: '#B45309',
    accent: '#92400E',
    effect: 'organic',
    defaultSubjects: [
      { name: 'زمین‌شناسی', color: '#92400E' },
      { name: 'کانی‌شناسی', color: '#B45309' },
      { name: 'سنگ‌شناسی', color: '#78350F' },
      { name: 'دیرینه‌شناسی', color: '#A16207' },
      { name: 'ژئوشیمی', color: '#C2410C' },
      { name: 'آب‌شناسی', color: '#0E7490' },
    ],
  },
  {
    id: 'geography',
    label: 'المپیاد جغرافیا',
    shortLabel: 'جغرافیا',
    tagline: 'زمین، اقلیم و مکان‌ها',
    icon: 'Globe2',
    gradient: 'from-sky-500 via-teal-500 to-emerald-600',
    glow: '#2DD4BF',
    accent: '#059669',
    effect: 'flow',
    defaultSubjects: [
      { name: 'جغرافیای طبیعی', color: '#059669' },
      { name: 'جغرافیای انسانی', color: '#D97706' },
      { name: 'اقلیم‌شناسی', color: '#0EA5E9' },
      { name: 'ژئومورفولوژی', color: '#78716C' },
      { name: 'GIS', color: '#0891B2' },
      { name: 'نقشه‌خوانی', color: '#16A34A' },
    ],
  },
  {
    id: 'literary',
    label: 'المپیاد ادبی',
    shortLabel: 'ادبی',
    tagline: 'ادبیات، زبان و هنر کلام',
    icon: 'BookOpen',
    gradient: 'from-rose-800 via-red-900 to-neutral-900',
    glow: '#BE123C',
    accent: '#7F1D1D',
    effect: 'flow',
    defaultSubjects: [
      { name: 'ادبیات فارسی', color: '#7F1D1D' },
      { name: 'عربی', color: '#9A3412' },
      { name: 'زبان‌شناسی', color: '#B91C1C' },
      { name: 'عروض و قافیه', color: '#A16207' },
      { name: 'آرایه‌های ادبی', color: '#BE123C' },
      { name: 'نقد ادبی', color: '#78350F' },
    ],
  },
  {
    id: 'media',
    label: 'المپیاد سواد رسانه‌ای',
    shortLabel: 'سواد رسانه‌ای',
    tagline: 'تفکر نقادانه در دنیای اطلاعات',
    icon: 'Newspaper',
    gradient: 'from-slate-600 via-gray-700 to-zinc-800',
    glow: '#64748B',
    accent: '#475569',
    effect: 'flow',
    defaultSubjects: [
      { name: 'سواد رسانه‌ای', color: '#475569' },
      { name: 'تفکر انتقادی', color: '#334155' },
      { name: 'منطق', color: '#64748B' },
      { name: 'ارتباطات', color: '#0F766E' },
      { name: 'تحلیل رسانه', color: '#52525B' },
    ],
  },
]

// اگر شناسهٔ ذخیره‌شدهٔ کاربر با هیچ‌کدام از المپیادهای فعلی مطابقت نداشت
// (مثلاً دادهٔ قدیمی)، به‌جای بازگرداندن یک المپیاد نامرتبط، null برمی‌گردانیم
// تا فراخوان‌کننده به‌درستی به حالت «بدون المپیاد» برگردد.
export const getOlympiad = (id: string | null | undefined): OlympiadTheme | null =>
  OLYMPIADS.find((o) => o.id === id) ?? null
