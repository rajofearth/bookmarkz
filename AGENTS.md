## Cursor Cloud specific instructions

### Overview

Bukmarks is a Next.js 16 bookmark management app with a Convex serverless backend and Better Auth (GitHub OAuth). There are no automated tests in the project. The Chrome extension in `extension/` is optional and standalone (plain JS, no build step).

### Running the app

Two processes are needed for full development:

1. **Next.js dev server**: `pnpm dev` (port 3000)
2. **Convex dev server**: `npx convex dev` (syncs functions to the Convex cloud — only needed when editing files in `convex/`)

The Next.js dev server alone is sufficient to run and test the frontend; Convex functions are deployed to the cloud, not run locally.

### Environment variables

All secrets are injected via the environment. The `.env.local` file must be created from the injected secrets before running the app. See `example.env` for the full list. Key variables: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `CONVEX_DEPLOYMENT`.

### Linting and formatting

- Lint: `pnpm lint` (runs Biome check). The codebase has pre-existing lint warnings/errors.
- Format: `pnpm format` (runs Biome format with `--write`).

### Gotchas

- `pnpm install` warns about unapproved build scripts (esbuild, onnxruntime-node, protobufjs). These are safe to ignore — pre-built binaries are downloaded and the app builds/runs fine without running those scripts.
- The Convex client (`ConvexClientProvider.tsx`) uses `process.env.NEXT_PUBLIC_CONVEX_URL!` — the app will crash at runtime if this variable is missing or empty.
- `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` should point to the local dev server origin for local development.
- No automated test suite exists (`package.json` has no `test` script).
