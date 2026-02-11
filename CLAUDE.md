# CLAUDE.md

## Project Overview

Annotune is a vocal practice annotation tool. Users annotate song lyrics with vocal technique notations (vibrato, scoop, fall, breath), voice quality tags (whisper, edge, falsetto), and comments. Built as a TypeScript monorepo with React frontend, Node.js Lambda backend, and AWS CDK infrastructure.

## Monorepo Structure

```
frontend/          # React 18 SPA (Vite, TailwindCSS, Zustand, TanStack Query)
backend/           # Node.js 20 Lambda handlers (DynamoDB, Zod, Pino)
infra/             # AWS CDK stacks (Cognito, DynamoDB, Lambda, API Gateway, S3+CloudFront)
packages/common/   # Shared types and utilities
```

## Commands

### Root (all workspaces)
- `npm run lint` — Lint frontend + backend
- `npm run typecheck` — Type-check all workspaces
- `npm run build:frontend` — Build React SPA
- `npm run build:backend` — Build Lambda handlers
- `npm run synth` — Synthesize CDK templates

### Frontend (`npm --prefix frontend run ...`)
- `dev` — Dev server on port 5173
- `build` — Typecheck + Vite production build
- `test` — Unit tests (Vitest)
- `test:e2e` — E2E tests (Playwright)
- `lint` / `typecheck`

### Backend (`npm --prefix backend run ...`)
- `build` — Compile TypeScript
- `test` — Unit tests (Vitest)
- `lint` / `typecheck`

### Infrastructure (`npm --prefix infra run ...`)
- `synth` — Synthesize CloudFormation
- `deploy` — Deploy to AWS

## Code Conventions

- **Language**: TypeScript (strict mode). Project documentation and UI are in Japanese.
- **Backend pattern**: Router → Handler → Service → Repository → DynamoDB
- **Validation**: Zod schemas in `backend/src/schemas/`
- **Error handling**: `HttpError` class with HTTP status codes in `backend/src/utils/errors.ts`
- **Auth**: JWT extraction from API Gateway event (`backend/src/utils/auth.ts`)
- **Frontend state**: Zustand for auth (`store/auth.ts`), TanStack Query for server state (`hooks/useLyrics.ts`)
- **API client**: Dual-mode — mock (in-memory) when `VITE_API_BASE_URL` is unset, otherwise HTTP client (`api/client.ts`)
- **Components**: Radix UI primitives, TailwindCSS for styling
- **Routing**: React Router v6 with lazy-loaded pages
- **Shared types**: `packages/common/src/types.ts` — EffectTag, VoiceQualityTag, AnnotationTag, etc.
- **ID generation**: nanoid via shared utility
- **Optimistic locking**: `X-Doc-Version` header for concurrent edit protection
- **Testing**: Vitest for unit tests, Playwright for E2E (desktop 1280x800, tablet 768x1024, mobile 375x812)
- **ESLint + Prettier** configured in both frontend and backend

## CI/CD

GitHub Actions on push to `main` with path filters:
1. Lint frontend + backend
2. Test frontend + backend
3. CDK synth + diff (PR) or deploy (main branch)
4. AWS OIDC authentication for deployments

## Key Architecture Notes

- DynamoDB tables: Lyrics, Annotations, Versions — all with GSI on `ownerId`
- Point-in-time recovery (PITR) enabled
- Cognito UserPool with Hosted UI and OAuth for authentication
- S3 + CloudFront for SPA hosting
- Lambda: Node.js 20, 512MB, 30s timeout
