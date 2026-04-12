/**
 * Minimal example showing how to use LangChain PromptTemplate + LLMChain with OllamaLangChain.
 *
 * NOTE: LangChain JS API changes across versions. This example uses top-level PromptTemplate and LLMChain.
 * If your installed version exposes these from different paths, adjust imports accordingly.
 */

import { PromptTemplate, LLMChain } from 'langchain'; // TODO: adjust if your langchain version exports differently
import OllamaLangChain from './langchainAdapter';

export async function runExampleChain() {
  // Create LLM adapter
  const llm = new OllamaLangChain();

  // Create a simple prompt template
  const prompt = new (PromptTemplate as any)({
    template: 'Q: {question}\nA:',
    inputVariables: ['question'],
  });

  // Build a chain
  const chain = new (LLMChain as any)({ llm: llm as any, prompt: prompt as any });

  // Execute chain
  // Note: LLMChain.call often returns { text: '...' } or similar shape across versions.
  // We keep usage generic here.
  const result = await chain.call({ question: 'What is the capital of France?' });

  // Log and return
  console.log('Example chain result:', result);
  return result;
}
