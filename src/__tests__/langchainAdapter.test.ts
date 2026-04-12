/**
 * Unit tests for OllamaLangChain adapter.
 * Mocks OllamaClient to verify adapter delegates prompts.
 */

import OllamaLangChain from '../orchestrator/langchainAdapter';
import { OllamaClient } from '../llm/ollamaAdapter';

jest.mock('../llm/ollamaAdapter');

const MockOllamaClient = OllamaClient as unknown as jest.Mock;

describe('OllamaLangChain adapter', () => {
  beforeEach(() => {
    MockOllamaClient.mockClear();
  });

  it('delegates call() to OllamaClient.generate', async () => {
    const mockGenerate = jest.fn().mockResolvedValue('mocked response');
    MockOllamaClient.mockImplementation(() => ({ generate: mockGenerate }));

    const adapter = new OllamaLangChain();
    const res = await adapter.call('Hello');

    expect(mockGenerate).toHaveBeenCalledWith('Hello', expect.any(Object));
    expect(res).toBe('mocked response');
  });

  it('generate() returns LangChain-compatible structure', async () => {
    const mockGenerate = jest.fn().mockResolvedValue('answer');
    MockOllamaClient.mockImplementation(() => ({ generate: mockGenerate }));

    const adapter = new OllamaLangChain({ temperature: 0.5 });
    const out = await adapter.generate(['prompt1', 'prompt2']);

    expect(out).toHaveProperty('generations');
    expect(out.generations[0][0].text).toBe('answer');
    expect(mockGenerate).toHaveBeenCalled();
  });
});
