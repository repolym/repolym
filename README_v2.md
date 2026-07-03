# سامانه المپیاد - Study Tracking System v2.0

A production-grade Persian language study tracking application designed for olympiad students. Built with React, TypeScript, and Supabase.

## ✨ Features

- 📚 **Study Session Tracking** - Log study sessions with duration and notes
- 🎯 **Goal Management** - Set and track weekly/monthly study goals
- 📊 **Performance Analytics** - Visual charts and progress tracking
- 📝 **Test Scoring** - Track test results and performance trends
- 📅 **Calendar Heatmap** - Visualize study consistency
- 🔐 **Secure Authentication** - Supabase-powered auth with RLS
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌙 **Dark Mode Ready** - Tailwind CSS dark mode support
- ♿ **Accessibility** - WCAG 2.1 compliant

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone repository
git clone <repo-url>
cd olympiad-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_API_TIMEOUT=30000
VITE_LOG_LEVEL=info
```

## 🏗️ Architecture

### Technology Stack
- **Frontend:** React 18 + TypeScript 5
- **Styling:** Tailwind CSS 3
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **State Management:** React Context
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build:** Vite 5

### Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard
│   ├── auth/           # Authentication forms
│   ├── common/         # Shared components
│   ├── dashboard/      # Main dashboard
│   ├── focus/          # Focus mode
│   ├── goals/          # Goals management
│   ├── plans/          # Study plans
│   ├── profile/        # User profile
│   ├── public/         # Public pages
│   ├── sessions/       # Study sessions
│   ├── tests/          # Test tracking
│   └── todos/          # Tasks management
├── context/            # React contexts
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── types/              # TypeScript types
├── config/             # Configuration
├── styles/             # Global styles
└── App.tsx             # Root component

database/
├── supabase-schema-v2.sql    # Production schema
└── migrations/                # SQL migrations
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
npm run lint:types

# Preview production build
npm run preview
```

### TypeScript Strict Mode
Project uses strict TypeScript configuration:
- No implicit any
- No unused variables
- No unused parameters
- Force consistent casing
- Full type checking

### Code Quality

#### Logger
```typescript
import { logger } from '@/utils/logger'

logger.debug('Message', { context: 'data' })
logger.info('Information')
logger.warn('Warning')
logger.error('Error', error, { additional: 'context' })
```

#### Validation
```typescript
import { validateEmail, ValidationErrorCollection } from '@/utils/validation'

if (!validateEmail(email)) {
  console.log('Invalid email')
}

const errors = new ValidationErrorCollection()
errors.add('field', 'Error message')
if (!errors.isEmpty()) {
  errors.all() // Get all errors
}
```

#### Query Deduplication
```typescript
import { queryDeduplicator } from '@/utils/query-deduplicator'

const data = await queryDeduplicator.dedupedQuery(
  'unique-key',
  () => fetchData(),
  60000 // 1 minute cache TTL
)

// Invalidate specific key
queryDeduplicator.invalidate('unique-key')

// Clear all cache
queryDeduplicator.invalidateAll()
```

#### Error Boundary
```typescript
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

<ErrorBoundary fallback={<CustomError />}>
  <YourComponent />
</ErrorBoundary>
```

#### Async Data Handling
```typescript
import { AsyncBoundary } from '@/components/common/AsyncBoundary'

<AsyncBoundary
  loading={isLoading}
  error={error}
  isEmpty={data.length === 0}
  emptyComponent={<div>No data</div>}
>
  {/* Content */}
</AsyncBoundary>
```

## 📦 Database

### Schema Overview

#### Tables
- **users** - User profiles with preferences
- **subjects** - Study subjects/courses
- **study_sessions** - Study activity records
- **goals** - Study goals
- **tests** - Test scores
- **plans** - Study plans (NEW)
- **todos** - Task items (NEW)
- **streaks** - Streak tracking (NEW)

### Security

All tables use Row Level Security (RLS):
- Users can only access their own data
- Admins can access all data
- Public anon access for sharing features
- Proper foreign key constraints
- Cascading deletes

### Migrations

Run production schema:
```bash
# Using psql
psql -h db.supabase.co -U postgres -f supabase-schema-v2.sql

# Or in Supabase SQL Editor, copy and run the content
```

## 🔐 Authentication

### Sign Up
1. User enters email, name, password
2. Email verification (if enabled)
3. Onboarding with olympiad selection
4. Subject selection
5. Profile created

### Sign In
1. Email/password authentication
2. Session validation
3. Profile data loaded
4. Redirect to dashboard

### Session Management
- Automatic session refresh
- Session expiry detection
- Secure token storage
- Silent re-authentication

## 📊 Features Details

### Study Sessions
- Log study duration (1-1440 minutes)
- Optional subject association
- Notes/observations
- Resource references
- Question tracking
- Difficulty estimation
- Tag support

### Goals
- Set daily/weekly/monthly targets
- Track progress
- Status management (active/completed/archived)
- Date range tracking

### Test Management
- Record test scores
- Subject association
- Date tracking
- Notes/analysis

### Dashboard
- Weekly/monthly statistics
- Activity heatmap
- Trend charts
- Goal progress cards
- Streak tracking

## 🚀 Deployment

### Production Checklist
See `PRODUCTION_CHECKLIST.md` for complete deployment guide.

### Build Optimization
```bash
npm run build
# Creates optimized production build in dist/
```

### Environment Setup
1. Set environment variables in platform (Vercel, Netlify, etc.)
2. Configure Supabase project
3. Set up RLS policies
4. Enable email verification if needed
5. Configure auth redirects

### Deployment Platforms

#### Cloudflare Pages
```toml
[build]
command = "npm run build"
publish = "dist"

[env.production]
vars = { VITE_SUPABASE_URL = "...", VITE_SUPABASE_ANON_KEY = "..." }
```

#### Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key"
  }
}
```

#### Netlify
```toml
[build]
command = "npm run build"
publish = "dist"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

## 📈 Performance

### Metrics
- Page load: < 2 seconds
- First contentful paint: < 1 second
- Time to interactive: < 2 seconds

### Optimizations
- Request deduplication
- Intelligent caching
- Code splitting
- Lazy loading
- Image optimization
- CSS minification

### Monitoring
- Error tracking integration ready
- Performance metrics collection
- User session tracking
- Query performance monitoring

## 🧪 Testing

### Setup
```bash
npm install --save-dev vitest @testing-library/react
```

### Running Tests
```bash
npm run test
npm run test:coverage
```

### Testing Guidelines
- Test utility functions
- Test component rendering
- Test error states
- Test async operations
- Mock Supabase

## 🔄 Upgrading from v1

See `UPGRADE_GUIDE_v2.md` for detailed migration instructions.

### Key Changes
- New database tables and columns
- Enhanced error handling
- Query deduplication layer
- Input validation framework
- Error boundaries
- Structured logging

### Data Migration
- All existing data preserved
- No breaking changes
- Additive schema changes only

## 🤝 Contributing

### Code Style
- TypeScript strict mode
- Functional components
- React hooks
- Named exports
- Proper error handling
- Comprehensive validation

### Commit Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add tests
perf: Improve performance
```

### Pull Request Process
1. Create feature branch
2. Write/update tests
3. Update documentation
4. Run type check
5. Create pull request
6. Code review
7. Merge when approved

## 📚 Documentation

### Available Docs
- `README_v2.md` - This file
- `UPGRADE_GUIDE_v2.md` - Upgrade instructions
- `PRODUCTION_CHECKLIST.md` - Deployment guide
- `CHANGELOG_v2.md` - What's new
- Inline code comments

## 🐛 Debugging

### Development Tools
- React Developer Tools
- TypeScript strict checking
- Detailed error messages
- Console logging with levels

### Common Issues

#### Session Expiry
- Check Supabase session timeout
- Verify JWT token validity
- Check auth state listener

#### Build Errors
```bash
npm run type-check  # Check all types
npm run build:check # Check without bundling
```

#### Database Issues
- Verify RLS policies
- Check connection limits
- Review query performance
- Monitor connection pool

## 📞 Support

### Getting Help
1. Check documentation
2. Search existing issues
3. Check error logs
4. Create detailed issue report

### Issue Template
```markdown
## Description
Brief description of the issue

## Steps to Reproduce
1. ...
2. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: ...
- Browser: ...
- Node version: ...
```

## 📄 License

Project license information here.

## 🙏 Acknowledgments

- Supabase team for backend infrastructure
- React community
- Tailwind CSS creators
- All contributors

---

**Current Version:** 2.0.0  
**Status:** Production Ready  
**Last Updated:** 2024
