Local PostgreSQL for development

Start Postgres for local development:

    docker compose -f docker-compose.postgres.yml up -d

Set DATABASE_URL and run migrations:

    export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatbot
    npx prisma migrate dev --name init

To stop/remove the container:

    docker compose -f docker-compose.postgres.yml down
