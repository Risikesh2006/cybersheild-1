# Continuous integration

The workflow in `.github/workflows/ci.yml` runs on pushes and pull requests targeting main or master.

1. Backend: installs dependencies on Python 3.14 and runs the isolated, credential-free training workflow with production configuration.
2. Frontend: installs from package-lock.json on Node.js 22 and builds the Next.js production bundle.
3. Deployment: builds both containers, starts Compose, waits for health checks, and requests the homepage and `/api/health` through Caddy.

The deployment job generates an ephemeral secret only on the runner. It never uploads `.env`, records no passwords or bearer tokens, and removes temporary volumes after the job. Failures propagate to workflow status. No step publishes images or deploys a public website.

Local equivalents:

```sh
python scripts/verify_demo.py
cd frontend
npm ci
npm run build
```

See the deployment guide for Docker setup. A workflow definition does not imply a successful remote run. Check the Actions result for the pushed commit.

The committed frontend `.npmrc` preserves the legacy peer-dependency resolution used to create the lockfile. The frontend Docker build copies this configuration before installing.
