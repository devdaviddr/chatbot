# Prisma / Migrations

This project uses Prisma with PostgreSQL for persistence.

To run migrations once you have a Postgres instance available:

1. Set your DATABASE_URL environment variable (example in prisma/.env.example):

   DATABASE_URL="postgresql://postgres:password@postgres:5432/chatbot"

2. Run migrations and generate the client:

   DATABASE_URL="$DATABASE_URL" npx prisma migrate dev --name init
   npx prisma generate

Note: Do NOT run migrations against a production database without review. In this task we only create the schema and run `prisma generate` locally.
