# 06 ? Security and Verification

## Credential handling

The source snapshot excludes the original `.env`, database, Git history, installed dependencies, caches, logs, and private key files. Empty `.env.example` templates document required configuration. Both Git and Docker ignore rules exclude private runtime files. A scan of the submission text checked common provider/token formats and exact confidential values from the original backend environment without printing their values; no matches were found. This is a bounded scan, not a guarantee or a complete security audit.

Production startup rejects a missing, short, or obvious placeholder JWT signing secret. The default demo disables AI provider use; live credentials must be supplied privately on the deployment host. No account passwords or issued access tokens are saved in verification output.

## Executed checks ? 14 September 2026

- Next.js production build completed successfully, including type checking and prerendering.
- Standalone production server returned HTTP 200 for `/`, `/auth`, `/dashboard`, `/profile`, and a JavaScript asset. These are HTTP smoke checks, not a full browser interaction test.
- Clean frontend dependency installation from package-lock.json succeeded.
- Isolated backend verification passed in both development and production settings: health, registration, login, onboarding, session start, pause, resume, two scenario submissions, completion, narrative, history, progress dashboard, and early termination of a second session.
- Verification uses a temporary database and random in-memory credentials, avoiding the original user database.
- Production configuration rejects an unset signing secret.
- Compose YAML parsed successfully, and referenced build contexts and Dockerfiles exist.
- PowerShell launch and setup scripts passed syntax parsing.
- Credential scan found no matches in the included source and documents.

## Deployment changes

Next.js standalone production output replaces the obsolete static-Vite Docker configuration. A legacy profile component was moved out of `src/pages` to prevent unintended Pages Router prerendering, and the existing profile route import was updated. The sign-in route now wraps search-parameter access in Suspense. Production browser requests use `/api`, routed by Caddy to FastAPI. Backend CORS is environment-configured; the database and TLS state use persistent volumes. Container processes for the app run as non-root users.

## Limits

Docker is unavailable on this workstation. Container image builds, Compose startup, Caddy routing, public DNS, and HTTPS issuance have not been executed here. Live provider calls and Google OAuth have not been tested. A public deployment and GitHub publication are not included. SQLite is configured for a single host, and the prototype still needs broader security review and migration planning before use as a production service with sensitive data.
