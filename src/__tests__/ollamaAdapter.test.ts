import { OllamaClient } from '../llm/ollamaAdapter';

describe('OllamaClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // cleanup mocked fetch
    try {
      delete (globalThis as any).fetch;
    } catch (e) {}
  });

  test('parses output_text field', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ output_text: 'hello' }),
      text: async () => 'hello'
    });

    const c = new OllamaClient({ baseUrl: 'http://localhost:11434', model: 'gemma4:e4b' });
    const res = await c.generate('prompt');
    expect(res).toBe('hello');
  });

  test('parses array content field', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ content: 'world' }],
      text: async () => '[...]'
    });

    const c = new OllamaClient();
    const res = await c.generate('prompt');
    expect(res).toBe('world');
  });

  test('parses choices.text field', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ text: 'bye' }] }),
      text: async () => 'bye'
    });

    const c = new OllamaClient();
    const res = await c.generate('prompt');
    expect(res).toBe('bye');
  });

  test('throws on non-ok status', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error'
    });

    const c = new OllamaClient();
    await expect(c.generate('prompt')).rejects.toThrow('Ollama request failed');
  });
});
