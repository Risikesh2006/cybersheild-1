# Deploy CyberShield

This configuration runs the Next.js production server, FastAPI, and a Caddy gateway on one Docker host. SQLite data persists in a named volume. It is intended for a single-host hackathon deployment, not a horizontally scaled service.

## Start on a machine with Docker Engine and Compose v2

From the repository root:

```sh
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

On Windows use `Copy-Item .env.example .env` for the copy command. Paste the generated value into `SECRET_KEY` in the private `.env` file. Keep `DEMO_MODE=true` for a no-key demo.

```sh
docker compose up --build -d
docker compose ps
```

Open http://localhost and check http://localhost/api/health. API documentation is at http://localhost/api/docs. Register a fresh account, choose two topics, start a session, submit an answer, and check feedback and history. Inspect startup failures with `docker compose logs --tail=100`.

## Public domain and HTTPS

Point a domain's DNS to the Docker host, allow incoming TCP 80 and 443, and change:

```dotenv
PUBLIC_URL=https://your-domain.example
SITE_ADDRESS=your-domain.example
```

Use your real domain, then run `docker compose up -d`. Caddy requests and renews HTTPS certificates when DNS and network access are correct. Only the gateway publishes ports; backend and frontend remain on the internal Docker network.

## Live AI mode

Set `DEMO_MODE=false` and your own `ANTHROPIC_API_KEY` in `.env`; optionally set `GEMINI_API_KEY`. Model overrides are `CLAUDE_MODEL`, `CLAUDE_SCENARIO_MODEL`, and `GEMINI_SCENARIO_MODEL`. Choose models available to your provider account. Restart with `docker compose up -d`. The supplied fallback mode has been tested; paid provider inference has not.

Google login is optional. Register the redirect URI `https://YOUR_DOMAIN/api/auth/google/callback` with your provider and privately configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Use email/password if OAuth is not configured.

## Operations

- Keep `.env` outside source control; Docker build contexts exclude it and existing databases.
- Keep `SECRET_KEY` stable across restarts. Changing it signs users out.
- Database location inside the backend is `/data/cybershield.db`, backed by `training_data`.
- Stop with `docker compose down`. Do not use `down -v` unless you intend to erase persisted data.
- Back up the database before upgrades: stop the backend, use `docker compose cp backend:/data/cybershield.db ./cybershield-backup.db`, then start the backend again. Store backups privately.
- This prototype creates tables at startup; schema-changing upgrades need a reviewed migration before deployment.
- Do not increase backend replicas with the SQLite configuration.

## Validation limits

See `../docs/verification.md` for executed checks. Docker is not installed on the preparation machine, so container builds, gateway routing, and TLS must be confirmed on the target host. No public deployment is claimed.

Configuration references: [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [Compose health dependencies](https://docs.docker.com/compose/how-tos/startup-order/), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https).
