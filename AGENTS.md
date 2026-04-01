# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 App Router application. Route files live under `app/`, with authenticated pages in `app/(auth)` and product routes in `app/(routes)`. API handlers are in `app/api`. Shared UI is split between `components/ui` (base primitives) and feature folders such as `components/interviewers` and `components/proctoring`. Reusable logic lives in `lib/`, `hooks/`, `context/`, and `utils/`. Backend data models and functions are in `convex/`; treat `convex/_generated/` as generated output and regenerate it instead of editing it manually. Static assets live in `public/`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server on `http://localhost:3333`.
- `npm run build`: create a production build and catch type or route issues.
- `npm run start`: run the production build locally.
- `npm run lint`: run Next.js linting checks before opening a PR.
- `npx convex dev`: refresh Convex generated types after schema or function changes.

## Coding Style & Naming Conventions
Use TypeScript with `strict` mode and the `@/*` path alias from `tsconfig.json`. Follow the existing style: functional React components, PascalCase for components (`InterviewCard.tsx`), camelCase for hooks/utilities (`useProctoring.ts`, `lib/groq.ts`), and kebab-free route segment names. Prefer double quotes and keep Tailwind utility composition centralized with `cn()` from `lib/utils.ts`. Keep feature-specific UI near its route and place reusable primitives in `components/ui`.

## Testing Guidelines
There is no dedicated automated test suite configured yet. For every change, run `npm run lint` and `npm run build` as the minimum verification gate. When updating interview flows, auth, or Convex mutations, manually test the affected path in the browser. If you add automated tests, keep them next to the feature or in a local `__tests__` folder and document the command in `package.json`.

## Commit & Pull Request Guidelines
Recent commits are short and imperative, for example `enhanced UI`, `small fix`, and `removed n8n and converted to groq.` Prefer concise messages that describe the user-visible change. PRs should include a clear summary, impacted areas, any required environment variables, and screenshots for UI changes. Link the relevant issue when one exists and note any Convex schema or generated file updates explicitly.

## Security & Configuration Tips
This app depends on local secrets in `.env` or `.env.local`, including `NEXT_PUBLIC_CONVEX_URL`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `ARCJET_KEY`, and ImageKit keys. Never commit secrets. Validate auth- and upload-related changes carefully because Clerk, Arcjet, and ImageKit are used directly in runtime code.
