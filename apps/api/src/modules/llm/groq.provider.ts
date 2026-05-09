import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

@Injectable()
export class GroqProvider implements LlmProvider {
  readonly name = 'groq';
  private readonly logger = new Logger(GroqProvider.name);
  private readonly model: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY is required for GroqProvider');
    this.apiKey = key;
    this.model = config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const messages = [
      { role: 'system', content: req.systemPrompt },
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 512,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Groq API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as any;
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    this.logger.debug(`Groq reply length=${text.length}`);
    return { rawText: text };
  }
}
