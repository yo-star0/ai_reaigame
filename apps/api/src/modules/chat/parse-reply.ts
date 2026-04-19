import { llmReplyJsonSchema } from '@ai-reaigame/shared';

function extractJsonSlice(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function normalizeJson(raw: string): string {
  return raw
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .replace(/:\s*\+(\d)/g, ': $1')
    .replace(/,(\s*[}\]])/g, '$1')
    .trim();
}

export function parseLlmReply(rawText: string): { reply: string; affinityDelta: number } {
  const candidate = extractJsonSlice(normalizeJson(rawText));
  if (!candidate) {
    return { reply: rawText.trim() || '…（沈黙）', affinityDelta: 0 };
  }
  try {
    const parsed = llmReplyJsonSchema.parse(JSON.parse(candidate));
    return { reply: parsed.reply, affinityDelta: parsed.affinity_delta };
  } catch {
    const replyMatch = candidate.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const deltaMatch = candidate.match(/"affinity_delta"\s*:\s*([+-]?\d+)/);
    if (replyMatch) {
      const reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      const deltaRaw = deltaMatch ? parseInt(deltaMatch[1], 10) : 0;
      const delta = Number.isFinite(deltaRaw) ? Math.max(-5, Math.min(5, deltaRaw)) : 0;
      return { reply, affinityDelta: delta };
    }
    return { reply: rawText.trim(), affinityDelta: 0 };
  }
}

export function clampAffinity(value: number, min = -100, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
