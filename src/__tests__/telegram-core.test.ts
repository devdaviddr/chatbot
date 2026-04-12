import { parseTelegramCommand, parseAsk } from '../telegram-core';

describe('telegram-core', () => {
  test('parses /ask command', () => {
    const parsed = parseTelegramCommand('/ask What is the capital of Brazil?');
    expect(parsed).not.toBeNull();
    expect(parsed!.command).toBe('ask');
    expect(parsed!.args).toBe('What is the capital of Brazil?');
  });

  test('parseAsk returns only args for /ask', () => {
    const args = parseAsk('/ask Who wrote 1984?');
    expect(args).toBe('Who wrote 1984?');
  });
});
