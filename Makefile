# ─── Magic Box — Makefile ─────────────────────────────────────────────────────
.PHONY: dev prod down migrate createsuperuser logs shell-backend shell-db seed

# ── Local development ─────────────────────────────────────────────────────────
dev:
	docker compose -f docker-compose.dev.yml up --build

dev-d:
	docker compose -f docker-compose.dev.yml up --build -d

down:
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.prod.yml down

# ── Production ────────────────────────────────────────────────────────────────
prod:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

# ── Database ──────────────────────────────────────────────────────────────────
migrate:
	docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

makemigrations:
	docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations

createsuperuser:
	docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

seed:
	docker compose -f docker-compose.dev.yml exec backend python manage.py seed_data

# ── Utils ─────────────────────────────────────────────────────────────────────
logs:
	docker compose -f docker-compose.dev.yml logs -f

logs-backend:
	docker compose -f docker-compose.dev.yml logs -f backend

shell-backend:
	docker compose -f docker-compose.dev.yml exec backend python manage.py shell

shell-db:
	docker compose -f docker-compose.dev.yml exec db mysql -u magicbox -pmagicbox123 magicbox
