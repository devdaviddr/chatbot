/*
 * OllamaClient — simple Ollama HTTP client adapter for gemma4:e4b
 *
 * Usage example:
 * const client = new OllamaClient();
 * const answer = await client.generate("What is the capital of France?");
 */

import { fetch as undiciFetch } from 'undici';

export class OllamaClient {
  private baseUrl: string;
  private model: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(opts?: { baseUrl?: string; model?: string }) {
    this.baseUrl = opts?.baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434';
    this.model = opts?.model ?? process.env.OLLAMA_MODEL ?? 'gemma4:e4b';
    this.defaultTemperature = process.env.OLLAMA_TEMPERATURE ? parseFloat(process.env.OLLAMA_TEMPERATURE) : 0.0;
    this.defaultMaxTokens = process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS, 10) : 512;
  }

  private getFetch(): typeof fetch {
    // Prefer global fetch (Node 20+ or test mocks), fall back to undici's fetch
    if (typeof globalThis.fetch === 'function') return (globalThis.fetch as any).bind(globalThis);
    if (typeof undiciFetch === 'function') return undiciFetch as unknown as typeof fetch;
    throw new Error('No fetch available. Install undici or run on Node 20+');
  }

  async generate(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const temperature =
      options?.temperature ?? (process.env.OLLAMA_TEMPERATURE ? parseFloat(process.env.OLLAMA_TEMPERATURE) : this.defaultTemperature);
    const maxTokens = options?.maxTokens ?? (process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS as string, 10) : this.defaultMaxTokens);

    const url = `${this.baseUrl.replace(/\/+$/, '')}/api/generate`;
    const body = {
      model: this.model,
      prompt,
      temperature,
      // Ollama accepts max_new_tokens / max_tokens depending on version; prefer max_new_tokens
      max_new_tokens: maxTokens
    } as any;

    const fetchFn = this.getFetch();
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    } as any);

    if (!res || !res.ok) {
      const txt = res && typeof res.text === 'function' ? await res.text() : '';
      throw new Error(`Ollama request failed ${res?.status ?? 'unknown'}: ${txt}`);
    }

    let data: any;
    try {
      data = typeof res.json === 'function' ? await res.json() : undefined;
    } catch (err) {
      const txt = typeof res.text === 'function' ? await res.text() : String(err);
      throw new Error(`Failed to parse Ollama response as JSON: ${txt}`);
    }

    // Flexible parsing to support different Ollama response shapes
    if (typeof data === 'string') return data;
    if (!data) return '';

    if (typeof data.output_text === 'string') return data.output_text;

    if (Array.isArray(data)) {
      const pieces = data.map((d: any) => d?.content ?? d?.output_text ?? d?.text ?? d?.generated_text ?? '').filter(Boolean);
      if (pieces.length) return pieces.join('');
    }

    if (Array.isArray(data.results) && data.results.length && typeof data.results[0].content === 'string') {
      return data.results[0].content;
    }

    if (data.choices && Array.isArray(data.choices) && typeof data.choices[0].text === 'string') {
      return data.choices[0].text;
    }

    // Try some common first-item shapes
    const maybeFirst = (data as any)[0] ?? (data as any).result ?? null;
    if (maybeFirst && (maybeFirst.content || maybeFirst.text || maybeFirst.output_text)) {
      return maybeFirst.content ?? maybeFirst.text ?? maybeFirst.output_text;
    }

    // Last resort: stringify
    try {
      return JSON.stringify(data);
    } catch (e) {
      return String(data);
    }
  }
}
