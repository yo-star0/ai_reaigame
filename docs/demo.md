# デモ手順（3〜5分）

このドキュメントは求人応募時の紹介動画を録るための台本です。

## 事前準備

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# ANTHROPIC_API_KEY を本物にする。Firebase は未設定のままで DEV バイパスが効く
docker compose up -d postgres
pnpm --filter @ai-reaigame/api prisma migrate dev --name init
pnpm --filter @ai-reaigame/api prisma:seed
```

## 起動

```bash
# ターミナルA
pnpm --filter @ai-reaigame/api dev

# ターミナルB
pnpm --filter @ai-reaigame/mobile start
```

Expo Go で QR を読む、もしくは iOS シミュレータを起動。

## 録画シナリオ（3分）

| 時間 | 画面 | 操作 | 話す内容 |
| --- | --- | --- | --- |
| 0:00 | Expo起動 | Expo Go 起動 | 「pnpm workspaces + Turborepo + Expo + NestJS のモノレポ構成です」 |
| 0:15 | ログイン画面 | DEV UID「demo-user」でログイン | 「Firebase Auth 連携済み。未設定時は DEV バイパスが動きます」 |
| 0:30 | キャラクター一覧 | 「花」をタップ | 「ヒロインは 1 名を深く作り込む方針」 |
| 0:45 | キャラ詳細 | 「物語を始める」 | 「好感度と会話履歴はサーバ側に永続化」 |
| 1:00 | 冒頭シーン | タップで進行 | 「初回限定のノベル演出」 |
| 1:30 | チャット | 「こんにちは」「本、好きなんですね」などを送る | 「LangChain 経由で Claude に投げて JSON で好感度デルタを返させています」 |
| 2:15 | チャット | 10往復程度続ける | 「一定ターンで自動的に会話要約を生成し、次のターンの system prompt に再注入します（RAG相当）」 |
| 2:40 | アプリ再起動 → 再ログイン | 履歴と好感度が残っていることを見せる | 「PostgreSQL + Prisma で永続化」 |
| 2:55 | VSCode に切替 | 構成図・docs/specs/MVP.md を見せる | 「仕様駆動で `/implement` コマンドを使って Claude Code 運用」 |

## Docker 版起動（本番相当）

```bash
docker compose --profile full up --build
```

## 終了処理

```bash
docker compose --profile full down -v
```
