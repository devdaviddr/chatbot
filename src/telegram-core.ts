export type ParsedCommand = { command: string; args: string };

export function parseTelegramCommand(text: string): ParsedCommand | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;
  const [first, ...rest] = trimmed.split(' ');
  const command = first.slice(1);
  const args = rest.join(' ').trim();
  return { command, args };
}

export function parseAsk(text: string): string | null {
  const parsed = parseTelegramCommand(text);
  if (!parsed) return null;
  if (parsed.command !== 'ask') return null;
  return parsed.args;
}
