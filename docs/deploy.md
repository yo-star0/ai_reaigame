# デプロイ手順（URL公開）

無料で公開URLを取る最短ルート:

- **API + Postgres**: Render.com（API Web Service 無料、DBは Neon か Supabase）
- **Expo Web**: Vercel（Hobbyプラン無料）
- **LLM**: Google Gemini（`GOOGLE_API_KEY`、無料枠が大きい）

合計アカウント登録 4 件、初回 30〜45 分。

---

## 1. PostgreSQL を用意（Neon 推奨）

1. https://neon.tech/ でアカウント作成（GitHubでOK）
2. 「Create project」→ リージョン Tokyo
3. ダッシュボードで Connection string（`postgresql://user:pass@host/dbname?sslmode=require`）をコピー

> Supabase / Railway でも可。`sslmode=require` が付くURLが欲しい。

## 2. Gemini API キー発行

1. https://aistudio.google.com/app/apikey で「Create API key」
2. `AIzaSy…` で始まる鍵をコピー

## 3. Render でAPIをデプロイ

1. https://render.com/ でアカウント作成 → GitHub連携
2. 「New +」→「Blueprint」→ このリポジトリ選択
3. `render.yaml` が検出される。以下のシークレットを手動入力:

   | キー | 値 |
   | --- | --- |
   | `DATABASE_URL` | Neon の connection string |
   | `GOOGLE_API_KEY` | AI Studio で発行した鍵 |
   | `CORS_ORIGINS` | Vercel の URL（後から追加可、例 `https://ai-reaigame.vercel.app`） |
   | `FIREBASE_*` | 空のままでOK（DEV バイパス） |
   | `DEV_ADMIN_UIDS` | `demo-user`（カンマ区切りで管理者扱いにしたいUID。管理画面 `/admin` に入るのに必要） |

4. Deploy。初回はビルドに 5〜10 分
5. 完了したら `https://ai-reaigame-api.onrender.com/api/v1/health` にアクセスして `{"status":"ok"}` が返ることを確認
6. 初回だけ DB マイグレーションとシード:
   - Render Dashboard → Service → Shell タブ → 以下を順に実行:
     ```bash
     cd /app/apps/api
     npx prisma migrate deploy
     npx prisma db seed
     ```

> ⚠️ Render 無料プランは 15 分無アクセスで休眠（次回リクエストに 30〜60 秒）。

## 4. Vercel で Expo Web をデプロイ

1. https://vercel.com/ でアカウント作成 → GitHub連携
2. 「Add New…」→「Project」→ リポジトリを Import
3. **Root Directory はリポジトリルートのまま**（`vercel.json` を使う）
4. Framework Preset: **Other**
5. Environment Variables に追加:
   - `EXPO_PUBLIC_API_BASE_URL` = `https://ai-reaigame-api.onrender.com/api/v1`
6. Deploy。初回ビルドは 3〜5 分
7. 割り当てられた URL（例 `https://ai-reaigame.vercel.app`）を Render の `CORS_ORIGINS` にセットし直してAPIを再デプロイ

## 5. 動作確認

1. Vercel の URL をブラウザで開く
2. DEV UID `demo-user` でログイン
3. 花と会話 → Gemini が応答を返す
4. 好感度が動く、リロードで履歴が残る

## トラブルシュート

- **CORS エラー**: `CORS_ORIGINS` に Vercel の完全な URL（末尾スラッシュなし）を設定
- **500 on /health**: Render Shell で `npx prisma migrate deploy` 未実行
- **APIが休眠**: 初回アクセスで 30 秒ほどコールドスタート待機
- **LLMがスタブに落ちる**: `GOOGLE_API_KEY` の値を再確認、ログで `Using GeminiProvider` が出ているか

## 完全停止（請求事故防止）

- Render: サービスを「Suspend」
- Neon: プロジェクト削除
- Vercel: プロジェクト削除

いずれも無料プラン範囲なら課金は発生しないが、不要になったら削除推奨。
