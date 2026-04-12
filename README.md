# Chatbot — Telegram LLM Agent

Project overview
----------------
This repository contains a TypeScript Node.js Telegram chatbot agent that uses a local LLM (Ollama) to provide Q&A and reminder functionality. See spec/soluton-design.md for full design and architecture.

Prerequisites
-------------
- Node.js 20
- Docker & Docker Compose
- (Optional) Ollama installed locally for on-prem LLM usage

Quickstart
----------
1. Install dependencies:

   npm ci

2. Copy environment example and edit as needed:

   cp .env.example .env

3. Start Postgres for local development:

   docker compose -f docker-compose.postgres.yml up -d

4. Set DATABASE_URL in your .env if needed (example):

   DATABASE_URL=postgres://postgres:postgres@localhost:5432/chatbot

5. Run in development mode:

   npm run dev

Available scripts
-----------------
- npm run build   # compile TypeScript (tsc)
- npm start       # run compiled app (node dist/index.js)
- npm run dev     # run via ts-node for local development
- npm test        # run tests (jest)
- npm run lint    # run eslint

Environment variables
---------------------
Common env vars used by the app (see spec for details):
- TELEGRAM_BOT_TOKEN (required)
- TELEGRAM_MODE (polling|webhook)
- TELEGRAM_WEBHOOK_URL
- PORT
- OLLAMA_URL (default: http://localhost:11434)
- OLLAMA_MODEL (default: gemma4:e4b)
- OLLAMA_TEMPERATURE
- OLLAMA_MAX_TOKENS
- DATABASE_URL (postgres://user:pass@host:5432/dbname)
- REDIS_URL
- SCHEDULER_TYPE (inproc|bullmq|cron)
- NODE_ENV

Running with Docker
-------------------
To build and run the app in a container:

1. Build the image:

   docker build -t chatbot .

2. Run with environment variables (example):

   docker run --rm -e DATABASE_URL="$DATABASE_URL" -e TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" -p 3000:3000 chatbot

For local development with Postgres, first run the provided docker compose for Postgres:

   docker compose -f docker-compose.postgres.yml up -d

CI and tests
------------
- Run tests locally:

  npm test

- Recommended CI steps:
  1. lint
  2. build (typecheck)
  3. test
  4. docker build (optional smoke)

Notes on Ollama
---------------
This project expects a local Ollama instance for the LLM adapter. Default endpoint: http://localhost:11434 (OLLAMA_URL). Install and run Ollama locally or configure OLLAMA_URL to point to your Ollama server.

More information
----------------
- Full design and requirements: spec/soluton-design.md

License
-------
MIT
