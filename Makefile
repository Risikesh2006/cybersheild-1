.PHONY: help backend-install backend-test frontend-install frontend-build docker-build up down
help:
	@echo "Targets: backend-install backend-test frontend-install frontend-build docker-build up down"
backend-install:
	python -m pip install -r backend/requirements.txt
backend-test:
	python scripts/verify_demo.py
frontend-install:
	cd frontend && npm ci
frontend-build:
	cd frontend && npm run build
docker-build:
	docker compose build
up:
	docker compose up --build -d
down:
	docker compose down
