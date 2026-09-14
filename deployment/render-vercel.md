# Render backend + Vercel frontend

Frontend: https://cybershield-azure-delta.vercel.app

## Diagnosis

The deployed frontend used `/api` when no public API endpoint was embedded at build time. Vercel has no API proxy: `/api/health` and `/api/auth/me` returned 404. The backend also needed the Vercel origin in its production CORS list. The client now reads `NEXT_PUBLIC_API_BASE_URL`, with localhost:8000 only as the development fallback.

## Deploy Render

Use the root `render.yaml` as a Render Blueprint, or create a Web Service with:

| Setting | Value |
|---|---|
| Repository | https://github.com/Risikesh2006/cybersheild-1 |
| Branch | main |
| Root directory | backend |
| Runtime | Python |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |

Set these service environment variables. Enter secrets privately in Render; never commit them.

| Variable | Value |
|---|---|
| PYTHON_VERSION | `3.11.11` |
| ENVIRONMENT | `production` |
| DEMO_MODE | `false` (required for real AI calls) |
| ANTHROPIC_API_KEY | Your valid Anthropic API key, entered privately |
| SECRET_KEY | Your private random signing secret, at least 32 characters |
| ACCESS_TOKEN_EXPIRE_MINUTES | `1440` |
| DATABASE_URL | `sqlite:///./cybershield.db` |
| FRONTEND_URL | `https://cybershield-azure-delta.vercel.app` |
| CORS_ORIGINS | `http://localhost:3000,http://localhost:5173,https://cybershield-azure-delta.vercel.app` |
| CLAUDE_MODEL | `claude-haiku-4-5-20251001` |
| CLAUDE_SCENARIO_MODEL | `claude-sonnet-4-6` |

Gemini and Google OAuth are optional. For Claude-only deployment leave `GEMINI_API_KEY` unset. Google login additionally requires Google client credentials and a registered `GOOGLE_OAUTH_REDIRECT` pointing to the backend `/auth/google/callback` endpoint. Email/password login does not need Google credentials.

Wait for a successful deploy, inspect the service logs, and copy its actual HTTPS URL. Check `/health` returns HTTP 200 and exactly `{"status":"ok","service":"CyberShield API"}`. Check `/docs` loads Swagger and `/openapi.json` lists the existing API routes.

## Connect Vercel

In the existing CyberShield project, set `NEXT_PUBLIC_API_BASE_URL` to the actual Render HTTPS URL without a trailing slash, for Production, Preview, and Development. Redeploy the frontend: Next.js embeds public variables during the build. Do not place secrets in any `NEXT_PUBLIC_` variable.

Preview deployments use different browser origins. Add the exact preview origins to Render's `CORS_ORIGINS` if testing them; the production domain and the two local origins are already allowed. Do not use wildcard credentialed CORS.

## Verify the live system

Use a test account to register, log in, load the profile/dashboard, select topics, start a session, answer scenarios, and complete the session. Verify XP, learner skill attempts, history, and debrief. In browser network tools confirm requests go to the real Render URL with the bearer token and no CORS errors.

The existing agents fall back to built-in content if provider calls fail. A successful scenario alone does not prove Anthropic works. With `DEMO_MODE=false`, check Anthropic usage and Render logs during the test to confirm actual successful provider requests. Local `python scripts/verify_demo.py` tests production configuration with fallback content and an isolated temporary database; it does not validate live hosting or Anthropic credentials.

## SQLite persistence

The Blueprint uses Render's free plan. Its filesystem is ephemeral: SQLite data can be lost on a restart, redeploy, or service replacement. This is suitable only for disposable hackathon test data, not durable accounts.

To retain SQLite, use a paid service with a persistent disk mounted at `/var/data` and set `DATABASE_URL=sqlite:////var/data/cybershield.db`. Keep one backend instance and arrange backups. PostgreSQL or Supabase is the recommended next production improvement for durable, scalable storage; no database migration is included here.

References: [Render FastAPI](https://render.com/docs/deploy-fastapi), [persistent disks](https://render.com/docs/disks), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Anthropic model lifecycle](https://platform.claude.com/docs/en/about-claude/model-deprecations).
