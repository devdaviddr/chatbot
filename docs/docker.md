# Docker

Build and run the production image:

```
docker build -t chatbot:latest .
docker run -e DATABASE_URL=... -e TELEGRAM_BOT_TOKEN=... -p 3000:3000 chatbot:latest
```

Set DATABASE_URL and TELEGRAM_BOT_TOKEN environment variables for the app.
