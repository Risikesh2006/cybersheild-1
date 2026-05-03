.PHONY: help backend-install backend-test frontend-install frontend-build docker-build up

help:
	@echo "Makefile commands:"
	@echo "  backend-install   install backend deps"
	@echo "  backend-test      run backend tests"
	@echo "  frontend-install  install frontend deps"
	@echo "  frontend-build    build frontend"
	@echo "  docker-build      build docker images"
	@echo "  up                run docker-compose up"

backend-install:
	python -m pip install --upgrade pip
	if [ -f backend/requirements.txt ]; then pip install -r backend/requirements.txt; fi

backend-test:
	python -m pytest backend || true

frontend-install:
	cd frontend && npm ci

frontend-build:
	cd frontend && npm run build --if-present

docker-build:
	docker build -f backend/Dockerfile -t cybershield-backend:latest ./backend
	docker build -f frontend/Dockerfile -t cybershield-frontend:latest ./frontend

up:
	docker-compose up --build
