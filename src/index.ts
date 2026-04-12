import http from 'http';
import { TelegramAdapter } from './telegrams/adapter';
import { handleIncomingMessage } from './bot/core';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_MODE = process.env.TELEGRAM_MODE || 'polling';

export async function startServer(): Promise<void> {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_MODE !== 'webhook') {
    const adapter = new TelegramAdapter(TELEGRAM_BOT_TOKEN, { mode: TELEGRAM_MODE });
    await adapter.start();

    adapter.onMessage(async (msg: any) => {
      try {
        const parsed = await handleIncomingMessage(msg);
        const chatId = msg?.chat?.id ?? msg?.message?.chat?.id;
        if (!chatId) return;

        switch (parsed.type) {
          case 'ask':
            await adapter.sendMessage(chatId, 'Handler not implemented yet for /ask');
            break;
          case 'help':
            await adapter.sendMessage(chatId, parsed.help || 'Help');
            break;
          default:
            await adapter.sendMessage(chatId, `Received command: ${parsed.type}`);
        }
      } catch (err) {
        console.error('Error handling incoming message', err);
      }
    });

    console.log(`Telegram adapter started in mode=${TELEGRAM_MODE}`);
  } else {
    console.log('Telegram bot not started (missing token or webhook mode)');
  }

  console.log(`App started on port ${PORT} in mode ${TELEGRAM_MODE}`);
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

