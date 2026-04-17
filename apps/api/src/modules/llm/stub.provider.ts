import { Injectable } from '@nestjs/common';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

@Injectable()
export class StubProvider implements LlmProvider {
  readonly name = 'stub';

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const last = req.messages[req.messages.length - 1]?.content ?? '';
    const reply =
      last.length > 0
        ? `（スタブ応答）「${last.slice(0, 24)}」って言ってくれて嬉しいな。`
        : '（スタブ応答）どうしたの？';
    const affinityDelta = last.includes('本') || last.includes('星') ? 3 : 1;
    const json = JSON.stringify({ reply, affinity_delta: affinityDelta });
    return { rawText: json };
  }
}
