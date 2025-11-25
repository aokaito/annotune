# Annotune

Annotune is a vocal-practice notebook that lets singers annotate lyric passages with performance techniques (e.g., vibrato, scoop, fall), comments, and props metadata while keeping track of versions and sharing states. This monorepo houses the frontend editor/viewer, the backend Lambda API, and the infrastructure stack that wires Cognito, API Gateway, DynamoDB, and an S3/CloudFront hosting layer.

## Repository layout

```
. 
├── frontend/          # React + Vite SPA (Tailwind CSS, TanStack Query, Zustand, react-hook-form)
├── backend/           # Node.js Lambda handlers, zod schemas, DynamoDB repository helpers
├── infra/             # AWS CDK stack spinning up Cognito/API Gateway/Lambda/Dynamo
└── .github/workflows/ # CI workflows for frontend/backend
```

## Frontend highlights

- **Lyric editor & viewer**: Select text ranges, apply tags, add comments, and optionally snap to annotations on mobile.
- **Inline comments**: Comments attached to a lyric segment now render directly beneath the highlighted span, matching the same experience as vibrato/breath indicators.
- **Mockable API**: `src/api/client.ts` exposes an in-memory implementation so you can iterate without a deployed backend; swap to a real API by setting `VITE_API_BASE_URL`.
- **Annotation palette & list**: Tag chips, intensity/length props, and mobile actions provide quick CRUD over annotations.
- **Cognito-aware UX**: Zustand stores authenticated user info while TanStack Query manages lyric metadata, access control, and mutation states.

### Local frontend development

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

When hitting a real Cognito + API Gateway deployment, drop an `.env.local` containing:

```
VITE_API_BASE_URL=https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod/
VITE_COGNITO_LOGIN_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/login?...
# Optional: redirect after hosted UI logout
VITE_COGNITO_LOGOUT_URL=https://your-domain.auth.ap-northeast-1.amazoncognito.com/logout?...
```

`VITE_API_BASE_URL` determines whether the SPA uses the mock client or the deployed HTTP API.

## Backend overview

- **Router**: `src/handlers/router.ts` dispatches HTTP API routes to handler modules.
- **Validation**: `zod` schemas in `src/schemas/lyrics.ts` guard lyric/annotation payloads.
- **Repository**: `LyricsRepository` ensures optimistic locking, overlap checks, and DynamoDB persistence for lyrics, annotations, and versions.
- **Tests**: Vitest validates schemas and helper logic in `src/__tests__/schemas.test.ts`.

### Running backend locally

```bash
npm install --prefix backend
npm test --prefix backend
npm run build --prefix backend
```

Environment variables required by the Lambda handler:
- `LYRICS_TABLE_NAME`
- `LYRICS_OWNER_INDEX_NAME`
- `ANNOTATIONS_TABLE_NAME`
- `VERSIONS_TABLE_NAME`
- `ALLOWED_ORIGIN`

## Infrastructure

CDK stacks provision the following resources:

- **Amazon Cognito**: User pool + Hosted UI client for authentication.
- **Amazon DynamoDB**: Tables for lyrics (`AnnotuneLyrics`), annotations (`AnnotuneAnnotations`), document versions (`AnnotuneDocVersions`) with owner GSI + PITR.
- **AWS Lambda (Node.js 20)**: Single function hosting the REST API.
- **Amazon API Gateway (HTTP API)**: JWT authorizer, CORS, route mappings.
- **Amazon S3 + CloudFront**: Hosts the SPA (`frontend/dist`) with an invalidation-ready distribution.

### Deploying infra

```bash
npm install --prefix infra
npm run build --prefix infra
npm run synth --prefix infra
npm run deploy --prefix infra
```

Build the frontend ahead of deployment so you can publish the latest `frontend/dist` artifacts:

```
npm run build --prefix frontend
```

GitHub Actions requires the following secrets:
- `AWS_DEPLOY_ROLE`
- `WEB_BUCKET`
- `CLOUDFRONT_DISTRIBUTION`

## API reference (v1)

- `POST /v1/lyrics`: Create lyrics document.
- `GET /v1/lyrics?mine=true`: List owned documents.
- `GET /v1/lyrics/{docId}`: Fetch lyrics + annotations (owner only).
- `PUT /v1/lyrics/{docId}`: Update lyrics (optimistic lock via `X-Doc-Version`).
- `DELETE /v1/lyrics/{docId}`: Delete (owner only).
- `POST /v1/lyrics/{docId}/share`: Toggle public visibility.
- `POST /v1/lyrics/{docId}/annotations`: Add annotation (400 on overlaps).
- `PUT /v1/lyrics/{docId}/annotations/{annotationId}`: Update annotation.
- `DELETE /v1/lyrics/{docId}/annotations/{annotationId}`: Delete annotation.
- `GET /v1/lyrics/{docId}/versions`: List versions.
- `GET /v1/lyrics/{docId}/versions/{version}`: Retrieve snapshot.
- `GET /v1/public/lyrics/{docId}`: Public view (requires `isPublicView: true`).

Errors follow HTTP conventions: 400 validation, 403 unauthorized, 404 not found, 409 version mismatch, etc.

## Next steps

1. Point the SPA at a real API Gateway + Cognito setup and swap the mock client for the HTTP client.
2. Expand backend tests (integration or DynamoDB Local) and add React Testing Library coverage as needed.
3. Harden infra with WAF/rate limiting, structured logging, and CloudWatch alarms.
4. Build CI/CD to deploy the SPA automatically and invalidate the CloudFront cache after each release.

Enjoy annotating melodies! 🎶
