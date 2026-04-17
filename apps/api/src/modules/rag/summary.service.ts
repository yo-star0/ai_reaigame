import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLM_PROVIDER, LlmProvider } from '../llm/llm.provider';

const RAW_TAIL = 6;
const SUMMARY_TRIGGER = 10;

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async updateIfNeeded(conversationId: string): Promise<void> {
    const total = await this.prisma.message.count({ where: { conversationId } });
    if (total < SUMMARY_TRIGGER) return;

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
    });

    const cutoff = total - RAW_TAIL;
    if (cutoff <= 0) return;

    let alreadyPos = 0;
    if (conversation.summaryUntilMessageId) {
      const m = await this.prisma.message.findUnique({
        where: { id: conversation.summaryUntilMessageId },
      });
      if (m) {
        alreadyPos = await this.prisma.message.count({
          where: { conversationId, createdAt: { lte: m.createdAt } },
        });
      }
    }
    if (alreadyPos >= cutoff) return;

    const newMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip: alreadyPos,
      take: cutoff - alreadyPos,
    });
    if (newMessages.length === 0) return;

    const existing = conversation.summary ?? '';
    const convoText = newMessages
      .map((m) => `${m.role === 'user' ? 'プレイヤー' : 'ヒロイン'}: ${m.content}`)
      .join('\n');

    const prompt = [
      'これまでの関係の要約:',
      existing || '(まだなし)',
      '',
      '追加の会話:',
      convoText,
      '',
      '上を踏まえ、これまでの関係を日本語で3〜5文に要約してください。',
      '重要な出来事・共通の話題・好感度の変化の兆しを含めてください。',
      '応答は要約本文のみ（前置きなし）。',
    ].join('\n');

    try {
      const res = await this.llm.complete({
        systemPrompt: 'あなたは会話の簡潔な要約を書くアシスタントです。',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 300,
      });
      const newSummary = res.rawText.trim();
      const lastMsg = newMessages[newMessages.length - 1];
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { summary: newSummary, summaryUntilMessageId: lastMsg.id },
      });
      this.logger.log(
        `summary updated: convo=${conversationId} len=${newSummary.length} through=${lastMsg.id}`,
      );
    } catch (err) {
      this.logger.warn(`summary update failed: ${(err as Error).message}`);
    }
  }
}
