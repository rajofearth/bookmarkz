# Bukmarks (bookmarkz)

A cross-platform bookmark dashboard web app built with Next.js 16, Convex (serverless BaaS), and Better Auth (GitHub OAuth).

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js dev server | `pnpm dev` | 3000 | Main web app |
| Convex backend | Cloud-hosted | N/A | Data stored in Convex cloud; no local DB |

### Running the app

- `pnpm dev` starts the Next.js dev server on `[REDACTED]`.
- The app requires a Convex deployment and GitHub OAuth credentials configured via `.env.local` (see `example.env` for the full list).
- The root `/` redirects to `/auth` if unauthenticated, or `/bookmarks` if authenticated.
- Authentication is GitHub OAuth only — a GitHub OAuth app must be configured with the correct callback URL.

### Standard commands

See `package.json` scripts: `pnpm dev`, `pnpm build`, `pnpm lint` (Biome), `pnpm format`.

### Gotchas

- **pnpm 10 blocks postinstall scripts by default.** The `pnpm-workspace.yaml` lists `ignoredBuiltDependencies` for `sharp` and `unrs-resolver`. The remaining blocked packages (`esbuild`, `onnxruntime-node`, `protobufjs`) still work because their platform-specific binaries are delivered via optionalDependencies (no postinstall needed).
- **No automated test suite exists** — there are no test scripts, test frameworks, or test files in this codebase. Validation is done via `pnpm lint` (Biome check) and `pnpm build`.
- The `.env.local` file is not committed. It must be created from `example.env` and populated with secrets injected as environment variables.
- **`npx convex dev` requires interactive auth.** The Convex CLI device-login flow cannot run in non-interactive terminals. To use `convex dev` non-interactively, a `CONVEX_DEPLOY_KEY` secret must be provided. The Next.js app itself connects to the Convex cloud via `NEXT_PUBLIC_CONVEX_URL` and works without `convex dev` running, as long as the Convex functions are already deployed.
