/**
 * Minimal LangChain adapter wrapping OllamaClient into a LangChain-compatible LLM.
 * Note: LangChain API evolves; this adapter implements call() and generate() which
 * cover common usages (LLMChain.call and LLMChain.generate). Adjust if your langchain
 * version requires different interfaces.
 */

import { OllamaClient } from '../llm/ollamaAdapter';

export interface OllamaLangChainOptions {
  client?: OllamaClient;
  temperature?: number;
}

export class OllamaLangChain {
  client: OllamaClient;
  temperature?: number;

  constructor(opts?: OllamaLangChainOptions) {
    this.client = opts?.client ?? new OllamaClient();
    this.temperature = opts?.temperature;
  }

  // Simple call API: returns generated text
  async call(prompt: string): Promise<string> {
    return this.client.generate(prompt, { temperature: this.temperature } as any);
  }

  // generate API compatible with some LangChain versions: returns { generations: [[{ text }]] }
  async generate(prompts: string[] | any): Promise<any> {
    const joined = Array.isArray(prompts) ? prompts.join('\n') : String(prompts);
    const text = await this.call(joined);
    return {
      generations: [
        [
          {
            text,
          },
        ],
      ],
    };
  }
}

export default OllamaLangChain;
