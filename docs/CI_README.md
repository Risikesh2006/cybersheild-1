# CI / CD Pipeline

This repository includes a basic CI pipeline and Docker support for local development and GitHub Actions.

Included files

- `.github/workflows/ci.yml` — GitHub Actions workflow that runs backend checks, builds frontend, and builds Docker images.
- `backend/Dockerfile` — Dockerfile to build the FastAPI backend.
- `frontend/Dockerfile` — Dockerfile to build the frontend and serve static files using nginx (assumes output in `dist`).
- `docker-compose.yml` — Compose file to run backend and frontend together for local testing.
- `Makefile` — Handy targets to install deps, run tests and build images.

Usage

1. Run CI locally (simple):

```bash
make backend-install
make frontend-install
make frontend-build
```

2. Build Docker images locally:

```bash
make docker-build
```

3. Run services with docker-compose:

```bash
docker-compose up --build
```

Notes

- The pipeline is conservative: tests and linters are executed only when present. Some commands are permissive (`|| true`) so they won't fail the workflow when tests are absent.
- The frontend `Dockerfile` assumes the build output is in `dist` (Vite). If your frontend is Next.js or outputs to `.next`, update the Dockerfile accordingly.
- To push images from CI, update `.github/workflows/ci.yml` to add a deploy step and provide registry credentials via repository secrets.
