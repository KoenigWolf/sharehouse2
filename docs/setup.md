# 環境構築ガイド

Share House Portal の開発環境セットアップ手順。

---

## 必要なもの

| ツール | バージョン | 確認コマンド |
|--------|-----------|-------------|
| Node.js | 22.x | `node -v` |
| npm | 10.x | `npm -v` |
| Git | 2.x | `git -v` |

## 1. リポジトリのクローン

```bash
git clone https://github.com/KoenigWolf/sharehouse2.git
cd sharehouse2
```

## 2. 依存関係のインストール

```bash
# Web アプリ
npm install

# Mobile アプリ（開発する場合）
cd mobile && npm install && cd ..
```

## 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Sentry（オプション）
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx

# Redis（オプション、なければインメモリフォールバック）
REDIS_URL=redis://localhost:6379

# Cron認証
CRON_SECRET=your-secret-key
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

---

## Supabase ローカル開発（オプション）

### Supabase CLI のインストール

```bash
brew install supabase/tap/supabase
```

### ローカル Supabase の起動

```bash
npx supabase start
```

出力されるURLとキーを `.env.local` に設定。

### マイグレーション実行

```bash
npx supabase db push
```

---

## Mobile アプリ開発

### Expo CLI のインストール

```bash
npm install -g expo-cli
```

### 開発サーバーの起動

```bash
cd mobile
npm start
```

### iOS シミュレータで実行

```bash
npm run ios
```

### Android エミュレータで実行

```bash
npm run android
```

---

## エディタ設定

### VS Code 推奨拡張機能

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### 設定 (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## よくある問題

→ [troubleshooting.md](./troubleshooting.md) を参照
