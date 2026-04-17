export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmCompletionRequest = {
  systemPrompt: string;
  messages: LlmMessage[];
  maxTokens?: number;
};

export type LlmCompletionResponse = {
  rawText: string;
};

export interface LlmProvider {
  readonly name: string;
  complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
