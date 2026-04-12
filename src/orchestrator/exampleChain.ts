/**
 * Minimal example showing how to use LangChain PromptTemplate + LLMChain with OllamaLangChain.
 *
 * NOTE: LangChain JS API changes across versions. This example dynamically imports langchain
 * to remain compatible across versions. Adjust TODOs if you rely on a specific langchain API.
 */

import OllamaLangChain from './langchainAdapter';

export async function runExampleChain() {
  // Try to dynamically import langchain to avoid static type/import errors across versions
  let PromptTemplate: any = null;
  let LLMChain: any = null;
  try {
    const lc: any = await import('langchain');
    // try common export shapes
    PromptTemplate = lc.PromptTemplate ?? lc.prompts?.PromptTemplate ?? lc.default?.PromptTemplate ?? lc.PromptTemplate;
    LLMChain = lc.LLMChain ?? lc.chains?.LLMChain ?? lc.default?.LLMChain ?? lc.LLMChain;
  } catch (err) {
    // If langchain is not available or has a different API surface, we bail out gracefully.
    // TODO: If you depend on a specific langchain version, replace this dynamic import
    // with the exact imports for that version (e.g., import { PromptTemplate } from 'langchain/prompts').
    console.warn('langchain import failed or is incompatible; exampleChain will not run in this environment', err);
    return null;
  }

  // Create LLM adapter
  const llm = new OllamaLangChain();

  // Construct prompt and chain using whatever constructors we found
  const PromptCtor = PromptTemplate as any;
  const prompt = new (PromptCtor)({ template: 'Q: {question}\nA:', inputVariables: ['question'] });

  const ChainCtor = LLMChain as any;
  const chain = new (ChainCtor)({ llm: llm as any, prompt: prompt as any });

  // Execute chain
  // Note: return shape varies by langchain version (some return { text }, others return { output } )
  const result = await chain.call({ question: 'What is the capital of France?' });

  console.log('Example chain result:', result);
  return result;
}
