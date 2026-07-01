# feature-flags

**Open-source alternative to LaunchDarkly.** LaunchDarklyの年間$71,847を、$15/月のVPSコストに。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/postcabinets-jp/feature-flags&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL&envDescription=Supabase%20project%20credentials&project-name=feature-flags&repository-name=feature-flags)

## Features

- **Boolean / String / Number / JSON** の4型フラグ対応
- **環境管理** — Development / Staging / Production + カスタム環境を無制限追加
- **段階的ロールアウト** — ユーザーハッシュベースの再現性ある%ロールアウト
- **ターゲティングルール** — ユーザーID・メール・カスタム属性でセグメント
- **即時キルスイッチ** — 全環境でフラグをOFFにするワンクリック緊急停止
- **フラグ腐敗スキャナー** — 60日超変更なしのフラグを自動検出・通知
- **監査ログ** — 全変更の「誰が・いつ・何を」を完全記録
- **APIキー管理** — SDK（読み取り専用）とManagement（書き込み）を分離発行
- **チーム権限管理** — Owner / Admin / Editor / Viewer の4ロール
- **セルフホスト対応** — Docker Compose 1コマンドで全スタック起動

## Quick Start

### クラウド版（Vercel + Supabase）

1. 上の **Deploy with Vercel** ボタンをクリック
2. [Supabase](https://supabase.com) でプロジェクトを作成し、環境変数を入力
3. Supabase SQL Editor で `supabase/migrations/` のファイルを順番に実行
4. `/register` にアクセスしてアカウントを作成

### セルフホスト（Docker Compose）

```bash
git clone https://github.com/postcabinets-jp/feature-flags
cd feature-flags
cp .env.example .env  # 編集してSupabaseの認証情報を入力
docker compose up -d  # http://localhost:3000 で起動
```

### ローカル開発

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

Supabase SQL Editorで順番に実行:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/seed.sql  # (任意) サンプルデータ
```

## Tech Stack

| 層 | 技術 |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Deploy | Vercel / Docker Compose |

## Comparison

| | feature-flags (OSS) | LaunchDarkly Foundation | Statsig Pro | ConfigCat Smart |
|---|---|---|---|---|
| 月額 | $0（セルフホスト）/ $39〜（クラウド） | $1,000〜 | $150〜 | $325 |
| セルフホスト | ✅ | ❌ | ❌ | ❌ |
| フラグ腐敗検出 | ✅ 自動通知 | 手動のみ | ❌ | ❌ |

## License

MIT

---

Built by [POST CABINETS](https://postcabinets.co.jp)
