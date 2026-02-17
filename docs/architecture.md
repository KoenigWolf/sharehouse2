# アーキテクチャ

Share House Portal のシステム構成と設計方針。

---

## システム構成図

```text
┌─────────────────────────────────────────────────────────────────┐
│                         クライアント                              │
├─────────────────────────────────┬───────────────────────────────┤
│         Web (Next.js)           │      Mobile (Expo)            │
│    - SSR / サーバーアクション     │    - React Native            │
│    - Tailwind CSS 4             │    - NativeWind              │
│    - shadcn/ui                  │    - Supabase JS Client      │
└─────────────────────────────────┴───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel                                  │
├─────────────────────────────────────────────────────────────────┤
│  - Edge Runtime (ミドルウェア)                                    │
│  - Serverless Functions (API / Server Actions)                   │
│  - Cron Jobs (朝のダイジェスト、ゴミ出しリマインド)                   │
│  - Web Analytics                                                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
├─────────────────────────────────────────────────────────────────┤
│  - Auth (認証・セッション管理)                                     │
│  - PostgreSQL (データベース + RLS)                                │
│  - Storage (画像・ファイル)                                       │
│  - Realtime (将来: リアルタイム通知)                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        外部サービス                               │
├─────────────────────────────────────────────────────────────────┤
│  - Sentry (エラー監視)                                           │
│  - Upstash Redis (レート制限、オプション)                          │
│  - Resend (メール送信)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構成

```text
sharehouse2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証グループ
│   │   ├── api/                # API ルート
│   │   └── [feature]/          # 機能別ページ
│   ├── components/             # UIコンポーネント
│   │   ├── ui/                 # 汎用UI (shadcn/ui)
│   │   └── [feature]/          # 機能別コンポーネント
│   ├── lib/                    # ビジネスロジック
│   │   ├── [feature]/actions.ts  # サーバーアクション
│   │   ├── [feature]/queries.ts  # データ取得
│   │   ├── security/           # セキュリティ
│   │   ├── supabase/           # Supabase クライアント
│   │   └── utils/              # ユーティリティ
│   ├── domain/                 # ドメイン層
│   │   ├── types/              # 型定義
│   │   └── validation/         # バリデーション
│   ├── hooks/                  # カスタムフック
│   └── __tests__/              # テスト
├── mobile/                     # Expo アプリ
│   ├── app/                    # Expo Router
│   ├── components/             # コンポーネント
│   └── lib/                    # ロジック
├── supabase/
│   └── migrations/             # DBマイグレーション
├── docs/                       # ドキュメント
└── public/                     # 静的ファイル
```

---

## データフロー

### 読み取り（Server Component）

```text
Page (Server Component)
    │
    ▼
queries.ts (データ取得)
    │
    ▼
Supabase Client (server.ts)
    │
    ▼
PostgreSQL + RLS
```

### 書き込み（Server Action）

```text
Client Component
    │
    ▼ (form action / useFormState)
actions.ts ("use server")
    │
    ├── バリデーション (zod)
    ├── レート制限チェック
    ├── 認証確認
    │
    ▼
Supabase Client
    │
    ▼
PostgreSQL + RLS
    │
    ▼
revalidatePath / revalidateTag
```

---

## セキュリティ

### 認証フロー

```text
1. サインアップ/サインイン
   → Supabase Auth
   → セッショントークン発行
   → Cookie に保存 (httpOnly)

2. リクエスト
   → middleware.ts (セッション検証)
   → RLS (行レベルセキュリティ)

3. サインアウト
   → セッション無効化
   → Cookie 削除
```

### レート制限

| エンドポイント | 制限 | ストア |
|--------------|------|--------|
| 認証 | 5回/分 | Redis / メモリ |
| パスワードリセット | 3回/時 | Redis / メモリ |
| API | 60回/分 | Redis / メモリ |

### 入力検証

- **クライアント**: zod + react-hook-form（UX向上）
- **サーバー**: zod（セキュリティ）
- **DB**: RLS + 制約（最終防衛）

---

## パフォーマンス最適化

### キャッシュ戦略

| データ種別 | 戦略 | TTL |
|-----------|------|-----|
| 静的ページ | ISR | 1時間 |
| ユーザーデータ | no-store | - |
| 画像 | Supabase CDN | 1年 |

### バンドル最適化

- **framer-motion**: LazyMotion + domAnimation
- **アイコン**: lucide-react (tree-shaking)
- **フォント**: next/font (サブセット)

---

## 監視・ログ

### エラー監視 (Sentry)

- クライアントエラー
- サーバーエラー
- Edge エラー
- パフォーマンス（Web Vitals）

### ログ

| レベル | 関数 | 送信先 |
|-------|------|--------|
| Error | `logError()` | Console + Sentry |
| Warning | `logWarning()` | Console + Sentry |
| Info | `logInfo()` | Console のみ |
| Audit | `auditLog()` | Console + DB |

---

## 将来の拡張

### 検討中

- [ ] Realtime 通知（Supabase Realtime）
- [ ] Push 通知（Expo Push + Web Push）
- [ ] PWA 対応
- [ ] オフライン対応

### スケーラビリティ

現在の設計は20人規模を想定。100人以上に拡大する場合：

- Redis キャッシュの導入
- データベースインデックスの見直し
- CDN 活用の拡大
