# Annotune

Annotune is a vocal practice notebook that lets singers attach expressive annotations (ビブラート / しゃくり etc.) to arbitrary lyric ranges, review historical versions, and share a read-only public link. This repository contains three coordinated packages:

- `frontend/`: React + Vite SPA (Tailwind + shadcn-inspired UI) for editing and reviewing lyrics.
- `backend/`: Lambda-ready TypeScript handlers that expose the REST API described in the MVP requirements.
- `infra/`: AWS CDK (TypeScript) stack wiring Cognito, API Gateway, Lambda, DynamoDB, and the static hosting pipeline.

## Repository layout

```
.
├── frontend/          # React SPA (TanStack Query, Zustand, react-hook-form, Tailwind)
├── backend/           # Lambda handlers, zod schemas, DynamoDB repositories
├── infra/             # CDK stack provisioning the AWS serverless architecture
└── .github/workflows/ # CI pipelines for frontend and backend deployments
```

## Frontend overview

- Routing: React Router 6 with authenticated screens (Dashboard, Editor, Versions) and a public reader.
- State: TanStack Query caches API responses, Zustand stores Cognito identity metadata.
- UI patterns: annotation palette for range selection, preview renderer, editable list with optimistic toasts.
- Mock API: `src/api/client.ts` offers an in-memory implementation so the SPA works before the backend is deployed.

### Local dev

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Add a `.env.local` in `frontend/` to inject Cognito Hosted UI when you have the actual endpoints:

```
VITE_COGNITO_LOGIN_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/login?... 
```

## Backend overview

- Handlers: `src/handlers/router.ts` routes HTTP API events to individual controllers implementing the required endpoints.
- Validation: All payloads are checked with zod (`src/schemas/lyrics.ts`).
- Data access: `LyricsRepository` encapsulates DynamoDB reads/writes, optimistic locking, overlap checks, and version snapshots.
- Tests: Vitest-based unit tests cover schema validation.

### Local checks

```bash
npm install --prefix backend
npm test --prefix backend
npm run build --prefix backend
```

Set the following environment variables when running locally or in Lambda:

- `LYRICS_TABLE_NAME`
- `LYRICS_OWNER_INDEX_NAME`
- `ANNOTATIONS_TABLE_NAME`
- `VERSIONS_TABLE_NAME`
- `ALLOWED_ORIGIN`

## Infrastructure overview

The CDK stack provisions:

- **Amazon Cognito** User Pool + client for Hosted UI login.
- **Amazon DynamoDB** tables (`AnnotuneLyrics`, `AnnotuneAnnotations`, `AnnotuneDocVersions`) with owner GSI and PITR.
- **AWS Lambda (Node.js 20)** single router function bundling the backend handlers.
- **Amazon API Gateway (HTTP API)** with JWT authorizer, CORS, and a public route for read-only sharing.
- **Amazon S3 + CloudFront** distribution for the SPA, including a deployment helper (expects a pre-built `frontend/dist`).

### Deploy

```bash
npm install --prefix infra
npm run build --prefix infra
npm run synth --prefix infra
npm run deploy --prefix infra
```

Prior to deployment, build the frontend so the bucket deployment has assets:

```bash
npm run build --prefix frontend
```

Configure the following secrets for CI/CD:

- `AWS_DEPLOY_ROLE` – IAM role ARN assumed by GitHub Actions.
- `WEB_BUCKET`, `CLOUDFRONT_DISTRIBUTION` – targets for the frontend deploy job.

## API reference (v1)

- `POST /v1/lyrics` – Create lyric document.
- `GET /v1/lyrics?mine=true` – List current user’s lyrics.
- `GET /v1/lyrics/{docId}` – Fetch lyric with annotations (owner only).
- `PUT /v1/lyrics/{docId}` – Update lyric text/title (requires `X-Doc-Version`).
- `DELETE /v1/lyrics/{docId}` – Delete lyric (owner only).
- `POST /v1/lyrics/{docId}/share` – Toggle public availability.
- `POST /v1/lyrics/{docId}/annotations` – Create annotation (non-overlapping enforced).
- `PUT /v1/lyrics/{docId}/annotations/{annotationId}` – Update annotation.
- `DELETE /v1/lyrics/{docId}/annotations/{annotationId}` – Remove annotation.
- `GET /v1/lyrics/{docId}/versions` – List stored snapshots.
- `GET /v1/lyrics/{docId}/versions/{version}` – Fetch specific snapshot.
- `GET /v1/public/lyrics/{docId}` – Public read-only view when sharing is enabled.

Errors follow HTTP semantics (400 range validation, 403 ownership, 404 not found, 409 version conflicts).

## Next steps

1. Connect the frontend API hooks to the deployed API Gateway base URL via environment variables.
2. Replace the mock client with real `fetch` wrappers that attach Cognito tokens and the `X-Doc-Version` header.
3. Harden the infrastructure (WAF, throttling limits, logging retention) and enable alarms.
4. Expand testing: repository integration tests against DynamoDB Local, React Testing Library for key flows.

Enjoy annotating your melodies! 🎶
