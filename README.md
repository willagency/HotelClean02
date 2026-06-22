# CleanOps - ホテル客室清掃管理システム

## セットアップ手順

### 1. Supabaseプロジェクトを作成
1. [Supabase](https://supabase.com) にアクセスして新規プロジェクトを作成
2. `supabase/schema.sql` の内容を **SQL Editor** で実行してテーブルとシードデータを作成

### 2. 環境変数を設定
```bash
cp .env.local.example .env.local
```
`.env.local` を開いて Supabase の URL と Anon Key を設定します。
（Supabase ダッシュボード → Settings → API から取得）

### 3. 依存パッケージをインストール
```bash
npm install
```

### 4. 開発サーバーを起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

---

## URL構成

| URL | 説明 |
|-----|------|
| `/` | トップ（スタッフ/管理者の振り分け） |
| `/staff` | スタッフ向けトップ |
| `/staff/clock` | QRコード打刻画面 📱 |
| `/staff/shift` | シフト提出画面 📱 |
| `/admin` | 管理者ダッシュボード 🖥️ |
| `/admin/daily-report` | 日報入力（スプレッドシート風）🖥️ |
| `/admin/attendance` | 勤怠確認 🖥️ |
| `/admin/shifts` | シフト承認 🖥️ |
| `/admin/export` | 帳票出力（Phase 4予定）🖥️ |

---

## QRコードの生成方法

ホテルのQRコードは以下の形式のテキストを含む必要があります：

```
hotel:{ホテルのUUID}
```

例: `hotel:00000000-0000-0000-0000-000000000001`

[QR Code Generator](https://qr.io) などで生成してホテル入口に掲示してください。

---

## 開発フェーズ

- [x] Phase 1: QR打刻 + Supabase基盤
- [x] Phase 2: 日報入力（リアルタイム売上計算）
- [x] Phase 3: シフト管理・勤怠確認
- [ ] Phase 4: PDF/CSV帳票出力

---

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- html5-qrcode
- sonner (トースト通知)
