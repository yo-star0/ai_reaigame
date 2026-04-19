import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LLM_PROVIDER, LlmMessage, LlmProvider } from '../llm/llm.provider';
import { SummaryService } from '../rag/summary.service';
import { Conversation, Message } from '@prisma/client';
import { clampAffinity, parseLlmReply } from './parse-reply';
import { buildPhaseInstruction } from './relationship-phase';

const MAX_RAW_MESSAGES = 6;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly summary: SummaryService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async listMessages(characterId: string, firebaseUid: string, email: string | undefined, cursor?: string) {
    const conversation = await this.getConversation(characterId, firebaseUid, email);
    const items = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > 20;
    const page = hasMore ? items.slice(0, 20) : items;
    return {
      items: page.map((m) => this.toDto(m)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async sendMessage(characterId: string, firebaseUid: string, email: string | undefined, content: string) {
    const conversation = await this.getConversation(characterId, firebaseUid, email);
    const character = await this.prisma.character.findUniqueOrThrow({ where: { id: characterId } });

    const userMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content,
      },
    });

    const history = await this.buildHistory(conversation.id);
    const systemPrompt = this.buildSystemPrompt(character.systemPrompt, conversation);

    let rawText = '';
    try {
      const res = await this.llm.complete({
        systemPrompt,
        messages: [...history, { role: 'user', content }],
      });
      rawText = res.rawText;
    } catch (err) {
      this.logger.error(`LLM call failed: ${(err as Error).message}`);
      rawText = JSON.stringify({
        reply: '（うまく言葉にできなかった。少し間を置いて、もう一度話しかけてみて）',
        affinity_delta: 0,
      });
    }

    const { reply, affinityDelta } = parseLlmReply(rawText);
    const newAffinity = clampAffinity(conversation.affinity + affinityDelta);

    const [assistantMessage, updatedConversation] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: reply,
          affinityDelta,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { affinity: newAffinity },
      }),
    ]);

    void this.summary
      .updateIfNeeded(conversation.id)
      .catch((err) => this.logger.warn(`summary update failed: ${(err as Error).message}`));

    return {
      user: this.toDto(userMessage),
      assistant: this.toDto(assistantMessage),
      affinity: updatedConversation.affinity,
      affinityDelta,
    };
  }

  private async getConversation(characterId: string, firebaseUid: string, email: string | undefined) {
    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    const user = await this.users.findOrCreateByFirebaseUid(firebaseUid, email);
    return this.prisma.conversation.upsert({
      where: { userId_characterId: { userId: user.id, characterId } },
      update: {},
      create: { userId: user.id, characterId },
    });
  }

  private async buildHistory(conversationId: string): Promise<LlmMessage[]> {
    const recent = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_RAW_MESSAGES,
    });
    return recent
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  }

  private buildSystemPrompt(characterPrompt: string, conversation: Conversation): string {
    const lines = [
      characterPrompt,
      '',
      buildPhaseInstruction(conversation.affinity),
    ];
    if (conversation.summary) {
      lines.push('', '【これまでの関係の要約】', conversation.summary);
    }
    return lines.join('\n');
  }

  private toDto(m: Message) {
    return {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
