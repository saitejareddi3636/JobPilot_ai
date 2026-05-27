# JobPilot AI — Complete Production Plan

> **Status:** Frontend demo complete. This document is the authoritative blueprint for taking it to production.
> Every section maps directly to existing frontend components and their backend requirements.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Database Schema (Prisma + PostgreSQL)](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Backend API — All Endpoints](#5-backend-api)
6. [AI Engine — Groq LLM + Field Detection](#6-ai-engine)
7. [User Onboarding Flow](#7-user-onboarding)
8. [Chrome Extension (Manifest V3)](#8-chrome-extension)
9. [File Storage — Resume Uploads](#9-file-storage)
10. [Frontend Integration — File-by-File Changes](#10-frontend-integration)
11. [Security Checklist](#11-security)
12. [Deployment & Infrastructure](#12-deployment)
13. [Environment Variables](#13-environment-variables)
14. [CI/CD Pipeline](#14-cicd)
15. [Phase Roadmap](#15-phase-roadmap)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────────────────┐      ┌───────────────────────────────┐   │
│  │  Web Dashboard        │      │  Chrome Extension (MV3)       │   │
│  │  React + React Query  │      │  Popup + Content Script       │   │
│  │  apps/web             │      │  apps/extension               │   │
│  └──────────┬───────────┘      └──────────────┬────────────────┘   │
└─────────────┼────────────────────────────────-┼────────────────────┘
              │ HTTPS + JWT                      │ HTTPS + JWT
              │                                  │
┌─────────────▼──────────────────────────────────▼────────────────────┐
│                        API LAYER  (apps/api)                        │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Auth Routes │  │  REST Routes  │  │  File Upload (Multipart)   │ │
│  │  /auth/*     │  │  /api/v1/*    │  │  /api/v1/resumes (POST)    │ │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Middleware Chain                                │   │
│  │  rateLimit → cors → helmet → auth(JWT) → validate → handler  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼────────────────────────────┐
        │                     │                            │
┌───────▼──────┐   ┌──────────▼───────┐   ┌───────────────▼──────┐
│  PostgreSQL   │   │  Object Storage   │   │   AI Service         │
│  (Supabase)   │   │  (Supabase or S3) │   │   (Anthropic Claude) │
│  Prisma ORM   │   │  Resumes + files  │   │   Field detect +     │
│               │   │                  │   │   Answer generate    │
└───────────────┘   └──────────────────┘   └──────────────────────┘
```

**Tech stack decisions:**

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + React Query v5 + React Router | Already built; add TanStack Query for server state |
| API | Node.js + Fastify + Zod | Fast, typed, schema-first |
| ORM | Prisma | Type-safe, migration-based |
| Database | PostgreSQL via Supabase | Hosted, Row Level Security, Storage included |
| Auth | Supabase Auth (JWTs) | Built-in, integrates with RLS, supports OAuth |
| File Storage | Supabase Storage | Same platform, signed URLs, RLS policies |
| AI | Groq API (llama-3.3-70b-versatile) | Ultra-fast inference, free tier generous, streaming |
| Extension | Chrome MV3 | Required by Chrome Web Store |
| Monorepo | pnpm workspaces + Turborepo | Shared types, parallel builds |
| Deployment | Vercel (web) + Render (api) | Free tiers, easy CD |
| Queue | Inngest | Durable async jobs for AI processing |

---

## 2. Monorepo Structure

```
jobpilot/                          ← repo root
├── apps/
│   ├── web/                       ← current React app (rename jobpilot-ai → web)
│   │   ├── src/
│   │   │   ├── api/               ← NEW: API client layer (replaces mock data)
│   │   │   │   ├── client.ts      ← axios/fetch base client with auth headers
│   │   │   │   ├── profile.ts
│   │   │   │   ├── applications.ts
│   │   │   │   ├── resumes.ts
│   │   │   │   ├── savedAnswers.ts
│   │   │   │   ├── stats.ts
│   │   │   │   └── fields.ts
│   │   │   ├── hooks/             ← NEW: React Query hooks
│   │   │   │   ├── useProfile.ts
│   │   │   │   ├── useApplications.ts
│   │   │   │   ├── useResumes.ts
│   │   │   │   ├── useSavedAnswers.ts
│   │   │   │   └── useStats.ts
│   │   │   ├── auth/              ← NEW: Auth context + Supabase client
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── supabase.ts
│   │   │   ├── components/        ← existing (mostly unchanged)
│   │   │   ├── pages/             ← existing (replace mock data with hooks)
│   │   │   ├── data/              ← KEEP for fallback stubs during migration
│   │   │   └── types/             ← KEEP (source of truth, shared via package)
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── api/                       ← NEW: Fastify backend
│   │   ├── src/
│   │   │   ├── server.ts          ← Fastify instance + plugin registration
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── profile.ts
│   │   │   │   ├── applications.ts
│   │   │   │   ├── resumes.ts
│   │   │   │   ├── savedAnswers.ts
│   │   │   │   ├── stats.ts
│   │   │   │   └── fields.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts        ← JWT verification via Supabase
│   │   │   │   ├── validate.ts    ← Zod schema validation
│   │   │   │   └── rateLimit.ts
│   │   │   ├── services/
│   │   │   │   ├── ai.ts          ← Claude API calls
│   │   │   │   ├── fieldDetector.ts ← DOM analysis + field matching
│   │   │   │   ├── resumeParser.ts  ← PDF text extraction
│   │   │   │   └── storage.ts     ← Supabase Storage
│   │   │   ├── jobs/              ← Inngest functions
│   │   │   │   ├── generateAnswers.ts
│   │   │   │   └── parseResume.ts
│   │   │   └── lib/
│   │   │       ├── prisma.ts
│   │   │       └── supabase.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── extension/                 ← NEW: Chrome Extension (MV3)
│       ├── src/
│       │   ├── popup/
│       │   │   ├── index.tsx      ← Extension popup React app
│       │   │   └── Popup.tsx      ← Wraps ExtensionPopup component
│       │   ├── content/
│       │   │   ├── index.ts       ← Content script injected into job pages
│       │   │   ├── fieldDetector.ts ← DOM scraping logic
│   │   │   └── highlighter.ts   ← Highlights detected fields
│       │   ├── background/
│       │   │   └── index.ts       ← Service worker
│       │   └── shared/
│       │       └── api.ts         ← API calls from extension
│       ├── public/
│       │   ├── manifest.json
│       │   └── icons/
│       └── vite.config.ts
│
├── packages/
│   ├── types/                     ← Shared TypeScript types (current types/index.ts)
│   │   ├── src/index.ts
│   │   └── package.json
│   └── field-matcher/             ← Shared field matching logic (web + extension)
│       ├── src/
│       │   ├── patterns.ts        ← Regex/heuristic patterns per field type
│       │   ├── scorer.ts          ← Confidence scoring algorithm
│       │   └── index.ts
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Database Schema

### Prisma Schema (`apps/api/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── User & Profile ─────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  supabaseId    String    @unique  // Supabase Auth UUID
  email         String    @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       Profile?
  applications  Application[]
  resumes       Resume[]
  savedAnswers  SavedAnswer[]
  aiSettings    AISettings?
}

model Profile {
  id                 String  @id @default(cuid())
  userId             String  @unique
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  name               String
  phone              String?
  location           String?
  linkedin           String?
  github             String?
  portfolio          String?
  workAuthorization  String  @default("US Citizen")
  yearsExperience    Int     @default(0)
  headline           String? // e.g. "Senior Frontend Engineer"

  updatedAt          DateTime @updatedAt
}

// ─── Applications ────────────────────────────────────────────────────────────

model Application {
  id               String             @id @default(cuid())
  userId           String
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  company          String
  role             String
  url              String
  logoColor        String?            // CSS color for avatar
  status           ApplicationStatus  @default(FILLED)
  resumeId         String?
  resume           Resume?            @relation(fields: [resumeId], references: [id])
  fieldsDetected   Int                @default(0)
  fieldsFilled     Int                @default(0)
  timeSavedSeconds Int                @default(0)
  notes            String?            // user freeform notes

  detectedFields   DetectedField[]

  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([userId, createdAt])
  @@index([status])
}

enum ApplicationStatus {
  FILLED
  SUBMITTED
  REVIEWING
  INTERVIEW
  REJECTED
  OFFER
}

model DetectedField {
  id              String       @id @default(cuid())
  applicationId   String
  application     Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  label           String
  fieldType       FieldType
  value           String       @db.Text
  confidence      Int          // 0–100
  status          FieldStatus  @default(READY)
  isCustomQuestion Boolean     @default(false)
  aiAnswer        String?      @db.Text

  @@index([applicationId])
}

enum FieldType {
  TEXT
  EMAIL
  PHONE
  URL
  TEXTAREA
  FILE
  SELECT
  CHECKBOX
}

enum FieldStatus {
  READY
  NEEDS_REVIEW
  EMPTY
  FILLED
}

// ─── Resumes ─────────────────────────────────────────────────────────────────

model Resume {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String        // display name, e.g. "Frontend Engineer v2"
  filename      String        // original filename
  storageKey    String        // Supabase Storage object key
  storageUrl    String?       // cached signed URL (refreshed on GET)
  isDefault     Boolean       @default(false)
  sizeBytes     Int
  mimeType      String        @default("application/pdf")
  targetRole    String?
  tags          String[]      @default([])
  parsedText    String?       @db.Text  // extracted text from PDF for AI context
  parseStatus   ParseStatus   @default(PENDING)

  applications  Application[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
}

enum ParseStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}

// ─── Saved Answers ───────────────────────────────────────────────────────────

model SavedAnswer {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  question    String   @db.Text
  answer      String   @db.Text
  category    String
  usageCount  Int      @default(0)
  lastUsed    DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, category])
}

// ─── AI Settings ─────────────────────────────────────────────────────────────

model AISettings {
  id                String  @id @default(cuid())
  userId            String  @unique
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  tone              String  @default("professional") // professional | conversational | concise
  answerLength      String  @default("medium")       // short | medium | detailed
  encryptedApiKey   String? // AES-256 encrypted, key stored in env
  usePersonalKey    Boolean @default(false)
  confidenceThreshold Int   @default(70)

  updatedAt         DateTime @updatedAt
}
```

### Key database decisions
- `supabaseId` on User links to Supabase Auth — JWT sub claim is the lookup key
- `storageKey` on Resume is the Supabase Storage path (`{userId}/resumes/{uuid}.pdf`)
- `parsedText` on Resume feeds the AI context window for answer generation
- `encryptedApiKey` on AISettings uses AES-256-GCM with a server-side key — never stored in plaintext
- Row Level Security (RLS) policies in Supabase enforce `user_id = auth.uid()` at DB level
- `@@index([userId, createdAt])` on Application for paginated timeline queries

---

## 4. Authentication System

### Flow

```
User opens web app
       │
       ▼
  Not logged in?
       │
       ▼
  LoginPage.tsx
  ┌─────────────────────────┐
  │ Email + Password sign-in│
  │ OR Google OAuth         │
  │ OR GitHub OAuth         │
  └──────────┬──────────────┘
             │ Supabase Auth.signInWithPassword()
             │         OR Auth.signInWithOAuth()
             ▼
  Supabase returns { access_token (JWT), refresh_token }
             │
             ▼
  Store in memory + secure httpOnly cookie
  (never localStorage — XSS risk)
             │
             ▼
  AuthProvider sets user context
             │
             ▼
  All API requests: Authorization: Bearer <access_token>
             │
             ▼
  API middleware: supabase.auth.getUser(token) → user.id
             │
             ▼
  Prisma query: User.findUnique({ where: { supabaseId: user.id } })
```

### New files for auth

**`apps/web/src/auth/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

// Public (anon) key is safe to expose — RLS enforces access control
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

**`apps/web/src/auth/AuthProvider.tsx`**
```typescript
// Wraps app with Supabase session listener
// Provides: { user, session, loading, signOut }
// Redirects to /login when session expires
```

**`apps/web/src/auth/LoginPage.tsx`**
```
UI: Card centered on page
  - Email + password inputs
  - "Sign in with Google" button
  - "Sign in with GitHub" button
  - "Create account" link
  - Error state display
```

**`apps/api/src/middleware/auth.ts`**
```typescript
// Fastify preHandler hook
// Verifies JWT using supabase.auth.getUser(token)
// Attaches request.userId (prisma User.id) to every request
// Returns 401 if token missing or expired
```

### Extension auth
The Chrome extension stores the JWT in `chrome.storage.local` (encrypted).
On popup open, checks token validity. If expired, shows "Sign in" screen within the popup.

---

## 5. Backend API

### Base URL: `https://api.jobpilot.ai/api/v1`

All routes require `Authorization: Bearer <jwt>` except `/auth/*`.
All request/response bodies are JSON.
All responses follow: `{ data: T, error: null }` or `{ data: null, error: { code, message } }`.

---

### 5.1 Auth Routes (`/auth`)

```
POST   /auth/register          → { user, session }
POST   /auth/login             → { user, session }
POST   /auth/logout            → 204
POST   /auth/refresh           → { session }
GET    /auth/me                → { user }    (verifies token still valid)
POST   /auth/oauth/google      → redirect to Google
POST   /auth/oauth/github      → redirect to GitHub
GET    /auth/oauth/callback    → { session } (after OAuth redirect)
POST   /auth/forgot-password   → 204
POST   /auth/reset-password    → 204
```

---

### 5.2 Profile Routes (`/profile`)

Maps to: `Settings.tsx → ProfileTab`, `Sidebar.tsx` (user name/email)

```
GET    /profile
  Response: UserProfile (all fields from Profile model)

PATCH  /profile
  Body: Partial<UserProfile>
    { name?, phone?, location?, linkedin?, github?,
      portfolio?, workAuthorization?, yearsExperience?, headline? }
  Response: UserProfile

DELETE /profile    → deletes account + all data (GDPR)
  Response: 204
```

---

### 5.3 Application Routes (`/applications`)

Maps to: `ApplicationHistory.tsx`, `Dashboard.tsx` (recent apps, stats)

```
GET    /applications
  Query: ?status=interview&search=stripe&page=1&limit=20&sort=createdAt&order=desc
  Response: { data: Application[], total: number, page: number, pages: number }

GET    /applications/:id
  Response: Application (with detectedFields included)

POST   /applications
  Body: { company, role, url, resumeId?, logoColor? }
  Response: Application (id + timestamps generated)

PATCH  /applications/:id
  Body: Partial<{ status, notes, resumeId }>
  Response: Application

DELETE /applications/:id
  Response: 204
```

---

### 5.4 Field Detection Routes (`/fields`)

Maps to: `ExtensionPopup.tsx → analyzing → fields_detected steps`

```
POST   /fields/detect
  Body: {
    url: string,            // job page URL
    pageHtml: string,       // sanitized HTML from content script
    applicationId?: string  // if re-analyzing an existing application
  }
  Response: {
    fields: DetectedField[],
    company: string,        // extracted from page
    role: string,           // extracted from page
    applicationId: string   // created or updated
  }
  Note: Heavy endpoint — AI answer generation is async (see /fields/answers)
  Timeout: 10s for field detection, returns immediately
  AI answers: triggered as background Inngest job

POST   /fields/answers
  Body: {
    applicationId: string,
    fieldIds: string[],     // custom question field IDs
    resumeId: string        // resume to use as context
  }
  Response: 202 Accepted { jobId: string }
  (polling via GET /fields/answers/:jobId)

GET    /fields/answers/:jobId
  Response: {
    status: 'pending' | 'processing' | 'done' | 'failed',
    fields?: { id: string, aiAnswer: string }[]
  }

PATCH  /fields/:id
  Body: { value?, aiAnswer?, status? }
  Response: DetectedField
  Note: Called when user edits a field value or AI answer in the popup
```

---

### 5.5 Resume Routes (`/resumes`)

Maps to: `ResumeLibrary.tsx`, `ExtensionPopup.tsx → resume selector`

```
GET    /resumes
  Response: Resume[] (storageUrl refreshed as signed URL on each GET)

GET    /resumes/:id
  Response: Resume (with fresh signed URL)

POST   /resumes
  Content-Type: multipart/form-data
  Body: {
    file: File (PDF or DOCX, max 5MB),
    name: string,
    targetRole?: string,
    tags?: string,          // comma-separated
  }
  Response: Resume
  Side effect: Triggers Inngest parseResume job

PATCH  /resumes/:id
  Body: { name?, targetRole?, tags?, isDefault? }
  Note: Setting isDefault: true atomically unsets previous default
  Response: Resume

DELETE /resumes/:id
  Response: 204
  Side effect: Deletes from Supabase Storage

GET    /resumes/:id/download
  Response: Redirect to signed URL (1hr expiry)
```

---

### 5.6 Saved Answer Routes (`/saved-answers`)

Maps to: `SavedAnswers.tsx`

```
GET    /saved-answers
  Query: ?category=Technical&search=challenge&page=1&limit=50
  Response: { data: SavedAnswer[], total: number }

GET    /saved-answers/:id
  Response: SavedAnswer

POST   /saved-answers
  Body: { question: string, answer: string, category: string }
  Response: SavedAnswer

PATCH  /saved-answers/:id
  Body: { question?, answer?, category? }
  Note: Also increments usageCount when called from the extension autofill flow
  Response: SavedAnswer

DELETE /saved-answers/:id
  Response: 204

POST   /saved-answers/suggest
  Body: { question: string, applicationId?: string }
  Response: { answer: string, confidence: number }
  Note: AI-generated answer suggestion, not saved until user confirms
```

---

### 5.7 Stats Routes (`/stats`)

Maps to: `Dashboard.tsx → StatCards`

```
GET    /stats
  Response: DashboardStats {
    totalApplications: number,
    applicationsThisWeek: number,
    timeSavedMinutes: number,
    interviewRate: number,
    avgFieldsPerApp: number,
    successRate: number
  }
  Note: All computed from Application table at query time (no denormalized counters)
  Cache: 5 minute TTL per user (Redis or in-memory)

GET    /stats/activity
  Query: ?limit=10
  Response: ActivityItem[]
  Note: Derived from Applications + Resumes + SavedAnswers ordered by updatedAt
```

---

### 5.8 AI Settings Routes (`/ai-settings`)

Maps to: `Settings.tsx → AISettingsTab`

```
GET    /ai-settings
  Response: AISettings (encryptedApiKey is omitted, replaced by hasPersonalKey: boolean)

PATCH  /ai-settings
  Body: { tone?, answerLength?, apiKey?, confidenceThreshold? }
  Note: apiKey is AES-256 encrypted before storage, never returned raw
  Response: AISettings

DELETE /ai-settings/api-key
  Response: 204 (removes personal key, reverts to shared)
```

---

### Error format

```typescript
// All 4xx/5xx errors:
{
  error: {
    code: string,     // e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
    message: string,  // human-readable
    details?: unknown // Zod errors, etc.
  }
}
```

### Rate limits

| Route group | Limit |
|-------------|-------|
| All authenticated | 1000 req/hr per user |
| `POST /fields/detect` | 30 req/hr per user |
| `POST /fields/answers` | 20 req/hr per user |
| `POST /saved-answers/suggest` | 50 req/hr per user |
| `POST /resumes` (upload) | 10 req/hr per user |
| `/auth/*` | 10 req/min per IP |

---

## 6. AI Engine — Groq LLM

**Why Groq:** Groq's inference hardware (LPU) delivers sub-second response times even for large models, which is critical for the extension popup where users are waiting. The free tier is generous enough for development and early users. Streaming works identically to OpenAI's API.

### Groq model selection

| Use case | Model | Reason |
|----------|-------|--------|
| Custom question answers | `llama-3.3-70b-versatile` | Best quality, fast enough |
| Suggest saved answer | `llama-3.1-8b-instant` | Near-instant, lower cost |
| Field label classification | `llama-3.1-8b-instant` | Simple classification task |
| Resume parsing summary | `llama-3.3-70b-versatile` | Needs full context window |

### Groq SDK setup (`apps/api/src/lib/groq.ts`)

```typescript
import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Streaming answer generation
export async function streamAnswer(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
  });

  let full = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    full += text;
    onChunk(text);
  }
  return full;
}

// Non-streaming fast answer (for suggestions)
export async function quickAnswer(prompt: string): Promise<string> {
  const resp = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 300,
  });
  return resp.choices[0].message.content ?? '';
}
```

### 6.1 Field Detection (`services/fieldDetector.ts`)

The content script sends raw page HTML. Server-side processing:

```
Input: { pageHtml, url, userProfile }
       │
       ▼
1. HTML sanitization (DOMPurify server-side)
2. Extract form elements → { label, name, id, placeholder, type, selector }
3. For each form element:
   a. Normalize label text (lowercase, trim)
   b. Run against patterns (packages/field-matcher/patterns.ts):
      - name:     /full.?name|first.?name|last.?name/i
      - email:    /email/i
      - phone:    /phone|mobile|cell/i
      - location: /location|city|address|where/i
      - linkedin: /linkedin/i
      - github:   /github/i
      - portfolio:/portfolio|website|personal.?site/i
      - resume:   /resume|cv|upload/i
      - workauth: /authorized|sponsorship|visa|work.?auth/i
      - salary:   /salary|compensation|pay/i
   c. Score confidence (packages/field-matcher/scorer.ts):
      - Exact pattern match: 95-99%
      - Partial match: 70-89%
      - Context clues (aria-label, placeholder): +5-10%
      - No match: 0% → type = custom question
4. Map matched field → user profile value
5. Custom questions (score=0) → queue for AI answer generation
Output: DetectedField[]
```

**Confidence scoring algorithm** (`packages/field-matcher/scorer.ts`):
```typescript
function scoreField(element: FormElement, pattern: FieldPattern): number {
  let score = 0;
  // Check label text
  if (pattern.regex.test(element.labelText)) score += 60;
  // Check name attribute
  if (pattern.regex.test(element.name)) score += 20;
  // Check placeholder
  if (pattern.regex.test(element.placeholder)) score += 10;
  // Check aria-label
  if (pattern.regex.test(element.ariaLabel)) score += 10;
  // Penalize ambiguous matches
  if (multiplePatternMatch(element)) score -= 15;
  return Math.min(100, score);
}
```

### 6.2 AI Answer Generation (`services/ai.ts`)

Called via Inngest background job after field detection. Uses Groq streaming so the answer types into the popup in real time.

```typescript
// services/ai.ts
import { groq, streamAnswer } from '../lib/groq';

export async function generateFieldAnswer({
  question,
  companyName,
  role,
  profile,
  resume,
  savedAnswers,
  aiSettings,
  onChunk,          // SSE stream to popup
}: GenerateAnswerInput): Promise<string> {

  const systemPrompt = `
You are a professional job application assistant helping a candidate
fill out a job application form.

Candidate profile:
- Name: ${profile.name}
- Target role: ${profile.headline ?? role}
- Years of experience: ${profile.yearsExperience}
- Location: ${profile.location}
- Work authorization: ${profile.workAuthorization}

Resume (use this as the source of truth for skills and experience):
${resume.parsedText.slice(0, 3000)}   ← trimmed to stay within context

Past answers this candidate has written (match their writing style):
${savedAnswers.slice(0, 3).map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Tone: ${aiSettings.tone}   (professional | conversational | concise)
Length: ${aiSettings.answerLength === 'short' ? 'under 100 words' :
         aiSettings.answerLength === 'medium' ? '150–250 words' :
         '300–500 words with specific examples'}

Rules:
- Only use facts present in the resume and profile above
- Never invent job titles, companies, or accomplishments
- Never mention AI, automation, or that this was generated
- Write entirely in first person
- End cleanly — no trailing phrases like "I hope this answers your question"
`.trim();

  const userPrompt =
    `Answer this job application question for the ${role} role at ${companyName}:\n\n"${question}"`;

  return streamAnswer(systemPrompt, userPrompt, onChunk);
}
```

**SSE delivery to popup:**
The API route `POST /fields/answers` opens an SSE stream. The extension popup listens and appends each chunk to the textarea in real time — identical to how ChatGPT streams responses.

**Streaming:** Groq streaming → SSE → extension popup for real-time typing effect (avg ~150 tokens/sec on Groq LPU).

### 6.3 Resume Parsing (`services/resumeParser.ts`)

After upload, an Inngest job extracts text:
```
PDF → pdf-parse library → raw text
DOCX → mammoth library → raw text
Text stored in Resume.parsedText (Postgres TEXT column)
Status updated: PENDING → PROCESSING → DONE | FAILED
```

---

## 7. User Onboarding Flow

This is critical — if the user doesn't fill their profile and upload a resume, the extension fills nothing useful. Onboarding must be frictionless and guide them to "ready to autofill" in under 3 minutes.

### 7.1 Onboarding trigger

```
New user signs up
       │
       ▼
Redirect to /onboarding (not /dashboard)
Blocked until onboarding is marked complete (profile.onboardingDone = true)
```

### 7.2 Onboarding steps (4-step wizard)

```
Step 1: Profile Basics (2 min)
Step 2: Upload Resume (1 min)
Step 3: Starter Answers (1 min)
Step 4: Install Extension (30 sec)
```

### 7.3 New file: `src/pages/Onboarding.tsx`

**Step 1 — Profile Basics**

Large, friendly form. Only the 8 fields the extension uses most:

```
┌─────────────────────────────────────────────────────┐
│  👋 Let's set up your JobPilot profile              │
│  This takes about 2 minutes.                        │
│                                                     │
│  Full Name          [Alex Rivera              ]     │
│  Email              [alex@email.com           ]     │
│  Phone              [+1 (555) 234-7890        ]     │
│  Location           [San Francisco, CA        ]     │
│  LinkedIn URL       [linkedin.com/in/...      ]     │
│  GitHub URL         [github.com/...           ]     │
│  Portfolio URL      [alexrivera.dev           ]     │
│  Work Authorization [US Citizen ▾             ]     │
│                                                     │
│                    [Continue →]                     │
└─────────────────────────────────────────────────────┘
```

- All fields inline-validated on blur
- Autofill from browser (standard form autocomplete works)
- "Import from LinkedIn" button (Phase 2 feature, show greyed out)

**Step 2 — Upload Resume**

```
┌─────────────────────────────────────────────────────┐
│  📄 Upload your resume                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Drag & drop your resume here               │   │
│  │  PDF or DOCX · Max 5MB                      │   │
│  │  [Browse files]                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ We'll read it to generate better AI answers      │
│  ✓ Stays private — only you can access it          │
│                                                     │
│  After upload:                                      │
│  ├─ Filename: Frontend_v2.pdf (187 KB)             │
│  ├─ Status: ✓ Parsed successfully                  │
│  └─ [Set as default] ✓ (auto-set for first resume) │
│                                                     │
│  [← Back]                   [Continue →]            │
└─────────────────────────────────────────────────────┘
```

- Upload triggers `POST /resumes`
- Shows real-time parse status (polling `GET /resumes/:id` every 2s)
- Continue is disabled until parseStatus = DONE
- User can skip (resume upload is optional but shown as strongly recommended)

**Step 3 — Starter Answers**

Pre-seed the 3 most-used saved answers using AI. User reviews and tweaks before saving.

```
┌─────────────────────────────────────────────────────┐
│  ✍️ Let's draft your starter answers                │
│  AI generates from your resume. Edit freely.        │
│                                                     │
│  ① Tell us about yourself.                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ I'm a senior frontend engineer with 5 years  │   │
│  │ of experience building React applications…   │   │
│  │ [editable textarea]                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ② Why do you want to work here?                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ I'm drawn to companies that prioritize…     │   │
│  │ [editable textarea]                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ③ What is your expected salary range?             │
│  ┌─────────────────────────────────────────────┐   │
│  │ Based on my experience and market data…     │   │
│  │ [editable textarea]                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Powered by Groq · Edits are saved automatically   │
│                                                     │
│  [← Back]           [Save & Continue →]             │
└─────────────────────────────────────────────────────┘
```

- On mount: calls `POST /saved-answers/suggest` for each question (Groq generates, streams in)
- Typing in any textarea auto-saves via debounced `PATCH /saved-answers/:id`
- "Save & Continue" calls `POST /saved-answers` for all three in parallel

**Step 4 — Install Extension**

```
┌─────────────────────────────────────────────────────┐
│  🧩 Install the Chrome Extension                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  [Add to Chrome]  ← opens Chrome Web Store   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  After installing:                                  │
│  1. Click the puzzle piece icon in Chrome toolbar   │
│  2. Pin "JobPilot AI"                               │
│  3. Open any job application page                   │
│  4. Click the JobPilot icon to start                │
│                                                     │
│  Already installed?   [Skip → Go to Dashboard]      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Works on Greenhouse · Lever · Workday       │  │
│  │  Ashby · iCIMS · Rippling · and more        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- "Add to Chrome" button links directly to Chrome Web Store listing
- "Skip" button marks `profile.onboardingDone = true` via `PATCH /profile` and redirects to dashboard
- Extension auto-detects when installed (via `chrome.runtime.sendMessage` from the page) and shows green checkmark

### 7.4 Onboarding completion

```typescript
// PATCH /profile
{ onboardingDone: true }

// This also triggers:
// 1. Welcome email via Supabase Edge Function
// 2. First-use analytics event
```

After completing step 4 (or skipping), user lands on Dashboard. A persistent banner shows until they make their first real application:

```
┌──────────────────────────────────────────────────────────────────┐
│  🎯 You're all set! Open a job application page and click the    │
│  JobPilot icon to autofill your first application.  [Dismiss]   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.5 Re-entry: Profile completeness nudge

On the Dashboard, show a profile completeness card if any key fields are missing:

```
Profile completeness: ████████░░ 80%
Missing: Portfolio URL · Work Authorization
[Complete profile →]
```

---

## 8. Chrome Extension (Manifest V3)

### `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "JobPilot AI",
  "version": "1.0.0",
  "description": "Fill job applications faster with AI-powered autofill",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/16.png", "48": "icons/48.png" }
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [],
  "icons": {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  }
}
```

### Communication flow

```
Popup (React)
    │
    │ chrome.tabs.sendMessage({ action: 'ANALYZE_PAGE' })
    ▼
Content Script (injected on demand via scripting.executeScript)
    │
    │ Scrapes DOM → returns { fields, pageHtml, company, role }
    ▼
Popup receives response
    │
    │ POST /api/v1/fields/detect  (with JWT from chrome.storage.local)
    ▼
API returns DetectedField[]
    │
    │ chrome.tabs.sendMessage({ action: 'FILL_FIELDS', fields })
    ▼
Content Script fills each field
    │ document.querySelector(field.selector).value = field.value
    │ Dispatches 'input' and 'change' events for React/Vue form libraries
    ▼
Returns fill result to Popup
    │
    ▼
Popup shows 'review_required' state
```

### Content script field filling (`content/index.ts`)

```typescript
// Handles the FILL_FIELDS message
async function fillFields(fields: DetectedField[]) {
  for (const field of fields) {
    const el = document.querySelector<HTMLElement>(field.cssSelector);
    if (!el) continue;

    if (field.type === 'file') {
      // Resume upload: use File API to create a synthetic File object
      // and set it via DataTransfer (only works in some ATS systems)
      await handleFileField(el as HTMLInputElement, field);
    } else if (field.type === 'select') {
      await handleSelectField(el as HTMLSelectElement, field);
    } else if (field.type === 'checkbox') {
      await handleCheckboxField(el as HTMLInputElement, field);
    } else {
      await handleTextInput(el as HTMLInputElement, field.value);
    }

    // Notify popup after each field (for progress animation)
    chrome.runtime.sendMessage({ action: 'FIELD_FILLED', fieldId: field.id });
    await sleep(120); // small delay for React/Angular form state
  }
}

// Dispatch React synthetic events after setting value
function dispatchReactChange(el: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )!.set!;
  nativeInputValueSetter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
```

### ATS compatibility targets (v1)

| ATS | Method |
|-----|--------|
| Greenhouse | Standard inputs, native events |
| Lever | Standard inputs, native events |
| Workday | Shadow DOM + React events |
| iCIMS | Legacy inputs |
| Ashby | Standard inputs |
| Rippling | Standard inputs |
| BambooHR | Standard inputs |
| Jobvite | iframe detection required (v2) |

---

## 9. File Storage (Resumes)

### Supabase Storage bucket setup

```
Bucket: resumes
  ├── Public: false (private, signed URLs only)
  ├── File size limit: 5MB
  ├── Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  └── RLS policy: users can only access their own objects

Path pattern: {userId}/resumes/{uuid}.{ext}
```

### Upload flow

```
Client: POST /api/v1/resumes (multipart form)
              │
              ▼
API: Validate file (size, MIME type)
              │
              ▼
API: Upload to Supabase Storage at {userId}/resumes/{cuid()}.pdf
              │
              ▼
API: Create Resume row in Postgres
    { storageKey, filename, name, sizeBytes, userId }
              │
              ▼
API: Trigger Inngest parseResume job
              │
              ▼
Return Resume to client (storageUrl is empty until parse done)

Background (Inngest):
  1. Download PDF from storage
  2. Extract text with pdf-parse
  3. Update Resume.parsedText + parseStatus = DONE
```

### Signed URL refresh

On every `GET /resumes`, server generates fresh signed URLs (1hr expiry) for each resume. Client never stores the signed URL long-term.

---

## 10. Frontend Integration — File-by-File Changes

Every file in `apps/web/src` and what needs to change.

---

### 9.1 NEW: `src/api/client.ts`

```typescript
// Base API client — all hooks use this
import axios from 'axios';
import { supabase } from '../auth/supabase';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
client.interceptors.request.use(async config => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Refresh token on 401
client.interceptors.response.use(undefined, async error => {
  if (error.response?.status === 401) {
    await supabase.auth.refreshSession();
    return client.request(error.config);
  }
  return Promise.reject(error);
});

export default client;
```

---

### 9.2 NEW: `src/hooks/useProfile.ts`

```typescript
// Replaces: import { mockProfile } from '../data/mockData'
// Used in: Sidebar.tsx, Settings.tsx (ProfileTab)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import type { UserProfile } from '../types';

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => client.get('/profile').then(r => r.data.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      client.patch('/profile', data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
```

---

### 9.3 NEW: `src/hooks/useApplications.ts`

```typescript
// Replaces: import { mockApplications } from '../data/mockData'
// Used in: ApplicationHistory.tsx, Dashboard.tsx

export function useApplications(filters?: { status?: string; search?: string; page?: number }) {}
export function useUpdateApplication() {}  // for status changes
```

---

### 9.4 NEW: `src/hooks/useResumes.ts`

```typescript
// Replaces: import { mockResumes } from '../data/mockData'
// Used in: ResumeLibrary.tsx, ExtensionPopup.tsx

export function useResumes() {}
export function useUploadResume() {}    // multipart POST
export function useSetDefaultResume() {} // PATCH isDefault
export function useDeleteResume() {}
```

---

### 9.5 NEW: `src/hooks/useSavedAnswers.ts`

```typescript
// Replaces: import { mockSavedAnswers } from '../data/mockData'
// Used in: SavedAnswers.tsx

export function useSavedAnswers(filters?: { category?: string; search?: string }) {}
export function useCreateSavedAnswer() {}
export function useUpdateSavedAnswer() {}
export function useDeleteSavedAnswer() {}
```

---

### 9.6 NEW: `src/hooks/useStats.ts`

```typescript
// Replaces: import { mockStats, mockActivity } from '../data/mockData'
// Used in: Dashboard.tsx

export function useDashboardStats() {}
export function useActivityFeed(limit = 10) {}
```

---

### 9.7 `App.tsx` — changes

Add:
- `<QueryClientProvider>` wrapper
- `<AuthProvider>` wrapper
- Protected route wrapper (redirect to `/login` if no session)
- Add `/login` and `/register` routes

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});
```

---

### 9.8 `components/layout/Sidebar.tsx` — changes

- Replace `mockProfile` import with `const { data: profile } = useProfile()`
- Show skeleton loader while `profile` is loading
- Add sign-out button to user card (calls `supabase.auth.signOut()`)

---

### 9.9 `pages/Dashboard.tsx` — changes

- Replace `mockStats` → `const { data: stats } = useDashboardStats()`
- Replace `mockActivity` → `const { data: activity } = useActivityFeed()`
- Replace `mockApplications` → `const { data } = useApplications({ limit: 5 })`
- Add loading skeleton for each stats card
- Add error boundary display

---

### 9.10 `pages/ApplicationHistory.tsx` — changes

- Replace `mockApplications` → `useApplications({ status: filter, search, page })`
- Add server-side pagination (replace client-side filter)
- Inline status update: clicking a status badge opens a dropdown to change it (calls `useUpdateApplication`)
- Add "Add notes" modal per application

---

### 9.11 `pages/ResumeLibrary.tsx` — changes

- Replace `mockResumes` → `useResumes()`
- Wire Upload button to `useUploadResume()` mutation
- Wire Set Default to `useSetDefaultResume()` mutation
- Wire Remove to `useDeleteResume()` mutation
- Add upload progress bar (axios `onUploadProgress`)
- Show parsing status badge (PENDING | PROCESSING | DONE) on each card
- Wire file drag-drop to `useUploadResume()`

---

### 9.12 `pages/SavedAnswers.tsx` — changes

- Replace `mockSavedAnswers` → `useSavedAnswers({ category, search })`
- Wire Add Answer to `useCreateSavedAnswer()`
- Wire edit save to `useUpdateSavedAnswer()`
- Wire delete to `useDeleteSavedAnswer()`
- Add "Suggest with AI" button per card → calls `POST /saved-answers/suggest`

---

### 9.13 `pages/Settings.tsx` — changes

**ProfileTab:**
- Replace `mockProfile` → `useProfile()` + `useUpdateProfile()`
- Add optimistic update on save

**AISettingsTab:**
- Load from `GET /ai-settings`
- Save via `PATCH /ai-settings`
- API key field: show "Key saved" if `hasPersonalKey: true`, never show the key value
- Add "Test API key" button → calls a `/ai-settings/test-key` endpoint

**NotificationsTab / PrivacyTab / ExtensionTab:**
- Persist toggle states to `PATCH /ai-settings` or a dedicated `/preferences` endpoint

---

### 9.14 `components/extension/ExtensionPopup.tsx` — changes

The popup needs to work both in the web demo AND in the real Chrome extension. Use an environment flag:

```typescript
const IS_EXTENSION = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
```

Changes per step:
- **Analyze Page**: If `IS_EXTENSION`, `chrome.tabs.sendMessage({ action: 'ANALYZE_PAGE' })`, then `POST /fields/detect` with the result. If web demo, keep current mock flow.
- **Resume selector**: Load from `useResumes()` hook instead of `mockResumes`
- **AI answers**: Poll `GET /fields/answers/:jobId` until status is `done`, stream result into textareas
- **Autofill**: Send `chrome.tabs.sendMessage({ action: 'FILL_FIELDS', fields })`, receive per-field progress
- **Review required**: Save the completed `Application` record via `POST /applications`

---

### 9.15 NEW: `src/components/ui/Skeleton.tsx`

```tsx
// Loading placeholder for all data-driven components
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-slate-200 animate-pulse rounded-lg', className)} />
  );
}
```

Used everywhere `useQuery` is loading.

---

### 9.16 NEW: `src/components/ui/ErrorState.tsx`

```tsx
// Shown when a query errors out
// Props: message, onRetry
```

---

### 9.17 NEW: `src/components/ui/Toast.tsx` (or use `sonner` library)

```
npm install sonner
```

Used for:
- "Profile saved" confirmation
- "Resume uploaded"
- "Answer copied"
- API errors

---

## 11. Security

### Critical items

| Area | Requirement | Implementation |
|------|-------------|----------------|
| Auth tokens | Never in localStorage | Supabase httpOnly cookie session |
| API keys | Never stored in plaintext | AES-256-GCM encryption, server-side key |
| Resume files | Private, no public URLs | Supabase Storage private bucket + signed URLs |
| Uploaded HTML | Sanitized before processing | DOMPurify server-side + CSP |
| SQL injection | Prisma parameterized queries | Prisma by default, no raw queries |
| XSS in answers | Sanitize before rendering | No dangerouslySetInnerHTML, React escapes by default |
| CORS | Allowlist only | `cors({ origin: ['https://app.jobpilot.ai'] })` |
| Rate limiting | Per-user limits | `@fastify/rate-limit` + Redis |
| File uploads | Type + size validation | MIME check + 5MB limit before storage |
| Row-level access | Users see only their data | Supabase RLS + Prisma `where: { userId }` |
| Extension permissions | Minimal scope | `activeTab` only (not `tabs`) |
| Content script injection | On-demand only | `scripting.executeScript` on user click |
| HTTPS only | All traffic | HSTS headers, no HTTP fallback |

### Extension-specific security

- Extension only activates on HTTPS pages (enforced in `manifest.json` `host_permissions`)
- Content script does NOT have access to the extension's API credentials
- All API calls go through the popup (content script only fills DOM, never calls API)
- `chrome.storage.local` data is encrypted with user's password-derived key (PBKDF2)

---

## 12. Deployment & Infrastructure

### Web app (`apps/web`) → Vercel

```
vercel.json / vercel.ts:
  - Framework: Vite
  - Build command: pnpm build
  - Output: dist/
  - Env vars: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### API (`apps/api`) → Render.com

```
render.yaml:
  - Runtime: Node 24
  - Start command: node dist/server.js
  - Health check: GET /health
  - Auto-deploy on main branch
  - Region: US-East (match Supabase region)
  - Plan: Starter ($7/mo) for always-on (no cold starts)
```

### Database + Storage → Supabase

```
- Project region: US-East-1
- PostgreSQL 15
- Storage: resumes bucket
- Auth: email + Google + GitHub providers enabled
- RLS enabled on all tables
```

### Background jobs → Inngest Cloud

```
- Dev: inngest dev server (local)
- Prod: connect API server to Inngest Cloud
- Functions: generateAnswers, parseResume
- Retry: 3 attempts, exponential backoff
```

### Extension → Chrome Web Store

```
- Build: pnpm build (outputs to dist/ as zip)
- Review time: 3-7 business days for new extension
- Updates: automated zip upload via CWS API in CI
```

---

## 13. Environment Variables

### `apps/web/.env.local`
```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### `apps/api/.env`
```bash
# Database
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never exposed to client

# AI (Groq)
GROQ_API_KEY=gsk_...
GROQ_MODEL_PRIMARY=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant

# Encryption (for user API keys at rest)
ENCRYPTION_KEY=<32-byte random hex>  # openssl rand -hex 32

# Storage
SUPABASE_STORAGE_BUCKET=resumes

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,https://app.jobpilot.ai

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### `apps/extension/.env`
```bash
VITE_API_URL=https://api.jobpilot.ai
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 14. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    - pnpm install
    - pnpm run typecheck  # tsc --noEmit across all packages

  lint:
    - pnpm run lint       # ESLint + Prettier check

  test:
    - pnpm run test       # Vitest (unit) + Playwright (e2e)

  build:
    - pnpm run build      # All apps build without errors

  deploy-api:             # Only on main, after tests pass
    - render deploy --service-id ${{ secrets.RENDER_SERVICE_ID }}

  deploy-web:             # Only on main
    - vercel --prod

  deploy-extension:       # Only on version tag push (v*)
    - Build extension zip
    - Upload to Chrome Web Store via API
```

---

## 15. Phase Roadmap

### Phase 1 — Backend foundation + Auth (Weeks 1-2)
- [ ] Set up monorepo (pnpm workspaces + Turborepo)
- [ ] Create Supabase project (DB + Auth + Storage)
- [ ] Run Prisma migrations (all tables from §3, including `onboardingDone` field on Profile)
- [ ] Build Fastify server with all routes (returning hardcoded data first)
- [ ] Add auth middleware (JWT verification via Supabase)
- [ ] Wire Supabase Storage for resume uploads
- [ ] Add Zod validation on all request bodies
- [ ] Deploy API to Render
- [ ] Build `LoginPage.tsx` and `AuthProvider.tsx`
- [ ] Add protected routes (redirect to `/login` if no session, redirect to `/onboarding` if `onboardingDone = false`)

### Phase 2 — Onboarding + Frontend wiring (Weeks 3-4)
- [ ] Build `src/pages/Onboarding.tsx` (4-step wizard from §7)
  - [ ] Step 1: Profile form (8 fields, inline validation)
  - [ ] Step 2: Resume upload with parse status polling
  - [ ] Step 3: Starter answers with Groq-generated drafts
  - [ ] Step 4: Extension install CTA
- [ ] Install `@tanstack/react-query` in web app
- [ ] Build `src/api/client.ts` with auth interceptor
- [ ] Build all hooks (`useProfile`, `useApplications`, `useResumes`, `useSavedAnswers`, `useStats`)
- [ ] Replace mock data imports page by page (§10 changes)
- [ ] Add skeleton loading states and `<Skeleton>` component
- [ ] Add `<ErrorState>` component and toast notifications (`sonner`)
- [ ] Add profile completeness nudge card on Dashboard

### Phase 3 — AI integration with Groq (Weeks 5-6)
- [ ] Install Groq SDK: `npm install groq-sdk`
- [ ] Build `apps/api/src/lib/groq.ts` (`streamAnswer`, `quickAnswer`)
- [ ] Set up Inngest (local dev + Cloud)
- [ ] Build `services/resumeParser.ts` (pdf-parse + mammoth)
- [ ] Build `services/fieldDetector.ts` (DOM pattern matching, packages/field-matcher)
- [ ] Build `services/ai.ts` (Groq streaming, prompt structure from §6.2)
- [ ] Wire `POST /fields/detect` with real DOM analysis
- [ ] Wire `POST /fields/answers` as SSE stream (Groq → SSE → popup)
- [ ] Wire `POST /saved-answers/suggest` (Groq fast model)
- [ ] Wire onboarding Step 3 AI generation (Groq streams into textareas)
- [ ] Test answer quality across 10 real job postings (Greenhouse, Lever, Ashby)
- [ ] Tune prompts for each tone setting (professional / conversational / concise)

### Phase 4 — Chrome Extension (Weeks 7-8)
- [ ] Set up extension build (Vite + CRXJS plugin)
- [ ] Migrate `ExtensionPopup.tsx` to extension popup (IS_EXTENSION flag)
- [ ] Build content script field detector (uses `packages/field-matcher`)
- [ ] Build autofill content script with React/Vue/Angular event dispatch
- [ ] Test on Greenhouse, Lever, Workday, Ashby, iCIMS
- [ ] Add extension auth flow (sign in from popup, store JWT in `chrome.storage.local`)
- [ ] Wire SSE answer streaming into popup textareas
- [ ] Submit to Chrome Web Store

### Phase 5 — Polish & production hardening (Weeks 9-10)
- [ ] Add rate limiting (Redis via Upstash, limits from §5 table)
- [ ] Add request logging (Pino + structured logs)
- [ ] Set up error monitoring (Sentry on web + api + extension)
- [ ] Add analytics (Posthog — track: onboarding completion, fields filled, answer edits)
- [ ] Lighthouse audit on web app (target ≥90 all categories)
- [ ] Security audit (OWASP checklist from §11)
- [ ] Load test API (k6, target 100 rps sustained)
- [ ] Write user docs (extension install, first use walkthrough)

---

## Quick start (after this plan)

```bash
# 1. Restructure as monorepo
mkdir jobpilot && cd jobpilot
mv jobpilot-ai apps/web
mkdir apps/api apps/extension packages/types packages/field-matcher

# 2. Bootstrap API
cd apps/api
npm init fastify-app .

# 3. Init Prisma
npx prisma init
# paste schema from §3 into prisma/schema.prisma
npx prisma db push

# 4. Start everything
pnpm dev  # (turborepo runs all dev servers in parallel)
```

---

*Last updated: 2026-05-26 | Author: Production plan for JobPilot AI*
