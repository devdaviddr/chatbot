export class OllamaClient {
  // In real code this would call the Ollama HTTP API. For tests we'll mock generate().
  async generate(prompt: string): Promise<string> {
    return `Generated: ${prompt}`;
  }
}

export async function ask(client: OllamaClient, prompt: string): Promise<string> {
  return client.generate(prompt);
}
