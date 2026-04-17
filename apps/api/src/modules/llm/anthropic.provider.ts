import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for AnthropicProvider');
    }
    this.client = new Anthropic({ apiKey });
    this.model = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 512,
      system: req.systemPrompt,
      messages: req.messages
        .filter((m): m is { role: 'user' | 'assistant'; content: string } => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    });
    const text = res.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
    this.logger.debug(`anthropic reply length=${text.length}`);
    return { rawText: text };
  }
}
