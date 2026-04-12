// Telegram polling adapter using node-telegram-bot-api
// Keeps runtime require inside start() so importing this module is side-effect free for tests.
export type MessageHandler = (msg: any) => Promise<void>;

export class TelegramAdapter {
  private token: string;
  private opts: any;
  private bot: any | null = null;
  private handler?: MessageHandler;

  constructor(token: string, opts?: any) {
    this.token = token;
    this.opts = opts || {};
  }

  async start(): Promise<void> {
    if (!this.token) throw new Error('TELEGRAM token required');
    const polling = (this.opts?.mode ?? process.env.TELEGRAM_MODE) !== 'webhook';
    // require at runtime to avoid import-time side effects in tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TelegramBot = require('node-telegram-bot-api');
    this.bot = new TelegramBot(this.token, { polling });

    this.bot.on('message', async (msg: any) => {
      try {
        if (this.handler) await this.handler(msg);
      } catch (err) {
        console.error('TelegramAdapter handler error', err);
      }
    });

    console.log('TelegramAdapter started (polling=%s)', polling);
  }

  async stop(): Promise<void> {
    if (!this.bot) return;
    try {
      if (typeof this.bot.stopPolling === 'function') {
        // some versions of the lib return void; support promise/void
        await this.bot.stopPolling();
      }
      this.bot = null;
    } catch (err) {
      console.error('Failed stopping Telegram bot', err);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handler = handler;
  }

  async sendMessage(chatId: string | number, text: string, opts?: any): Promise<any> {
    if (!this.bot) throw new Error('Bot not started');
    return this.bot.sendMessage(chatId, text, opts);
  }
}
