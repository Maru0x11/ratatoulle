# Ratatoulle — Recipe CMS

Ratatoulle is a Django-powered web application for publishing and managing recipes. The product targets home cooks and content editors who need a straightforward way to browse dishes, inspect ingredients and courses, maintain a personal favorites list, and (for authorized editors) administer the catalog through dedicated workflows.

---

## Highlights

- **Recipe catalog** with structured fields for title, description, course type, ingredient lines, and optional imagery.
- **Role-aware experience** distinguishing visitors from administrative users (`User.is_admin`, staff flags, Django’s built-in superuser tooling).
- **Session-backed authentication** (Django auth) wired toward modern UX via asynchronous JSON endpoints where forms are enhanced in-browser.
- **Favorites workflow** anchored to persisted relationships between users and saved recipes rather than ephemeral browser storage.
- **Light editorial visual language** — warm paper-toned canvas, white content cards with soft biscuit borders, terracotta primary actions and links, sage reserved for structured labels (forms and table headers), and brick-red reserved for destructive actions—aligned with readable food-blog publishing rather than tool-style dark UIs.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | Python 3.x |
| Framework | Django 6.x |
| Database | SQLite (default; swap `DATABASES` in `config/settings.py` for PostgreSQL or MySQL in production) |
| Media | Local filesystem via `MEDIA_ROOT` + Pillow for image fields |
| Frontend | Server-rendered templates + modular ES modules + shared stylesheet |

---

## Getting started

### Prerequisites

- Python **3.12+** (matches upstream Django 6 support matrix)
- `pip` and a virtual environment tool (`python -m venv` is sufficient)

### Installation

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Database & static assets

```bash
python manage.py migrate
python manage.py collectstatic --noinput   # only required when DEBUG=False
```

Create an administrative account for first-time setup:

```bash
python manage.py createsuperuser
```

### Run the development server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` after your URL routes and templates are mounted. The Django admin console remains available at `http://127.0.0.1:8000/admin/`.

---

## Configuration notes

- **Custom user model** — `AUTH_USER_MODEL = 'recipes.User'` extends `AbstractUser` with an `is_admin` boolean for product-level authorization checks.
- **Media uploads** — recipe images land under `MEDIA_ROOT/recipe_photos/`; ensure the directory is writable and backed up in production.
- **Security** — rotate `SECRET_KEY`, set `DEBUG=False`, configure `ALLOWED_HOSTS`, and serve static/media via your reverse proxy or object storage before any public deployment.

---

## Repository layout (abridged)

```
config/          # Project settings & root URLConf
recipes/         # Domain models, views, admin registration, app URLs
static/recipes/  # Shared CSS & client-side modules
templates/       # HTML templates (integrate with {% static %} in production builds)
media/           # User-generated uploads (git-ignored in real deployments)
```

---

## Design system

The interface keeps a single compact visual grammar: elevated cards on a warm neutrals canvas, restrained borders for separation, terracotta interactive highlights that read inviting on light backgrounds, sage typographic labels for form structure and metadata, and a consistent brick tone for destructive affordances. The palette is centralized in `static/recipes/styles.css` so future theme tweaks stay maintainable.

---

## Contributing workflow

1. Branch from `main` (or the agreed trunk) using short, intent-driven names.
2. Keep migrations deterministic — never hand-edit migration history once merged.
3. Run `python manage.py check` and smoke-test critical flows before opening a merge request.

---

## License

All rights reserved unless otherwise specified by the owning organization.
