import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly chat: ChatGoogleGenerativeAI;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required for GeminiProvider');
    }
    this.chat = new ChatGoogleGenerativeAI({
      apiKey,
      model: config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash',
      maxOutputTokens: 512,
    });
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const messages: BaseMessage[] = [new SystemMessage(req.systemPrompt)];
    for (const m of req.messages) {
      if (m.role === 'user') messages.push(new HumanMessage(m.content));
      else if (m.role === 'assistant') messages.push(new AIMessage(m.content));
    }
    const res = await this.chat.invoke(messages);
    const text = typeof res.content === 'string'
      ? res.content
      : res.content
          .map((c) => (typeof c === 'string' ? c : 'text' in c ? c.text : ''))
          .join('');
    this.logger.debug(`langchain-gemini reply length=${text.length}`);
    return { rawText: text };
  }
}
