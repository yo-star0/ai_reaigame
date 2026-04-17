# MVP仕様書（2週間デモ版）

最終更新: 2026-04-17

## 1. プロダクト概要

AI×恋愛シミュレーションのモバイルアプリ。ユーザーはヒロイン「花(hana)」と出会い、冒頭シーンの後に自由会話で関係を深める。ヒロインはClaudeで駆動され、会話から好感度が変動する。

## 2. 対象ユーザー・ゴール

- **ターゲット**: 求人応募時に見せる面接官 / 技術レビュアー
- **デモ時間**: 3〜5分
- **体験ゴール**: ログイン → キャラ選択 → 冒頭1シーン → AI会話で好感度が変動 → 再起動で履歴復元

## 3. ユーザーストーリー

| ID | Who | What | Why |
| --- | --- | --- | --- |
| **US-01** | 未ログインユーザー | メールとパスワードでサインアップ/ログインできる | 会話履歴を自分のものとして保存したい |
| **US-02** | ログイン済ユーザー | ヒロイン一覧と詳細プロフィールを見られる | 誰と話すか決めたい |
| **US-03** | ログイン済ユーザー | 初回だけ冒頭シーンのノベル文面を読める | 関係の前提を知りたい |
| **US-04** | ログイン済ユーザー | ヒロインと自由にテキストで会話できる | 恋愛シミュレーションを楽しむ |
| **US-05** | ログイン済ユーザー | 会話中に好感度メーターが上下するのを見られる | 自分の発言が影響していると実感したい |
| **US-06** | ログイン済ユーザー | アプリを再起動しても会話履歴と好感度が復元される | 関係が続いている体験が欲しい |

## 4. 画面一覧と遷移

```
[Login] --signup/login--> [CharacterList]
                              |
                              v
                         [CharacterDetail] --start--> [OpeningScene (初回のみ)] --> [Chat]
                              ^                                                       |
                              +---------------------back----------------------------- +
```

画面:

1. **Login** (`/login`): メール+パスワード入力。Firebase Auth。
2. **CharacterList** (`/`): ヒロイン一覧（MVPでは1名）。タップで詳細へ。
3. **CharacterDetail** (`/character/[id]`): プロフィール + 「会話を始める」ボタン + 現在の好感度。
4. **OpeningScene** (`/character/[id]/opening`): ハードコードされた冒頭文をノベル風に順次表示。初回のみ。
5. **Chat** (`/character/[id]/chat`): 会話履歴、入力欄、好感度バー、送信中インジケータ。

## 5. API仕様

ベースURL: `/api/v1`。すべて `Authorization: Bearer <Firebase ID Token>` 必須（ログイン除く）。

| メソッド | パス | 概要 | リクエスト | レスポンス |
| --- | --- | --- | --- | --- |
| GET | `/me` | 自ユーザー取得。未作成なら作成 | — | `{ id, firebaseUid, displayName }` |
| GET | `/characters` | ヒロイン一覧 | — | `Character[]` |
| GET | `/characters/:id` | ヒロイン詳細 + 現ユーザーの好感度 | — | `Character & { affinity: number, hasSeenOpening: boolean }` |
| POST | `/characters/:id/opening/complete` | 冒頭シーン既読化 | — | `{ ok: true }` |
| GET | `/characters/:id/messages?cursor=` | 会話履歴（新しい順、20件ずつ） | — | `{ items: Message[], nextCursor: string \| null }` |
| POST | `/characters/:id/messages` | 発言送信→AI応答を返す | `{ content: string }` | `{ user: Message, assistant: Message, affinity: number, affinityDelta: number }` |

型（抜粋）:

```ts
type Character = { id: string; name: string; tagline: string; avatarUrl: string };
type Message = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
```

## 6. データモデル（Prisma）

```prisma
model User {
  id           String   @id @default(cuid())
  firebaseUid  String   @unique
  displayName  String?
  createdAt    DateTime @default(now())
  conversations Conversation[]
}

model Character {
  id          String   @id            // "hana"
  name        String
  tagline     String
  avatarUrl   String
  systemPrompt String                 // packages/prompts から流し込み
  openingText String                  // ハードコード冒頭
}

model Conversation {
  id           String    @id @default(cuid())
  userId       String
  characterId  String
  affinity     Int       @default(0)
  hasSeenOpening Boolean @default(false)
  summary      String?                // 最小RAG用の直近要約
  summaryUntilMessageId String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id])
  character    Character @relation(fields: [characterId], references: [id])
  messages     Message[]
  @@unique([userId, characterId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // "user" | "assistant"
  content        String
  affinityDelta  Int      @default(0)
  createdAt      DateTime @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  @@index([conversationId, createdAt])
}
```

## 7. AI会話プロンプト設計（概要）

LLMには以下をsystem/userで注入:

1. ヒロイン人格定義（`packages/prompts/heroines/hana.ts`）
2. 現在の好感度（整数）と関係フェーズ
3. 直近会話要約（20発話ごとに要約を更新）
4. 直近6件の生メッセージ
5. ユーザーの最新発言

応答フォーマット（JSON厳守）:

```json
{ "reply": "…", "affinity_delta": -2 }
```

パース失敗時は `affinity_delta=0` にフォールバック、`reply` はプレーンテキストとみなす。

## 8. 非機能

- ローカル起動: `docker compose up -d && pnpm --filter api start:dev && pnpm --filter mobile start`
- エラーハンドリング: API側で LLMProvider 失敗時はスタブ応答を返し、5xxにしない
- ログ: NestJS Logger + pino JSON, 会話本文は長さのみ記録（プライバシー配慮）

## 9. デモ成功基準

- 3分以内にログイン→冒頭→会話10往復ができる
- 好感度が1度以上増減する
- アプリ再起動後、同じ履歴と好感度が見える
- `docker compose up` 一発でAPI+DBが起動する

## 10. スコープ外（v2）

Bedrock実接続 / pgvector RAG / AWS CDK / シナリオエンジン / 2人目ヒロイン / CG・音声 / 課金 / TestFlight配信
