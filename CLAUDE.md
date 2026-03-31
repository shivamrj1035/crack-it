# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Mock Interview platform with multi-tenant organization support. Features include AI-powered interview generation, voice-based interaction, camera integration with face detection, proctoring/anti-cheating measures, candidate pipeline management, and role-based access control.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Backend**: Convex (database + server functions + real-time subscriptions)
- **Auth**: Clerk (with role-based access control)
- **Security**: Arcjet (rate limiting, bot detection)
- **File Uploads**: ImageKit (resume storage)
- **AI Integration**: Groq API (Llama 3.1 8B) with BYOK (Bring Your Own Key) support
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Speech**: Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Face Detection**: MediaPipe Face Detection
- **Animation**: Framer Motion (motion/react)

## Common Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Build & Deploy
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Environment Setup

Required environment variables:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Arcjet
ARCJET_KEY=

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Groq AI (Free tier: 100k tokens/day, 20 requests/min)
GROQ_API_KEY=

# Gemini (for resume text extraction)
GEMINI_API_KEY=
```

## Architecture

### Multi-Tenant Organization Model

The app supports multiple organizations with role-based access:

- **User Roles**: `super_admin`, `org_admin`, `hr_manager`, `interviewer`, `candidate`
- **Organizations**: Companies with configurable proctoring settings, subscription tiers
- **Candidates**: Belong to organizations with pipeline status tracking
- **Interviewer Types**: Organization-specific AI interviewer configurations per role (frontend, backend, devops, etc.)

### Route Groups

- `(auth)/` - Authentication routes (sign-in, sign-up)
- `(routes)/` - Protected application routes
  - `dashboard/` - User dashboard with interview list
  - `interview/[interviewId]/` - Interview pages
  - `admin/` - Organization admin features (interviewers, candidates, settings)

### Convex Schema Overview

Core tables (see `convex/schema.ts` for full definition):

- `organizations` - Company/workspace data with proctoring settings
- `users` - User profiles linked to Clerk, with roles
- `interviewerTypes` - Configurable AI interviewer personas per organization
- `candidates` - Candidate profiles with resume, status, pipeline position
- `interviews` - Interview sessions with questions, answers, feedback
- `proctoringLogs` - Audit trail of proctoring events
- `benchPool` - Candidates on hold for future roles
- `aiProviderKeys` - BYOK encrypted API keys per organization
- `atsIntegrations` - Third-party ATS connections

Legacy tables (for migration):
- `userTable` - Pre-organization user data
- `interviewSessionTable` - Pre-organization interview data

### Key Patterns

**Convex Queries/Mutations:**
- Import from `@/convex/_generated/api`
- Use `useQuery()` for real-time subscriptions
- Use `useMutation()` for data mutations
- Server functions in `convex/` directory (e.g., `convex/interviews.ts`)

**Auth Protection:**
- Middleware (`middleware.ts`) protects all routes except `/`, `/sign-in`, `/sign-up`
- Clerk provides `auth()` and `currentUser()` for server-side auth
- Client-side uses `useUser()` hook from `@clerk/nextjs`

**Role-Based Access:**
- Check `user.role` field for permissions
- Admin routes check for `org_admin`, `hr_manager`, or `super_admin`
- Organization isolation via `organizationId` field on all entities

**State Persistence:**
- Interview progress saved to `localStorage` with key `interviewState-${interviewId}`
- Used for recovery if page refreshes during interview

**Client Components:**
- Most interactive pages use `"use client"` due to hooks and browser APIs
- Speech recognition, camera, and proctoring require client-side execution

### API Routes

- `POST /api/interview/generate-questions`: Generates AI interview questions via Groq
- `POST /api/interview/evaluate`: Evaluates candidate answers
- `POST /api/interview-feedback`: Generates interview feedback from conversation
- `POST /api/proctoring/log`: Logs proctoring events (tab switch, fullscreen exit, etc.)
- `GET /api/arcjet`: Arcjet test endpoint with rate limiting

### Proctoring System

Anti-cheating measures implemented via `useProctoring` hook:

- **Tab Switch Detection**: Monitors `document.visibilitychange`, triggers violation after threshold
- **Copy/Paste Blocking**: Prevents clipboard operations during interview
- **Right-Click Blocking**: Disables context menu
- **Fullscreen Enforcement**: Requires fullscreen mode, exits trigger violations
- **Inactivity Detection**: Tracks user activity, logs timeouts
- **Face Detection**: Uses MediaPipe to detect multiple faces or no face
- **Screenshot Capture**: Periodic screen captures (configurable)

Events logged to `proctoringLogs` table with severity levels (low, medium, high, critical).

### AI Interviewers

Specialized interviewers defined in `lib/ai-interviewer.ts`:

- `frontend-developer` - React, Vue, Angular, TypeScript focus
- `backend-developer` - Node.js, Python, Java, databases, APIs
- `fullstack-developer` - Both frontend and backend
- `devops-engineer` - AWS, Docker, Kubernetes, CI/CD
- `data-scientist` - Python, ML, statistics
- `mobile-developer` - iOS, Android, React Native, Flutter

Each has:
- System prompt for AI behavior
- Skills list for question generation
- Evaluation criteria
- Difficulty levels (junior, mid, senior, principal)

### Component Conventions

- UI components in `/components/ui` follow shadcn/ui patterns
- Path alias `@/*` maps to root directory
- Tailwind v4 uses `@tailwindcss/postcss` with `tw-animate-css`
- Animation components use `motion/react` (Framer Motion)

### Interview Flow

1. **Creation**: User selects interviewer type → enters job details/resume → questions generated via AI → saved to Convex
2. **Session**: Questions fetched from Convex → voice interaction via Web Speech API → answers stored locally → proctoring active
3. **Completion**: Answers evaluated by AI → feedback generated → results saved to Convex
4. **Pipeline**: Candidate status tracked (new → screening → interviewing → bench/hired/rejected)
