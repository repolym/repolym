# آپگریڈ گایید نسخه ۲.۰

## تغییرات اصلی (Breaking Changes)

### ۱. جدول‌های جدید
اضافه شده‌اند:
- `plans` - برنامه‌های مطالعه
- `todos` - یادداشت‌های کاری

**اقدام مورد نیاز:**
اسکریپت `supabase-schema-v2.sql` را در SQL Editor Supabase اجرا کنید.

### ۲. ستون‌های جدید در جدول users
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS olympiad_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
```

### ۳. ستون‌های جدید در جدول study_sessions
```sql
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS resource TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_count INTEGER;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_difficulty TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS estimated_difficulty NUMERIC;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS tags TEXT;
```

### ۴. جدول streaks جدید
```sql
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## تغییرات Architecture

### Query Deduplication
- استفاده از `queryDeduplicator` برای جلوگیری از درخواست‌های تکراری
- Automatic caching با TTL قابل تنظیم
- امکان invalidation دستی یا خودکار

### Error Handling
- Logger نیاتی برای تمام سطح‌ها
- Structured error objects
- بهتر error recovery

### Validation
- Input validation قبل ارسال به سرور
- Sanitization خودکار
- Type-safe form data

## تغییرات Utilities

### Logger
```typescript
import { logger } from '@/utils/logger'

logger.debug('پیام debug', { context: 'data' })
logger.info('پیام info')
logger.warn('پیام warning')
logger.error('پیام خطا', error, { additional: 'context' })
```

### Validation
```typescript
import { validateEmail, validateSessionForm, ValidationErrorCollection } from '@/utils/validation'

const errors = new ValidationErrorCollection()
errors.add('email', 'ایمیل نامعتبر است')
if (!errors.isEmpty()) {
  console.log(errors.all())
}
```

### Query Deduplicator
```typescript
import { queryDeduplicator } from '@/utils/query-deduplicator'

const result = await queryDeduplicator.dedupedQuery(
  'unique-key',
  () => fetchData(),
  60000 // 1 minute cache
)

// Invalidate cache
queryDeduplicator.invalidate('unique-key')
```

## تغییرات Components

### ErrorBoundary
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### AsyncBoundary
```typescript
import { AsyncBoundary } from '@/components/common/AsyncBoundary'

<AsyncBoundary
  loading={isLoading}
  error={error}
  isEmpty={data.length === 0}
  emptyComponent={<div>هیچ داده‌ای وجود ندارد</div>}
>
  {/* Your content */}
</AsyncBoundary>
```

## Migration Steps

### Step 1: Update Database Schema
```bash
# Run in Supabase SQL Editor
psql -h db.supabase.co -U postgres -f supabase-schema-v2.sql
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Type Check
```bash
npm run type-check
```

### Step 4: Build and Test
```bash
npm run build
npm run preview
```

### Step 5: Deploy
- نقل تغییرات به production
- صبر کنید تا تمام کاربران cache را پاک کنند
- Monitor error logs

## Backward Compatibility

✅ تمام ویژگی‌های قدیمی حفظ شده‌اند
✅ Database migrations non-breaking هستند
✅ API signatures compatible هستند

## Performance Improvements

- Query deduplication کاهش درخواست‌های تکراری
- Smart caching with TTL
- Improved error logging for debugging
- Validation at client-side (less server load)

## Security Enhancements

- Input sanitization
- Validation before server submission
- Better error messages (no sensitive data leakage)
- RLS policies enhanced

## Troubleshooting

### Cache Issues
```typescript
queryDeduplicator.invalidateAll() // Clear all cache
```

### Type Errors
```bash
npm run type-check # Check all TypeScript errors
```

### Build Failures
```bash
npm run build:check # Check without bundling
```

## Next Steps

1. مطالعه `CHANGELOG.md` برای تمام تغییرات
2. Run all tests
3. Update any custom code using new utilities
4. Deploy to staging first
5. Monitor production logs

## Support

برای سوالات یا مشکلات، لطفاً issue باز کنید.