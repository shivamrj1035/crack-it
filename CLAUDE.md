# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Mock Interview platform where users upload resumes or provide job details to generate AI-powered interview questions. Features voice-based interaction, camera integration, and AI-generated feedback.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Backend**: Convex (database + server functions)
- **Auth**: Clerk
- **Security**: Arcjet (rate limiting, bot detection)
- **File Uploads**: ImageKit
- **AI Integration**: Groq API (free tier) with Llama 3.1 8B open source model
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Speech**: Web Speech API (SpeechRecognition, SpeechSynthesis)

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

The following environment variables must be configured:

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
```

## Architecture

### Route Groups

- `(auth)/` - Authentication routes (sign-in, sign-up) using Clerk components
- `(routes)/` - Protected application routes with `AppHeader` and `Toaster`

### Data Flow

1. **Interview Creation**: User uploads resume or enters job details → `POST /api/generate-interview-questions` → Gemini API → returns questions → saved to Convex
2. **Interview Session**: Questions fetched from Convex → voice interaction via Web Speech API → answers stored locally → feedback generated via `POST /api/interview-feedback`
3. **Rate Limiting**: Arcjet token bucket (5 tokens per 24h) on interview generation

### Convex Schema

- `userTable`: User profiles from Clerk
- `interviewSessionTable`: Interview data including questions, answers, feedback, status

### Key Patterns

- **Convex Queries/Mutations**: Import from `@/convex/_generated/api`, use `useConvex()` hook for queries, `useMutation()` for mutations
- **Auth Protection**: Middleware (`middleware.ts`) protects all routes except `/`, `/sign-in`, `/sign-up`
- **State Persistence**: Interview progress saved to localStorage with key `interviewState-${interviewId}`
- **Client Components**: Most interactive pages use `"use client"` due to hooks and browser APIs

### API Routes

- `POST /api/generate-interview-questions`: Uploads resume to ImageKit, extracts text via Gemini, generates questions via Gemini API
- `POST /api/interview-feedback`: Sends conversation to Gemini API, returns AI feedback
- `GET /api/arcjet`: Arcjet test endpoint with bot detection and rate limiting

### Component Conventions

- UI components in `/components/ui` follow shadcn/ui patterns with `class-variance-authority`
- Path alias `@/*` maps to root directory
- Tailwind v4 configuration uses `@tailwindcss/postcss` with `tw-animate-css`
