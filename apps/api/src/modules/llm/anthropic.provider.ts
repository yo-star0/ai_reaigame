import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
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
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly chat: ChatAnthropic;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for AnthropicProvider');
    }
    this.chat = new ChatAnthropic({
      apiKey,
      model: config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6',
      maxTokens: 512,
    });
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const messages: BaseMessage[] = [new SystemMessage(req.systemPrompt)];
    for (const m of req.messages) {
      if (m.role === 'user') messages.push(new HumanMessage(m.content));
      else if (m.role === 'assistant') messages.push(new AIMessage(m.content));
    }
    const res = await this.chat.invoke(messages, {
      configurable: { maxTokens: req.maxTokens ?? 512 },
    });
    const text = typeof res.content === 'string'
      ? res.content
      : res.content
          .map((c) => (typeof c === 'string' ? c : 'text' in c ? c.text : ''))
          .join('');
    this.logger.debug(`langchain-anthropic reply length=${text.length}`);
    return { rawText: text };
  }
}
