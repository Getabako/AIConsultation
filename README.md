# AI相談室

Google検索風UIのAI相談サイト。Gemini 2.5 Flashで即時回答。

## セットアップ

```bash
npm install
```

## 環境変数（.env.local）

```
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
GOOGLE_SHEETS_PRIVATE_KEY=your_service_account_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_SPREADSHEET_ID=1yoGqp44ISrCXEBwNZ0LipUlWUZl9tRTpfiVNXVbpqn8
```

### APIキーの取得方法

1. **Gemini API**: [Google AI Studio](https://aistudio.google.com/) でAPIキーを取得
2. **Resend**: [Resend](https://resend.com/) でアカウント作成→APIキー取得。ドメイン `if-juku.net` を設定
3. **Google Sheets**: GCPコンソールでサービスアカウント作成→JSONキーのclient_emailとprivate_keyを設定。スプレッドシートをサービスアカウントに共有

## 開発

```bash
npm run dev
```

## デプロイ（Vercel）

```bash
npx vercel
```

Vercelダッシュボードで環境変数を設定してください。
