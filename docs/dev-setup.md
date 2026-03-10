# Development Setup Guide

This guide will help you set up the Orbi educational platform for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (installed and running) - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **pnpm** - Install globally with:
  ```bash
  npm install -g pnpm
  ```

## Quick Start

### 1. Environment Setup

Copy the example environment file for the backend:

```bash
# From the project root
cp backend/.env.example backend/.env
```

The default environment variables are pre-configured for local development:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# API Configuration
API_PREFIX=/api/v1

# Engine Configuration
ENGINE_MAX_RETRIES=3

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=orbi
DB_PASSWORD=orbi_secret
DB_NAME=orbi_dev
```

### 2. Start Database

Start the MariaDB database using Docker:

```bash
docker-compose up -d
```

This will:
- Start a MariaDB 11.4 container named `orbi-mariadb`
- Expose the database on port 3306
- Create a database named `orbi_dev`
- Create a user `orbi` with password `orbi_secret`
- Initialize the schema from `docs/dbscript.md`

To verify the database is running:

```bash
docker-compose ps
```

To stop the database:

```bash
docker-compose down
```

To stop and remove the database volume (fresh start):

```bash
docker-compose down -v
```

### 3. Run Development Server

Start the development server:

```bash
pnpm dev
```

This will:
- Start the backend server (default: http://localhost:3001)
- Start the frontend development server
- Run database migrations automatically on startup

The server will be available at `http://localhost:3001`.

## Database

### Migrations

The project uses **Kysely** for type-safe SQL queries and migrations. Migrations are run automatically when the server starts in development mode.

#### Migration Files

Migrations are located in [`backend/src/infrastructure/database/migrations/`](../backend/src/infrastructure/database/migrations/):

| File | Tables Created |
|------|----------------|
| `001_create_concept_tables.ts` | `concept`, `concept_group` |
| `002_create_sentence_tables.ts` | `sentence`, `sentence_concept` |
| `003_create_algorithm_tables.ts` | `algorithm`, `step`, `algorithm_step` |

#### Database Commands

```bash
# Run pending migrations only
pnpm db:migrate

# Insert dev seed data (idempotent, safe to run multiple times)
pnpm db:seed:dev

# Drop all tables + re-run migrations (no data)
pnpm db:reset

# Drop all tables + re-run migrations + seed dev data
pnpm db:reset:dev
```

| Command | What it does |
|---------|-------------|
| `pnpm db:migrate` | Runs pending Kysely migrations |
| `pnpm db:seed:dev` | Inserts sample dev data (idempotent, skips existing rows) |
| `pnpm db:reset` | Drops all tables, re-runs migrations (clean schema, no data) |
| `pnpm db:reset:dev` | Shortcut for `db:reset` + `db:seed:dev` |

> **Note:** `db:reset` and `db:reset:dev` are destructive — they drop all tables. Use them when you want a completely fresh database.

#### Manual Migration Control

To disable automatic migrations on startup, set the environment variable:

```bash
RUN_MIGRATIONS=false pnpm dev
```

Or add to your `.env` file:

```env
RUN_MIGRATIONS=false
```

### Database Schema

The database consists of 7 tables organized into three domains:

#### Concept Tables

| Table | Description |
|-------|-------------|
| `concept` | Educational concepts/topics (e.g., "Algebra", "Geometry") |
| `concept_group` | Hierarchical parent-child relationships between concepts (DAG structure) |

#### Sentence Tables

| Table | Description |
|-------|-------------|
| `sentence` | Educational sentences/statements for quizzes |
| `sentence_concept` | Many-to-many relationship linking sentences to concepts with `is_true` attribute |

#### Algorithm Tables

| Table | Description |
|-------|-------------|
| `algorithm` | Algorithm definitions (e.g., "Quadratic Formula") |
| `step` | Individual algorithm steps (can be shared across algorithms) |
| `algorithm_step` | Ordered linking of steps to algorithms with `order_number` |

#### Entity Relationships

```
concept ──┬── concept_group (self-referential)
          └── sentence_concept ── sentence
                                       
algorithm ──┬── step (owned)
            └── algorithm_step ── step (referenced)
```

## API Endpoints

All API endpoints are prefixed with `/api` (configurable via `API_PREFIX`).

### Concepts (`/api/concepts`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/concepts` | List all concepts | - |
| GET | `/concepts/:id` | Get concept by ID | - |
| POST | `/concepts` | Create a new concept | `{ "name": "string" }` |
| PUT | `/concepts/:id` | Update a concept | `{ "name": "string" }` |
| DELETE | `/concepts/:id` | Delete a concept | - |
| POST | `/concepts/:id/children` | Add child concept | `{ "childId": number }` |
| DELETE | `/concepts/:id/children/:childId` | Remove child concept | - |

### Sentences (`/api/sentences`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/sentences` | List all sentences | - |
| GET | `/sentences/:id` | Get sentence by ID | - |
| POST | `/sentences` | Create a new sentence | `{ "content": "string" }` |
| PUT | `/sentences/:id` | Update a sentence | `{ "content": "string" }` |
| DELETE | `/sentences/:id` | Delete a sentence | - |
| POST | `/sentences/:id/concepts` | Link sentence to concept | `{ "conceptId": number, "isTrue": boolean }` |
| DELETE | `/sentences/:id/concepts/:conceptId` | Unlink sentence from concept | - |

### Algorithms (`/api/algorithms`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/algorithms` | List all algorithms | - |
| GET | `/algorithms/:id` | Get algorithm by ID | - |
| POST | `/algorithms` | Create a new algorithm | `{ "name": "string" }` |
| PUT | `/algorithms/:id` | Update an algorithm | `{ "name": "string" }` |
| DELETE | `/algorithms/:id` | Delete an algorithm | - |
| GET | `/algorithms/:id/steps` | Get algorithm steps (ordered) | - |
| POST | `/algorithms/:id/steps` | Add step to algorithm | `{ "stepId": number, "orderNumber": number }` |
| DELETE | `/algorithms/:id/steps/:stepId` | Remove step from algorithm | - |

### Steps (`/api/steps`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/steps` | Create a new step | `{ "content": "string?", "algorithmId": number? }` |


## Troubleshooting

### Database Connection Refused

**Symptom:** `ECONNREFUSED` error when starting the server

**Solution:** Ensure Docker Desktop is running and the database container is started:

```bash
# Check if Docker is running
docker info

# Start the database
docker-compose up -d

# Verify container is running
docker-compose ps
```

### Database

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database logs
docker-compose logs -f mariadb

# Connect to database (via mysql client)
docker exec -it orbi-mariadb mysql -u orbi -porbi_secret orbi_dev

# Reset database (remove all data)
docker-compose down -v && docker-compose up -d
```

### Docker

```bash
# List running containers
docker ps

# View container logs
docker logs orbi-mariadb

# Execute command in container
docker exec -it orbi-mariadb <command>
```

## Additional Resources

- [Database Schema Script](./dbscript.md) - Raw SQL schema definition
