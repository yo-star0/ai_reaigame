import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from '@langchain/aws';
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
export class BedrockProvider implements LlmProvider {
  readonly name = 'bedrock';
  private readonly logger = new Logger(BedrockProvider.name);
  private readonly chat: ChatBedrockConverse;

  constructor(config: ConfigService) {
    const region = config.get<string>('AWS_REGION') ?? 'ap-northeast-1';
    const modelId = config.get<string>('BEDROCK_MODEL_ID') ?? 'anthropic.claude-sonnet-4-20250514-v1:0';

    this.chat = new ChatBedrockConverse({
      region,
      model: modelId,
      maxTokens: 512,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
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
    this.logger.debug(`bedrock reply length=${text.length}`);
    return { rawText: text };
  }
}
