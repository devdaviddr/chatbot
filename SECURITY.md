# Secret management and required environment variables

This document lists required environment variables for this project and recommended secret management practices for local development, CI (GitHub Actions), Docker, and cloud deployments.

## Required environment variables

- TELEGRAM_BOT_TOKEN
  - Description: Telegram bot token used to authenticate with Telegram's Bot API.
  - Example: TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPqRstUvwxYZ

- DATABASE_URL
  - Description: Primary database connection string (Postgres example).
  - Example: DATABASE_URL=postgres://dbuser:strongpass@db.example.com:5432/chatbot_db

- OLLAMA_URL
  - Description: URL for the Ollama server (local or remote).
  - Example: OLLAMA_URL=http://localhost:11434

- OLLAMA_MODEL
  - Description: Model identifier to use with the Ollama server.
  - Example: OLLAMA_MODEL=llama2-13b

- OLLAMA_API_KEY (if your Ollama deployment requires API keys)
  - Description: API key for Ollama (optional depending on deployment).
  - Example: OLLAMA_API_KEY=sk-abcdef0123456789

- REDIS_URL
  - Description: Redis connection string used for caching or job queues.
  - Example: REDIS_URL=redis://:strongpass@redis.example.com:6379/0

- SCHEDULER_TYPE
  - Description: Which scheduler backend to use (e.g., `memory`, `redis`).
  - Example: SCHEDULER_TYPE=redis

- NODE_ENV
  - Description: Node environment (development | production | test).
  - Example: NODE_ENV=production


## Local development (.env)

- Keep secrets out of version control by using a local `.env` file and loading it with dotenv (or your preferred loader).
- Add `.env` to `.gitignore` (example below).
- Add a `.env.example` to the repo with keys but no secret values so new developers know what keys are required.

Example `.env.example` (do NOT commit real secrets):

```
TELEGRAM_BOT_TOKEN=
DATABASE_URL=postgres://user:pass@host:5432/dbname
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=
OLLAMA_API_KEY=
REDIS_URL=redis://localhost:6379/0
SCHEDULER_TYPE=memory
NODE_ENV=development
```

Recommended `.gitignore` snippet:

```
# Local env files
.env
.env.local
secrets/
```

Loading environment variables in Node (example):

```js
require('dotenv').config();
// process.env.TELEGRAM_BOT_TOKEN, etc.
```

## GitHub Actions

- Store secrets in the repository (or organization) Secrets settings.
- Reference secrets in workflows using `${{ secrets.YOUR_SECRET }}`.

Example workflow snippet:

```yaml
env:
  NODE_ENV: production
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  OLLAMA_API_KEY: ${{ secrets.OLLAMA_API_KEY }}
  REDIS_URL: ${{ secrets.REDIS_URL }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: npm ci
      - name: Run tests
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm test
```

Notes:
- Prefer ephemeral or short-lived tokens where possible.
- Use repository-level secrets, environment secrets, or organization secrets with appropriate access controls.

## Docker secrets and docker-compose example

- Docker "secrets" are designed for Docker Swarm / Docker Enterprise. With docker-compose you can still define secrets and they will be mounted into the container at `/run/secrets/<secret_name>`.
- Avoid embedding secrets in image layers or passing them directly via `build-arg`.

Example `docker-compose.yml` snippet (v3.7+):

```yaml
version: '3.7'
services:
  app:
    image: myorg/chatbot:latest
    deploy:
      replicas: 1
    secrets:
      - telegram_bot_token
      - database_url
    command: sh -c "export TELEGRAM_BOT_TOKEN=$(cat /run/secrets/telegram_bot_token) && export DATABASE_URL=$(cat /run/secrets/database_url) && node dist/index.js"

secrets:
  telegram_bot_token:
    file: ./secrets/telegram_bot_token.txt
  database_url:
    file: ./secrets/database_url.txt
```

Create Docker secret files (example):

```
mkdir -p secrets
printf "%s" "<your-telegram-token>" > secrets/telegram_bot_token.txt
printf "%s" "postgres://user:pass@host:5432/db" > secrets/database_url.txt
```

Note: `docker secret create` requires Docker Swarm. For non-Swarm single-host deployments consider a secrets volume with strict permissions and ensure the host is secured.

## Cloud secret managers

Recommended providers:
- AWS Secrets Manager or Parameter Store (with IAM roles)
- Google Cloud Secret Manager (with service accounts)
- Azure Key Vault
- HashiCorp Vault (self-hosted or managed)

Use the provider's SDK/clients to fetch secrets at runtime and rely on instance metadata/roles rather than embedding long-lived credentials.

## Best practices

- Never commit secrets to Git. If a secret is accidentally committed, rotate it immediately.
- Rotate secrets regularly and use short-lived credentials when possible.
- Principle of least privilege: grant only the permissions the app needs.
- Audit access to secrets and restrict who can read/change them.
- Do not print secrets to logs; sanitize or mask sensitive output.
- Use separate credentials per environment (dev/staging/prod).

## If a secret is leaked

1. Revoke/rotate the leaked secret immediately.
2. Replace with a new secret and update deployments and CI.
3. Scrub the secret from the repository history (tools: git-filter-repo or BFG) and notify stakeholders.

---

If you need, I can also add a `.env.example` file or update `.gitignore` to include `.env` in this commit.
