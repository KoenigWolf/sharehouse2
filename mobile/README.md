# Share House Mobile

React Native (Expo) モバイルアプリ - シェアハウス住民ポータル

## 技術スタック

- **Expo SDK 54** - React Native 開発フレームワーク
- **Expo Router 6** - ファイルベースルーティング
- **NativeWind 4** - Tailwind CSS for React Native
- **React Native Reanimated 4** - アニメーション
- **Supabase** - バックエンド (認証・データベース)
- **TypeScript** - 型安全性

## セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.local.example .env.local
# EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定

# 開発サーバー起動
npm start
```

## コマンド

| コマンド | 説明 |
|---------|------|
| `npm start` | Expo 開発サーバー起動 |
| `npm run ios` | iOS シミュレーターで実行 |
| `npm run android` | Android エミュレーターで実行 |
| `npm run type-check` | TypeScript 型チェック |
| `npm run lint` | ESLint 実行 |
| `npm run prebuild` | ネイティブプロジェクト生成 |

## プロジェクト構成

```
mobile/
├── app/                    # Expo Router ページ
│   ├── (auth)/            # 認証関連画面
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # 住民一覧
│   │   ├── bulletin.tsx   # 掲示板
│   │   ├── events.tsx     # イベント
│   │   ├── share.tsx      # シェアボード
│   │   └── settings.tsx   # 設定
│   ├── events/
│   │   └── [id].tsx       # イベント詳細
│   ├── profile/
│   │   └── [id].tsx       # プロフィール詳細
│   └── _layout.tsx        # ルートレイアウト
├── components/
│   └── ui/                # 共通UIコンポーネント
│       ├── Avatar.tsx
│       ├── Button.tsx
│       └── Card.tsx
├── lib/
│   ├── auth.tsx           # 認証プロバイダー
│   ├── supabase.ts        # Supabase クライアント
│   ├── i18n/              # 国際化
│   │   ├── index.ts
│   │   ├── en.ts
│   │   └── ja.ts
│   └── utils/
│       └── log-error.ts   # エラーログユーティリティ
├── constants/
│   └── colors.ts          # カラー定数
├── babel.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 国際化 (i18n)

アプリは日本語・英語に対応。デバイスのロケールに基づいて自動切り替え。

```tsx
import { useI18n } from "../lib/i18n";

function MyComponent() {
  const { t } = useI18n();
  return <Text>{t("common.loading")}</Text>;
}
```

翻訳キーは `lib/i18n/en.ts` と `lib/i18n/ja.ts` に定義。

## エラーハンドリング

`console.error` の代わりに `logError` ユーティリティを使用:

```tsx
import { logError } from "../lib/utils/log-error";

try {
  // ...
} catch (error) {
  logError(error, { fn: "functionName", context: "additional info" });
}
```

## スタイリング

NativeWind (Tailwind CSS) を使用:

```tsx
<View className="flex-1 bg-background p-4">
  <Text className="text-foreground text-lg font-bold">Hello</Text>
</View>
```

カラートークンは `constants/colors.ts` で一元管理。

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |

## 注意事項

- **NativeWind 4.x** は `react-native-reanimated` と `react-native-worklets` に依存
- iOS シミュレーターでのデバッグには Xcode が必要
- Android エミュレーターには Android Studio が必要
