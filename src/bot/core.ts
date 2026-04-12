// Bot core: simple command parser and router
// TODO: wire to orchestrator tools per spec/soluton-design.md

export async function handleIncomingMessage(msg: any): Promise<any> {
  const text = (msg && (msg.text || msg.message?.text)) || '';
  const chatId = msg?.chat?.id ?? msg?.message?.chat?.id ?? null;
  const userId = msg?.from?.id ?? msg?.message?.from?.id ?? null;

  if (!text) {
    return { type: 'unknown', userId, chatId };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // /ask <question>
  if (lower.startsWith('/ask')) {
    const question = trimmed.replace(/^\/ask\b\s*/i, '');
    // TODO: call orchestrator.ask (see spec/soluton-design.md)
    return { type: 'ask', userId, chatId, question };
  }

  // /remind <time> <text>
  if (lower.startsWith('/remind')) {
    const payload = trimmed.replace(/^\/remind\b\s*/i, '');
    // TODO: parse human/ISO times and call orchestrator.setReminder
    return { type: 'remind', userId, chatId, raw: payload };
  }

  // /reminders summarize
  if (lower.startsWith('/reminders')) {
    const parts = trimmed.split(/\s+/);
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'summarize') {
      // TODO: call orchestrator.summarizeReminders
      return { type: 'reminders.summarize', userId, chatId };
    }
    return { type: 'reminders', userId, chatId, subcommand: sub };
  }

  // /time or /now
  if (lower.startsWith('/time') || lower.startsWith('/now')) {
    // TODO: call time tool (consider user's timezone)
    return { type: 'time', userId, chatId, time: new Date().toISOString() };
  }

  // /start or /help
  if (lower.startsWith('/start') || lower.startsWith('/help')) {
    const help = 'Available commands: /ask <q>, /remind <time> <text>, /reminders summarize, /time, /start, /help';
    return { type: 'help', userId, chatId, help };
  }

  // default: plain message
  return { type: 'message', userId, chatId, text: trimmed };
}
