# FluencyQuest

FluencyQuest is a Vite, React, and TypeScript English-learning app. It includes quest-based practice, quizzes, speech exercises, and optional Supabase accounts and cloud progress.

## Local development

1. Use Node.js 22.12 or newer.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and configure the Supabase variables when using cloud accounts.
4. Run `npm run dev`.

Before deploying, run `npm run lint`, `npm run typecheck`, and `npm run build`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Supabase setup, hosting configuration, and production verification.
