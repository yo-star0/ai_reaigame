import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

@Injectable()
export class OllamaProvider implements LlmProvider {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.model = config.get<string>('OLLAMA_MODEL') ?? 'llama3';
    this.baseUrl = config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const messages = [
      { role: 'system', content: req.systemPrompt },
      ...req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    try {
      this.logger.debug(`Sending request to Ollama (${this.model}) at ${this.baseUrl}...`);
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const text = data?.message?.content ?? '';
      
      this.logger.debug(`Ollama reply length=${text.length}`);
      return { rawText: text };
    } catch (error) {
      this.logger.error(`Ollama request failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
