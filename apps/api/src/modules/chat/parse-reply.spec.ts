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

  it('strips markdown code fences that Gemini sometimes emits', () => {
    const raw = '```json\n{"reply":"hi","affinity_delta":2}\n```';
    expect(parseLlmReply(raw)).toEqual({ reply: 'hi', affinityDelta: 2 });
  });

  it('accepts +N numbers that strict JSON would reject', () => {
    const raw = '{"reply":"元気","affinity_delta":+1}';
    expect(parseLlmReply(raw)).toEqual({ reply: '元気', affinityDelta: 1 });
  });

  it('regex-falls-back when JSON still cannot parse', () => {
    const raw = '{"reply":"test","affinity_delta":+2,}';
    expect(parseLlmReply(raw)).toEqual({ reply: 'test', affinityDelta: 2 });
  });

  it('falls back to raw text when JSON is malformed', () => {
    const raw = '普通のテキスト';
    expect(parseLlmReply(raw)).toEqual({ reply: '普通のテキスト', affinityDelta: 0 });
  });

  it('falls back to 0 delta when schema validation fails', () => {
    const raw = '{"reply":"hi","affinity_delta":"high"}';
    expect(parseLlmReply(raw)).toEqual({ reply: 'hi', affinityDelta: 0 });
  });

  it('clamps out-of-range deltas from the fallback regex', () => {
    const raw = '{"reply":"x","affinity_delta":9999}';
    expect(parseLlmReply(raw)).toEqual({ reply: 'x', affinityDelta: 5 });
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
