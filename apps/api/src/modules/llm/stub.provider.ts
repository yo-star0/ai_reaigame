import { Injectable } from '@nestjs/common';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProvider,
} from './llm.provider';

type Pattern = {
  match: RegExp;
  replies: string[];
  delta: [number, number];
};

const PATTERNS: Pattern[] = [
  {
    match: /(本|読書|小説|物語|book|reading)/i,
    replies: [
      "I love reading too! Currently I'm reading a collection of short stories about stars and myths.",
      "The protagonist in the book I read recently reminded me a bit of you.",
      "Would you like to help me choose a book at the library next time?",
    ],
    delta: [3, 5],
  },
  {
    match: /(星|夜空|宇宙|月|star|sky|moon)/i,
    replies: [
      "You like stars? The sky will probably be clear tonight. (星が好きなんだね)",
      "Which do you prefer, Vega or Altair? I'm an Altair fan.",
      "If I take you to the rooftop, we could talk more about the stars.",
    ],
    delta: [3, 5],
  },
  {
    match: /(こんにちは|やあ|おはよう|こんばんは|ハロー|hi|hello|hey)/i,
    replies: [
      "Hello! I just found a really good book. (こんにちは！ちょうど良い本を見つけたところだよ)",
      "Welcome back. I've been waiting for you to continue reading. (おかえりなさい)",
      "Hi there! What shall we talk about today?",
    ],
    delta: [1, 2],
  },
];

const FALLBACKS: string[] = [
  "Oh really? Tell me more! (そうなんだ。もう少し聞かせて？)",
  "Hehe, you seem a bit different today. (ふふ、なんだか今日のあなた、いつもと違うね)",
  "I don't dislike the time I spend talking with you... (あなたと話してる時間、きらいじゃないよ)",
  "Please continue, I'm right here listening to you. (続きを聞かせて。わたしはここにいるから)",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInRange([lo, hi]: [number, number]): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

@Injectable()
export class StubProvider implements LlmProvider {
  readonly name = 'stub';

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const content = lastUser?.content ?? '';

    for (const pattern of PATTERNS) {
      if (pattern.match.test(content)) {
        const reply = pick(pattern.replies);
        const affinity_delta = randInRange(pattern.delta);
        return { rawText: JSON.stringify({ reply, affinity_delta }) };
      }
    }

    const reply = pick(FALLBACKS);
    const affinity_delta = content.length > 10 ? 2 : 1;
    return { rawText: JSON.stringify({ reply, affinity_delta }) };
  }
}
