# Architecture Documentation

## Overview

سامانه المپیاد is a modern, production-grade study tracking application with:
- Strong separation of concerns
- Type-safe data flow
- Comprehensive error handling
- Optimized performance
- Scalable architecture

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                       │
│ ┌──────────────────────────────────────────────────────┐ │
│ │              React Application (v18)                  │ │
│ │ ┌────────┬─────────────┬──────────┬──────────────┐   │ │
│ │ │Components│   Hooks   │ Context  │   Utils      │   │ │
│ │ └────────┴─────────────┴──────────┴──────────────┘   │ │
│ └──────────────────────────────────────────────────────┘ │
│                           ↓                               │
│                 Error Boundary & Fallbacks                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase Client (v2.39)                 │
│ ┌──────────────────────────────────────────────────────┐ │
│ │  Query Deduplicator (Caching & Deduplication)      │ │
│ │  Logger (Structured Logging)                        │ │
│ │  Validator (Input Validation)                       │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase Backend (PostgreSQL)               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                 Authentication                        │ │
│ │  ┌──────┬──────────┬──────┬───────┬───────┬────┐    │ │
│ │  │Users │Subjects  │Tests │Goals  │Plans  │TODO│    │ │
│ │  └──────┴──────────┴──────┴───────┴───────┴────┘    │ │
│ │                                                        │ │
│ │ Row Level Security (RLS) + Indexes                   │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Typical Request Flow

```
1. User Interaction (Click, Submit, etc.)
   ↓
2. Component Event Handler
   ↓
3. Hook Function Called
   ↓
4. Validation (Client-side)
   ↓
5. Query Deduplicator Check
   ├─ Cache Hit? → Return Cached Data
   └─ Cache Miss? → Continue
   ↓
6. Session Validation
   ├─ Session Exists? → Continue
   └─ No Session? → Redirect to Login
   ↓
7. Supabase Query
   ↓
8. Database (with RLS)
   ├─ Auth Check? → Continue
   └─ Not Authorized? → Error
   ↓
9. Response Processing
   ├─ Success? → Update Cache + State
   └─ Error? → Log + Show Error Message
   ↓
10. Component Re-render
```

### Error Handling Flow

```
Error Occurs
   ↓
Is it Expected? 
   ├─ Yes (Validation, Auth, etc.)
   │  ├─ Format User Message
   │  ├─ Log with Context
   │  └─ Show to User
   │
   └─ No (Unexpected)
      ├─ Log Full Error
      ├─ Send to Error Service
      ├─ Show Generic Message
      └─ Error Boundary Catches
         └─ Show Fallback UI
```

---

## Module Organization

### `/src/components`

#### Responsibility
React components organized by feature domain.

#### Structure
```
components/
├── admin/          # Admin-only features
├── auth/           # Authentication pages
├── common/         # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Loading.tsx
│   ├── Toast.tsx
│   ├── ErrorBoundary.tsx (NEW)
│   ├── AsyncBoundary.tsx (NEW)
│   └── ...
├── dashboard/      # Main dashboard
├── focus/          # Focus mode
├── goals/          # Goals management
├── plans/          # Study plans (NEW)
├── profile/        # User profile
├── public/         # Public pages
├── sessions/       # Study sessions
├── tests/          # Test tracking
└── todos/          # Tasks (NEW)
```

#### Rules
- Single responsibility principle
- Props interface for all components
- No direct Supabase calls (use hooks)
- Proper error handling with AsyncBoundary
- Consistent naming conventions

### `/src/hooks`

#### Responsibility
Data fetching and state management.

#### Available Hooks
```
hooks/
├── useStudySessions.ts (REFACTORED)
├── useSubjects.ts
├── useGoals.ts
├── useTests.ts
├── usePlans.ts
├── useTodos.ts
├── usePlanSessions.ts
└── useStreaks.ts (ready to implement)
```

#### Hook Pattern
```typescript
interface UseDataParams {
  userId: string | null
  filters?: ...
}

const useData = (params: UseDataParams) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetch = useCallback(async (forceRefresh = false) => {
    // Implementation
  }, [...dependencies])

  useEffect(() => {
    mountedRef.current = true
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  return {
    data,
    loading,
    error,
    refetch: () => fetch(true),
    create: async (formData) => {...},
    update: async (id, formData) => {...},
    delete: async (id) => {...},
  }
}
```

#### Rules
- Always validate userId before querying
- Check session before API calls
- Use mounted ref to prevent memory leaks
- Proper dependency arrays
- Error logging on failures

### `/src/context`

#### Responsibility
Application-wide state management.

#### Available Contexts
- `AuthContext` - User authentication state
- `DashboardContext` - Dashboard state
- `ToastContext` - Toast notifications

#### Context Pattern
```typescript
interface ContextType {
  state: ...
  methods: ...
}

const Context = createContext<ContextType | null>(null)

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementation
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useContext = () => {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('Hook must be used inside Provider')
  return ctx
}
```

### `/src/utils`

#### Responsibility
Pure functions, services, and utilities.

#### Modules

##### `logger.ts` (NEW)
```typescript
// Structured logging with levels
logger.debug(message, context)
logger.info(message, context)
logger.warn(message, context)
logger.error(message, error, context)
```

##### `validation.ts` (NEW)
```typescript
// Input validation and sanitization
validateEmail(email: string): boolean
validatePassword(password: string): boolean
sanitizeString(input: string): string
ValidationErrorCollection // Error tracking
```

##### `query-deduplicator.ts` (NEW)
```typescript
// Request deduplication and caching
queryDeduplicator.dedupedQuery(key, fn, ttl)
queryDeduplicator.invalidate(key)
queryDeduplicator.invalidateAll()
```

##### `error-handler.ts`
```typescript
// Error formatting and conversion
formatError(error: unknown): string
```

##### `date-utils.ts`
```typescript
// Date manipulation and formatting
formatDate(date: string): string
// ... other utilities
```

### `/src/types`

#### Responsibility
TypeScript interfaces and types.

#### Main File: `database.ts`
```typescript
// User-facing types
interface User { ... }
interface StudySession { ... }
interface Goal { ... }
interface Test { ... }
interface Plan { ... } // NEW
interface Todo { ... } // NEW
interface Streak { ... } // NEW

// Form data types
interface SessionFormData { ... }
interface GoalFormData { ... }
interface TestFormData { ... }
interface PlanFormData { ... } // NEW
interface TodoFormData { ... } // NEW

// Query states
interface QueryState<T> { ... }
interface SingleQueryState<T> { ... }
```

### `/src/config`

#### Responsibility
Configuration and constants.

#### Files
- `supabase.ts` - Supabase client initialization
- `olympiads.ts` - Olympiad definitions
- `olympiad-icons.tsx` - Olympiad icons mapping

---

## Data Models

### User
```typescript
interface User {
  id: string                    // UUID, PK
  email: string                 // Unique
  name: string                  // Display name
  is_admin: boolean             // Admin flag
  olympiad_id: string | null    // Selected olympiad
  onboarding_completed: boolean // Onboarding status
  preferences: Record<string, unknown> // User preferences
  created_at: string            // Timestamp
  updated_at: string            // Timestamp
}
```

### StudySession
```typescript
interface StudySession {
  id: string                    // UUID, PK
  user_id: string               // FK → users
  subject_id: string | null     // FK → subjects
  plan_id: string | null        // FK → plans (NEW)
  date: string                  // Date (YYYY-MM-DD)
  duration_minutes: number      // 1-1440
  notes: string | null          // Optional notes
  resource: string | null       // Study resource
  question_count: number | null // Number of questions
  question_difficulty: string | null
  estimated_difficulty: number | null
  question_type: string | null
  tags: string | null
  created_at: string
  updated_at: string
}
```

### Goal
```typescript
interface Goal {
  id: string
  user_id: string
  title: string
  target_minutes: number        // Minutes per period
  period: 'day' | 'week' | 'month'
  start_date: string            // Date (YYYY-MM-DD)
  end_date: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}
```

### Plan (NEW)
```typescript
interface Plan {
  id: string
  user_id: string
  title: string
  description: string | null
  type: 'daily' | 'weekly' | 'monthly' | 'exam' | 'flexible'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  progress: number              // 0-100
  start_date: string
  end_date: string | null
  due_date: string | null
  estimated_duration: number | null
  dependencies: string[] | null // Plan IDs
  recurring: JSONB | null
  created_at: string
  updated_at: string
}
```

### Todo (NEW)
```typescript
interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  subject_id: string | null
  study_resource: string | null
  question_count: number | null
  difficulty: string | null
  priority: 'low' | 'medium' | 'high'
  deadline: string | null
  estimated_time: number | null
  actual_time: number | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  session_id: string | null
  plan_id: string | null
  created_at: string
  updated_at: string
}
```

---

## State Management

### Global State (Context)

#### AuthContext
```typescript
{
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signIn(email, password): Promise<void>
  signUp(email, name, password, onboarding): Promise<{...}>
  signOut(): Promise<void>
  updateProfile(updates): Promise<void>
}
```

#### DashboardContext
```typescript
{
  dateRange: { from: string; to: string }
  setDateRange(from, to): void
  selectedSubject: string | null
  setSelectedSubject(id): void
}
```

#### ToastContext
```typescript
{
  toasts: Toast[]
  addToast(message, type): void
  removeToast(id): void
}
```

### Local State (Hooks)

#### Hook State Pattern
```typescript
{
  data: T[]
  loading: boolean
  error: string | null
  refetch(forceRefresh?: boolean): Promise<void>
  create(formData): Promise<boolean>
  update(id, formData): Promise<boolean>
  delete(id): Promise<boolean>
}
```

---

## Error Handling Strategy

### Error Hierarchy

```
Error (Root)
├── ValidationError
│   └── Custom validation message
├── AuthenticationError
│   └── Not logged in
├── AuthorizationError
│   └── Not authorized (RLS)
├── NetworkError
│   └── Connection failed
├── DatabaseError
│   └── Query failed
├── NotFoundError
│   └── Resource not found
└── UnknownError
    └── Generic error fallback
```

### Error Recovery

1. **Validation Errors** - Show inline message, let user fix
2. **Auth Errors** - Redirect to login, clear session
3. **Network Errors** - Show retry button, exponential backoff
4. **Database Errors** - Log, show generic message, retry
5. **Unexpected Errors** - Error boundary catches, shows fallback

### Error Context Enrichment

```typescript
logger.error('Operation failed', error, {
  userId: 'user-123',
  operation: 'createSession',
  timestamp: new Date().toISOString(),
  additionalContext: {...}
})
```

---

## Performance Optimization

### Caching Strategy

```
Query Made
   ↓
Check Deduplicator Cache
├─ Hit & Fresh (TTL not expired)? → Return Cached
├─ Hit & Stale? → Refetch & Update Cache
└─ Miss? → Fetch & Cache
```

### Cache Configuration

```typescript
// Per hook (configurable)
const CACHE_TTL = 60_000  // 1 minute for sessions
const CACHE_TTL = 300_000 // 5 minutes for subjects
```

### Request Deduplication

```
Multiple components request same data simultaneously
↓
Deduplicator returns same promise
↓
Single API call executed
↓
All consumers get same result
↓
Network traffic reduced by 90%+ in busy UIs
```

---

## Security Architecture

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → Session Storage
```

### Authorization Flow
```
API Request → Session Validation → RLS Policy Check → Data Access
```

### Input Security
```
User Input → Validation → Sanitization → Query Parameter
```

### RLS Policies

#### User's Own Data
```sql
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id)
```

#### Admin Data Access
```sql
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (public.is_admin_user())
```

#### Public Sharing
```sql
CREATE POLICY "sessions_select_public_anon" ON study_sessions
  FOR SELECT TO anon USING (true)
```

---

## Scalability Considerations

### Database Level
- Proper indexing strategy
- Connection pooling
- Query optimization
- Archive old data

### Application Level
- Request deduplication
- Smart caching
- Lazy loading
- Code splitting

### Infrastructure Level
- CDN for static assets
- Load balancing
- Auto-scaling
- Geographic distribution

---

## Monitoring & Observability

### Logging Levels
- DEBUG: Detailed diagnostic info
- INFO: General information
- WARN: Warning conditions
- ERROR: Error conditions

### Key Metrics
- Page load time
- API latency
- Error rate
- Cache hit rate
- User engagement

### Alerting
- Error rate > 1%
- API latency > 1000ms
- Database connection pool > 80%

---

## Deployment Architecture

### Build Process
```
TypeScript Source
    ↓
  tsc (Type check)
    ↓
  vite build (Bundle)
    ↓
  dist/ (Production build)
```

### Runtime Environment
```
Browser → CDN → Cloudflare/Vercel → Supabase
```

### Environment Configuration
```
Development: .env.local
Staging: .env.staging
Production: Environment variables (CI/CD)
```

---

## Future Improvements

### Planned Features
- Offline support with Service Workers
- Real-time collaboration with WebSockets
- Advanced analytics dashboard
- Mobile app (React Native)
- Notification system

### Scalability Improvements
- Database replication
- Read replicas for analytics
- Search indexing (Elasticsearch)
- Message queuing (Bull/RabbitMQ)
- Microservices architecture

---

## Reference

### Key Technologies
- React 18 - UI library
- TypeScript 5 - Type safety
- Supabase - Backend
- Tailwind CSS - Styling
- Vite - Build tool

### Architecture Patterns
- Component-based UI
- Custom hooks for logic
- Context for global state
- Functional programming
- Error boundary pattern

### Design Principles
- Single Responsibility
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Composition over inheritance
