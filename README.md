# HobbyTrack

A full-stack, Letterboxd-inspired media cataloging and social app for tracking music and books. Log what you've read or listened to, rate and review it, follow other users, and join clubs — all backed by a normalized relational schema and real external data sources.

## Features

- **Media logging & reviews** — track books and albums, write reviews, rate on a personal scale
- **Social layer** — follow other users, view a personalized activity feed, join or create clubs
- **External search** — pull real book and album data live from Google Books and MusicBrainz instead of manual entry
- **Auth** — JWT-based authentication with bcrypt password hashing and role-based authorization
- **Data integrity** — transactional writes across multi-table operations, composite keys, and cascading foreign keys across an 11+ table schema

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MySQL 8.0 |
| Auth | JWT, bcrypt |
| External APIs | Google Books API, MusicBrainz API |
| Infra | Docker, Docker Compose, nginx |

## Architecture

```
hobbyTrack/
├── hobbytrack-backend/     # Express API server
│   ├── routes/              # auth, media, reviews, logs, clubs, users, feed, search
│   ├── config/db.js         # MySQL connection pool
│   └── Dockerfile
├── hobbytrack-frontend/     # React + Vite SPA
│   ├── src/
│   ├── nginx.conf           # SPA fallback routing for production build
│   └── Dockerfile
├── db/
│   └── init.sql             # Schema, auto-loaded on first container start
├── docker-compose.yml
├── .env.example
└── README.md
```

The backend and frontend run as separate services, each with their own Dockerfile, alongside a MySQL container. Compose wires them together on an internal network — the frontend talks to the backend over `localhost` from the browser, and the backend talks to MySQL over the internal Docker network using the service name `db` as the host.

## Running Locally

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

1. Clone the repo and move into it:
   ```bash
   git clone https://github.com/damianv-3/hobbytrack.git
   cd hobbyTrack
   ```

2. Copy the example environment file and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   You'll need a [Google Books API key](https://developers.google.com/books/docs/v1/using) for the external book search to work. MusicBrainz requires no API key.

3. Build and start everything:
   ```bash
   docker compose up --build
   ```
   On first run, MySQL will initialize a fresh database and automatically load the schema from `db/init.sql`.

4. Open the app:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

5. Register a new account through the app to get started — the database starts empty (schema only, no seed data).

### Stopping / resetting

```bash
docker compose down        # stop containers, keep data
docker compose down -v     # stop containers AND wipe the database volume (fresh init.sql load on next 'up')
```

## Environment Variables

See `.env.example` for the full list. At minimum you'll need:

| Variable | Purpose |
|---|---|
| `DB_ROOT_PASSWORD` | MySQL root password (container-internal only) |
| `DB_NAME` | Database name |
| `DB_USER` / `DB_PASSWORD` | App database user credentials |
| `JWT_SECRET` | Signs authentication tokens — use a real random string, not a placeholder, if deploying anywhere beyond local dev |
| `GOOGLE_BOOKS_API_KEY` | Required for book search/import to work |

## Database Schema

The schema spans 11+ tables supporting a unified review/rating system across multiple media types, with composite keys and cascading foreign keys to keep multi-table writes consistent. Full structure is defined in `db/init.sql`.

## Roadmap

- [ ] CI pipeline (GitHub Actions) running tests on push
- [ ] Deployed live demo (Railway/Render)
- [ ] Automated test suite for auth and core endpoints