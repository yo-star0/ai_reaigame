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
    match: /(本|読書|小説|物語)/,
    replies: [
      'わたしも本が好き。今は星と神話の話を集めた短編集を読んでるの。',
      '最近読んだ本、登場人物の一人があなたに少し似てたんだよ。',
      'よかったら今度、図書室で本を選ぶの手伝って？',
    ],
    delta: [3, 5],
  },
  {
    match: /(星|夜空|宇宙|月)/,
    replies: [
      '星、好きなんだね。今夜はきっと空が澄んでるよ。',
      'ベガとアルタイル、どっちが好き？わたしはアルタイル派。',
      '屋上に連れて行ったらもっと星の話ができそう。',
    ],
    delta: [3, 5],
  },
  {
    match: /(好き|愛してる|かわいい|きれい)/,
    replies: [
      'うう、急にそんなこと言わないで…。耳、赤くなってない？',
      'ふふ、そういうの、ちゃんと覚えておくからね。',
      '…ありがとう。でも、照れるから次は前置きしてね。',
    ],
    delta: [4, 5],
  },
  {
    match: /(こんにちは|やあ|おはよう|こんばんは|ハロー|hi)/i,
    replies: [
      'あ、来たんだ。ちょうど良い本を見つけたところ。',
      'おかえり。少し前から続きを読んで待ってたんだよ。',
      'こんにちは。今日はどんな話しよう？',
    ],
    delta: [1, 2],
  },
  {
    match: /(ばか|うざい|きらい|死ね)/,
    replies: [
      '…そういうこと言われると、少し悲しいかも。',
      '本気で言ってる？ちょっと距離を置きたい気分。',
    ],
    delta: [-5, -3],
  },
  {
    match: /\?|？/,
    replies: [
      'うーん、どうだろう。あなたはどう思う？',
      'それ、ちょっと考えたことなかったな。教えてくれる？',
      '難しい問いだね。でも、あなたとならゆっくり答えを探せる気がする。',
    ],
    delta: [1, 3],
  },
];

const FALLBACKS: string[] = [
  'そうなんだ。もう少し聞かせて？',
  'ふふ、なんだか今日のあなた、いつもと違うね。',
  'わたし、あなたと話してる時間、きらいじゃないよ。',
  '続き、聞かせて。わたしはここにいるから。',
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
