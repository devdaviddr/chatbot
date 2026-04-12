declare module 'langchain' {
  export class PromptTemplate {
    constructor(opts?: any);
  }
  export class LLMChain {
    constructor(opts?: any);
    call?(input: any): Promise<any>;
  }
  export default {};
}
