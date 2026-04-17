import { llmReplyJsonSchema } from '@ai-reaigame/shared';

export function parseLlmReply(rawText: string): { reply: string; affinityDelta: number } {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    return { reply: rawText.trim() || '…（沈黙）', affinityDelta: 0 };
  }
  try {
    const parsed = llmReplyJsonSchema.parse(JSON.parse(match[0]));
    return { reply: parsed.reply, affinityDelta: parsed.affinity_delta };
  } catch {
    return { reply: rawText.trim(), affinityDelta: 0 };
  }
}

export function clampAffinity(value: number, min = -100, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
