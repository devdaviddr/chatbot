import { OllamaClient, ask } from '../llm';

describe('llm', () => {
  test('ask calls OllamaClient.generate and returns its result', async () => {
    const client = new OllamaClient();
    (client as any).generate = jest.fn().mockResolvedValue('Mocked LLM response');
    const res = await ask(client, 'Tell me a joke');
    expect((client as any).generate).toHaveBeenCalledWith('Tell me a joke');
    expect(res).toBe('Mocked LLM response');
  });
});
