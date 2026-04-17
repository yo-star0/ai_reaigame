# ai_reaigame

AI×恋愛シミュレーションモバイルアプリ（2週間デモ版）。

## 概要

- ヒロイン「花(hana)」と自由会話で関係を深めるモバイルアプリ
- Claude (LLM) によるキャラクター駆動、好感度と会話履歴は永続化
- ポートフォリオ目的で求人要件（Claude Code / SDD / NestJS / Prisma / Expo / Firebase Auth / LangChain / Docker / モノレポ）を横断的にカバー

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| モノレポ | pnpm workspaces + Turborepo |
| モバイル | Expo (React Native) + Expo Router + NativeWind |
| API | NestJS + TypeScript |
| DB | PostgreSQL 16 + Prisma |
| 認証 | Firebase Authentication |
| LLM | Anthropic API (Claude Sonnet 4.6) + LangChain.js（`LLMProvider` でBedrock差し替え可） |
| コンテナ | Docker multi-stage + docker-compose |
| SDD | `docs/specs/MVP.md` + `.claude/commands/` |

## ディレクトリ

```
apps/
  api/          # NestJS
  mobile/       # Expo
packages/
  shared/       # zodスキーマ/DTO
  prompts/      # ヒロイン人格プロンプト
docs/
  specs/        # SDD仕様書
.claude/
  commands/     # Claude Code用スラッシュコマンド
```

## 起動手順（ローカル）

```bash
pnpm install
cp apps/api/.env.example apps/api/.env       # 値を埋める
docker compose up -d                          # Postgres起動
pnpm --filter api prisma migrate deploy       # DBマイグレーション
pnpm dev                                      # API+モバイル同時起動
```

詳細は D13 以降でこのREADMEに追記予定。

## SDD運用

`docs/specs/MVP.md` が single source of truth。実装着手前に該当ストーリーを確認すること。Claude Codeで `/implement` コマンドを使うと自動的にspecチェックが入ります。
