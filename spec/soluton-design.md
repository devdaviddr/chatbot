# Solution Design — Telegram Chatbot Agent (Ollama gemma4:e4b + LangChain/LangGraph)

Date: 2026-04-12
Version: 0.1 (spec)

Overview
--------
This document is a spec-driven development (SDD) style solution design for a TypeScript Node.js Telegram chatbot agent. The bot uses an on-prem/local LLM via Ollama (model: `gemma4:e4b`) and an orchestration layer (LangChain or LangGraph) to implement: Q&A, reminders (create/list/summarise), and a current time tool. The service must be dockerizable and resilient enough for production with a clear MVP and upgrade path.

Goals
-----
- Allow Telegram users to ask questions answered by the local LLM.
- Let users set reminders and receive deliveries when due.
- Provide a summarise-reminders capability powered by the LLM.
- Provide a current time command/tool.
- Be containerized for deployment; have a clear test plan and security practices.

Target users & User Stories (Acceptance Criteria)
------------------------------------------------
1) As a Telegram user I want to ask a question so I can get an LLM-powered answer.
   - Given a running bot, when I send `/ask What is X?`, then the bot replies with a concise answer within 10s.
   - Acceptance: message delivered to chat with < 2% error responses; fallback message if LLM fails.

2) As a Telegram user I want to set a reminder so I get notified later.
   - Given `/remind 2026-04-12T18:00:00Z Take meds`, the bot acknowledges and stores a reminder.
   - At scheduled time the bot sends the reminder to the same chat.
   - Acceptance: reminder persisted, acknowledged, and delivered within ±60 seconds of the target time.

3) As a Telegram user I want a summarised view of my reminders.
   - Given `/reminders summarize`, the bot returns a short summary (up to 5 bullets) of upcoming reminders.
   - Acceptance: summary produced by LLM using retrieved reminders within a 300 token prompt.

4) As a user I want to know current time.
   - Given `/time`, bot returns current server time in the user's timezone if known, otherwise UTC.
   - Acceptance: time shown in ISO-8601 and friendly format.

Core Features and Commands
--------------------------
- /ask <question>
  - Example: `/ask What is the capital of Brazil?`
  - Payload (internal): { type: 'ask', userId, chatId, text }
  - Response: text answer from LLM.

- /remind <ISO8601|natural> <text>
  - Examples:
    - `/remind 2026-04-12T18:00:00Z Take meds`
    - `/remind in 45m Call Alice`
  - Internal payload: { type: 'remind', userId, chatId, dueAt: ISO8601, timezone?, text, recurrence? }
  - Acknowledgement: "Reminder set for 2026-04-12T18:00:00Z"

- /reminders summarize
  - Internal payload: { type: 'reminders.summarize', userId, chatId }
  - Response: LLM-generated summary using retrieved reminders.

- /time (or /now)
  - Payload: { type: 'time', userId, chatId }
  - Response: current time and timezone info.

High-level Architecture
-----------------------
Components:
- Telegram Adapter (webhook or long-poller)
  - Receives updates, normalizes into internal command messages.
- Bot Core (command handler)
  - Parse commands, validate, orchestrate calls to tools or LLM.
- Orchestration Layer (LangChain or LangGraph)
  - Coordinates tool use (setReminder, summariseReminders, currentTime) and LLM calls.
- LLM Adapter for Ollama
  - Encapsulates HTTP calls to Ollama (`gemma4:e4b`) and applies prompt templates.
- Memory Store
  - Short-term conversational buffer and optional persistent facts store.
- Reminders Store (persistent)
  - PostgreSQL for MVP (recommended), optional Redis for scale.
- Background Scheduler / Worker
  - Responsible for reliable reminder deliveries.
- Optional Job Queue (BullMQ/RSMQ) and Redis for production schedules.
- API/Health/Telemetry
  - HTTP endpoints for health checks, metrics.

Textual Sequence Diagrams
-------------------------
1) Question -> Answer
User -> Telegram Adapter: `/ask What is X?`
Telegram Adapter -> Bot Core: normalized command
Bot Core -> Orchestrator: askTool(question)
Orchestrator -> LLM Adapter: generate(prompt)
LLM Adapter -> Ollama (gemma4:e4b): HTTP POST /api/generate
Ollama -> LLM Adapter: text response
Orchestrator -> Bot Core: answer
Bot Core -> Telegram Adapter: sendMessage(chatId, answer)
Telegram Adapter -> User: answer delivered

2) Set Reminder
User -> Telegram Adapter: `/remind in 10m Take break`
Telegram Adapter -> Bot Core: command
Bot Core -> Parser: parse relative time -> dueAt
Bot Core -> Reminders Store: insert reminder (pending)
Bot Core -> Scheduler: schedule job(dueAt, reminderId)
Bot Core -> Telegram Adapter: send ack
User <- Telegram Adapter: "Reminder set for <iso>"

3) Reminder Delivery
Scheduler -> Reminders Store: fetch due reminder(s)
Scheduler -> LLM Adapter (optional): formatReminder(reminder)
Scheduler -> Telegram Adapter: sendMessage(chatId, reminder text)
Reminders Store: mark delivered

Data Models
-----------
Reminder (JSON / DB schema)
- id: string (UUID)
- userId: string
- chatId: string
- text: string
- dueAt: string (ISO8601)
- timezone?: string
- recurrence?: string | null (cron or rfc5545)
- createdAt: string
- delivered: boolean
- deliveredAt?: string
- metadata?: JSON

MemoryEntry (for short-term / persistent memory)
- id: string
- userId: string
- content: string
- role: 'user' | 'assistant' | 'system'
- embedding?: blob (optional)
- createdAt: string
- expiresAt?: string

Config / Env vars
- TELEGRAM_BOT_TOKEN (required)
- TELEGRAM_MODE = "polling" | "webhook" (default polling)
- TELEGRAM_WEBHOOK_URL (if webhook)
- PORT (HTTP server)
- OLLAMA_URL (default http://localhost:11434)
- OLLAMA_MODEL (default gemma4:e4b)
- OLLAMA_TEMPERATURE (0.0..1.0, default 0.0)
- OLLAMA_MAX_TOKENS (default 512)
- DATABASE_URL (postgres://user:pass@host:5432/dbname). For local dev: postgres://localhost:5432/<db>
- REDIS_URL (for queue/scheduler)
- SCHEDULER_TYPE = inproc | bullmq | cron (default inproc)
- NODE_ENV

LLM Integration (Ollama gemma4:e4b)
---------------------------------
- Endpoint: ${OLLAMA_URL:-http://localhost:11434}/api/generate
- Use model: OLLAMA_MODEL (gemma4:e4b)
- Recommended settings:
  - temperature: 0.0 for deterministic answers, 0.2-0.7 for creative tasks
  - max_new_tokens / max_tokens: 512 (configurable)
  - top_p / top_k: optional if Ollama supports
- Node example (pseudo):

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, temperature, max_new_tokens: maxTokens })
  });
  const json = await res.json();
  return json.output_text || json[0]?.content;

- Prompt templates
  - System prompt (always first):
    "You are a concise, helpful, safe assistant. If asked to create or summarize reminders, keep output short, numbered, and include ISO timestamps. Do not perform actions outside the bot's capabilities."

  - User prompt (QA):
    "User asked: <question>\nAnswer concisely with references when relevant. If you cannot answer, say 'I don't know; try rephrasing.'"

  - Summarise reminders:
    "Given the following reminders for user <userId>:\n<reminder list as bullet lines>\nProvide a short summary: up to 5 bullets, with due date ISO and friendly label."

- Safety & Filtering
  - Apply a system-level safety prompt that instructs the model to refuse unsafe/illegal instructions.
  - Optionally run a light content filter before sending messages to users (block PII/leakage).

Memory Design
-------------
- Short-term (session) memory:
  - In-memory ring buffer per chat (last N messages, e.g., 20) used for context windows.
  - TTL: expires after inactivity (e.g., 30 minutes).
- Persistent memory:
  - PostgreSQL for MVP (persistent) storing facts/notes and reminders.
  - Redis for high-throughput retrieval or if using embeddings and similarity search.
- Eviction / TTL:
  - Session buffers evicted by LRU or TTL.
  - Persistent memory only evicted by retention policy or manual deletion.
- Embeddings (optional):
  - If implementing semantic retrieval, store embeddings and use a vector store (Redis or Postgres with pgvector + faiss) for retrieval.

Tools Design
------------
1) setReminderTool(parsedTime, text, userId, chatId)
   - Validate time, create DB row, schedule job with scheduler, return ack.

2) summariseRemindersTool(userId)
   - Retrieve upcoming reminders (limit N), format as a bullet list, call LLM summarise prompt, return summary.

3) currentTimeTool(userTimezone?)
   - Return ISO timestamp and friendly formatting. Used by user command and for formatting reminders.

Scheduling / Reminders Reliability
----------------------------------
Options:
- In-process scheduler (MVP)
  - Pros: simple, no extra infra.
  - Cons: lost scheduled jobs on crash; requires rehydration on restart.
  - Implementation: persist reminders; on startup load all undelivered reminders and schedule setTimeouts/cron jobs.

- Job queue with Redis (BullMQ)
  - Pros: durable jobs, retry, delayed jobs, monitoring.
  - Cons: extra infra (Redis) required.
  - Implementation: push delayed job to Redis; worker executes and marks delivered.

- Cron / External scheduler
  - Use for recurring jobs or external orchestration.

Recommendation: MVP: in-process scheduler with DB persistence + startup rehydration. Production: BullMQ + Redis.

Reliability considerations:
- Persist all reminders before acknowledging to user.
- On startup, rehydrate pending reminders and schedule them.
- For at-least-once delivery: mark delivered only after successful Telegram send; allow idempotency check.
- For heavy scale use timezone-aware scheduling and sharding workers.

Dockerization
-------------
- Containerize the Node app.
- Optionally include redis/docker-compose for local development.
- Volumes:
  - Postgres data stored in a named volume (e.g., postgres_data:/var/lib/postgresql/data).
- Ports:
  - Expose PORT (3000) for webhook/poller health and webhook receiver.
- Multi-stage Dockerfile outline:
  - Stage 1 (builder): node:20-alpine, install deps, tsc build
  - Stage 2 (runtime): node:20-alpine, copy dist, install only prod deps, set NODE_ENV=production, ENTRYPOINT node ./dist/index.js
- docker-compose.yml (dev):
  - services: app, redis (optional), ollama (if running in container), telegram-proxy (for webhook testing)

Testing Plan
------------
- Unit tests (Jest): adapters (Telegram, Ollama), parsers (time parser), scheduler logic.
- Integration tests:
  - Mock Ollama responses (nock) and test orchestration flows.
  - Simulate reminder lifecycle: set -> persist -> deliver.
- E2E / acceptance tests:
  - Use a test Telegram bot and run end-to-end flows in CI optionally behind mock server.
- CI checks:
  - lint, typecheck, build, test, Docker build (smoke), security linting.

Security & Secrets Management
----------------------------
- Do NOT commit secrets. Use env vars and Docker secrets (or Kubernetes secrets) in production.
- For CI, store TELEGRAM_BOT_TOKEN and other secrets in GitHub Actions secrets.
- Restrict network access to Ollama (localhost or internal network).
- Limit model outputs via system prompt and optional content filter.

Milestones & Acceptance Criteria
-------------------------------
M1 - MVP: Telegram connectivity + LLM QA
  - Bot responds to `/ask` using Ollama and returns a coherent answer.
  - Tests: unit tests for LLM adapter + integration test mocking Ollama.

M2 - Reminders: create + delivery
  - User can set reminders; reminders persist; delivery occurs when due.
  - Tests: integration test for persist+delivery.

M3 - Summarise reminders & current time tool
  - `/reminders summarize` returns LLM summary; `/time` returns current time.

M4 - Dockerize & CI
  - App builds in container; compose file for local dev; CI runs tests and builds image.

Files to be created (implementation phase)
-----------------------------------------
- src/index.ts (app bootstrap)
- src/telegrams/adapter.ts (polling/webhook wrapper)
- src/bot/core.ts (command router)
- src/llm/ollamaAdapter.ts (HTTP client + prompt templates)
- src/orchestrator/langchain.ts OR src/orchestrator/langgraph.ts
- src/reminders/store.ts (postgres/orm access)
- src/scheduler/inproc.ts and src/scheduler/bullmq.ts
- src/memory/* (session buffer, persistent memory adapter)
- src/tools/setReminder.ts, summariseReminders.ts, timeTool.ts
- Dockerfile, docker-compose.yml
- tests/* (unit + integration)

Pseudocode snippets
-------------------
Telegram handler (simplified):

  async function onUpdate(update) {
    const cmd = parse(update.message.text)
    switch (cmd.type) {
      case 'ask':
        const answer = await orchestrator.ask(cmd.text, {userId, chatId})
        await telegram.sendMessage(chatId, answer)
        break
      case 'remind':
        const reminder = await reminders.create({userId, chatId, text, dueAt})
        scheduler.schedule(reminder)
        await telegram.sendMessage(chatId, `Reminder set for ${reminder.dueAt}`)
        break
    }
  }

LLM call (simplified):

  async function generate(prompt, opts) {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, { method: 'POST', body: JSON.stringify({ model: OLLAMA_MODEL, prompt, temperature: opts.temp }) })
    // parse response
    return parsedText
  }

Open Questions & Tradeoffs
--------------------------
- LangChain vs LangGraph: both can orchestrate tools; pick based on team familiarity. LangChain has more mature JS ecosystem; LangGraph may offer a different graph-based orchestration. Decision deferred to implementation.
- Scheduler: in-process is simplest but less reliable. For production, prefer BullMQ + Redis.
- Persistence: Postgres recommended for MVP; Redis for caching/queues and scale.
- Webhook vs Polling: Polling easier for containers without public HTTPS; webhooks are preferable in production behind an ingress with TLS.

Appendix: Acceptance Test Examples
---------------------------------
- QA test: send `/ask Who wrote 1984?` -> expect reply includes "George Orwell".
- Reminder test: `/remind in 1m Short test` -> bot acknowledges -> after ~1 minute user receives message.
- Summarise test: after creating 3 reminders, `/reminders summarize` returns 3 bullets.



