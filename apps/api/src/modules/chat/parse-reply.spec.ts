import { clampAffinity, parseLlmReply } from './parse-reply';

describe('parseLlmReply', () => {
  it('parses a well-formed JSON response', () => {
    const raw = '{"reply":"嬉しい","affinity_delta":3}';
    expect(parseLlmReply(raw)).toEqual({ reply: '嬉しい', affinityDelta: 3 });
  });

  it('tolerates leading/trailing prose around JSON', () => {
    const raw = 'ここに応答: {"reply":"ありがとう","affinity_delta":-1} 終わり';
    expect(parseLlmReply(raw)).toEqual({ reply: 'ありがとう', affinityDelta: -1 });
  });

  it('falls back to raw text when JSON is malformed', () => {
    const raw = '普通のテキスト';
    expect(parseLlmReply(raw)).toEqual({ reply: '普通のテキスト', affinityDelta: 0 });
  });

  it('falls back to 0 delta when schema validation fails', () => {
    const raw = '{"reply":"hi","affinity_delta":"high"}';
    expect(parseLlmReply(raw)).toEqual({ reply: raw, affinityDelta: 0 });
  });

  it('clamps out-of-range deltas via schema reject (treated as raw)', () => {
    const raw = '{"reply":"x","affinity_delta":9999}';
    expect(parseLlmReply(raw)).toEqual({ reply: raw, affinityDelta: 0 });
  });
});

describe('clampAffinity', () => {
  it('clamps to the default range', () => {
    expect(clampAffinity(500)).toBe(100);
    expect(clampAffinity(-500)).toBe(-100);
    expect(clampAffinity(30)).toBe(30);
  });

  it('respects custom bounds', () => {
    expect(clampAffinity(50, 0, 10)).toBe(10);
  });
});
