# Share House Portal - 改善計画書

最終更新: 2026-01-28

## 概要

プロジェクト全体を解析した結果、以下の改善点が特定されました。
各項目は優先度（🔴高・🟡中・🟢低）、実装時間、影響度で分類されています。

このドキュメントは技術的負債と改善項目を追跡します。
実装時は [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) と [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) に従ってください。

## クイックサマリー

- Phase 1 (高優先度): セキュリティ・パフォーマンス（5項目中4項目完了）
- Phase 2 (中優先度): アクセシビリティ・型安全性・エラー処理（20項目未着手）
- Phase 3 (低優先度): テスト・ドキュメント・監視（18項目未着手）

詳細は以下の進捗トラッカーを参照。

---

## 📋 進捗トラッカー

### フェーズ1: 即座対応（高セキュリティ・パフォーマンス）

- [x] 1.1 セッション有効期限の短縮 ✅
- [x] 1.2 検索機能にDebounce適用 ✅
- [ ] 1.3 CSPポリシーの改善
- [x] 1.4 キャッシュ戦略の統一 ✅
- [x] 1.5 UUID検証の重複削除 ✅

### フェーズ2: 1-2週間（コード品質）

- [ ] 2.1 Next.js Image コンポーネント導入
- [ ] 2.2 アクセシビリティ改善
- [ ] 2.3 エラーハンドリング強化
- [ ] 2.4 型安全性の向上
- [ ] 2.5 フォーム最適化

### フェーズ3: 2-4週間（テスト・ドキュメント）

- [ ] 3.1 サーバーアクションのテスト追加
- [ ] 3.2 JSDocドキュメント追加
- [ ] 3.3 エラー追跡サービス統合
- [ ] 3.4 パスワード強度チェック

### フェーズ4: 継続改善

- [ ] 4.1 パフォーマンス監視
- [ ] 4.2 レート制限のRedis化
- [ ] 4.3 モーション配慮（prefers-reduced-motion）

---

## 🔴 高優先度改善項目

### 1.1 セッション有効期限の短縮

優先度: 🔴 高
実装時間: 30分
影響度: セキュリティ向上

#### 問題点
```typescript
// src/lib/constants/config.ts (L43)
sessionExpirationHours: 24 * 7, // 1週間 - 長すぎる
```

- 共有デバイスでのセキュリティリスク
- OWASP推奨値を超過

#### 解決策
```typescript
// src/lib/constants/config.ts
export const AUTH = {
  sessionExpirationHours: 24, // 24時間に短縮
  // または
  sessionExpirationHours: 12, // さらに厳格に
};
```

#### 実装ステップ
1. `src/lib/constants/config.ts` の `AUTH.sessionExpirationHours` を `24` に変更
2. ドキュメントに記載
3. ビルド確認

---

### 1.2 検索機能にDebounce適用

優先度: 🔴 高
実装時間: 1時間
影響度: パフォーマンス向上（30-50%）

#### 問題点
```typescript
// src/components/residents-grid.tsx (L109-115)
<input
  type="search"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)} // キーストロークごとに再フィルタリング
/>
```

- 日本語入力時のパフォーマンス低下
- 不要な再レンダリング

#### 解決策
```typescript
import { useDebounce } from "@/hooks/use-debounce";

const [searchQuery, setSearchQuery] = useState("");
const debouncedSearchQuery = useDebounce(searchQuery, 300);

const filteredAndSortedProfiles = useMemo(() => {
  let result = [...profiles];

  if (debouncedSearchQuery.trim()) { // debouncedを使用
    const query = debouncedSearchQuery.toLowerCase();
    result = result.filter(/* ... */);
  }

  return result;
}, [profiles, debouncedSearchQuery, sortBy, currentUserId, locale]);
```

#### 実装ステップ
1. `src/components/residents-grid.tsx` に `useDebounce` をインポート
2. `searchQuery` を debounce 化
3. `filteredAndSortedProfiles` の依存配列を更新
4. テスト実行

---

### 1.3 CSPポリシーの改善

優先度: 🔴 高
実装時間: 2-3時間
影響度: セキュリティ向上（XSS対策）

#### 問題点
```typescript
// next.config.ts (L48)
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
"style-src 'self' 'unsafe-inline'",
```

- `'unsafe-inline'` と `'unsafe-eval'` は XSS 攻撃に脆弱
- Tailwind CSS のインラインスタイル生成に起因

#### 解決策（段階的）

ステップ1: 調査
```bash
# Tailwind CSS 4 の CSP 対応を確認
npm run build -- --profile
```

ステップ2: Nonce-based CSP（Next.js 15+）
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
  `;

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);

  return response;
}
```

#### 実装ステップ
1. 現在の CSP 設定をコメントアウト
2. Nonce 生成ミドルウェアを追加
3. `app/layout.tsx` で nonce を取得
4. ビルド・テスト

注意: Tailwind CSS 4 が完全対応していない場合、この改善は保留

---

### 1.4 キャッシュ戦略の統一

優先度: 🔴 高
実装時間: 3-4時間
影響度: パフォーマンス向上、保守性向上

#### 問題点
```typescript
// パターン1（profile/actions.ts）
revalidatePath("/");
revalidatePath(`/profile/${user.id}`);

// パターン2（tea-time/actions.ts）
revalidatePath("/");
revalidatePath("/tea-time");
revalidatePath("/settings");

// パターン3（auth/actions.ts）
revalidatePath("/");
```

- キャッシュ戦略が各ファイルに分散
- 保守性が低い
- パフォーマンス最適化が不統一

#### 解決策
```typescript
// src/lib/utils/cache.ts (新規作成)
import { revalidatePath } from "next/cache";

export const CacheStrategy = {
  /
   * プロフィール更新後のキャッシュ再検証
   */
  afterProfileUpdate: (userId: string) => {
    revalidatePath("/");
    revalidatePath(`/profile/[id]`, "page");
    revalidatePath("/settings");
  },

  /
   * ティータイム設定更新後のキャッシュ再検証
   */
  afterTeaTimeUpdate: () => {
    revalidatePath("/");
    revalidatePath("/tea-time");
    revalidatePath("/settings");
  },

  /
   * 認証後のキャッシュ再検証
   */
  afterAuth: () => {
    revalidatePath("/", "layout");
  },

  /
   * 全体キャッシュクリア（管理用）
   */
  clearAll: () => {
    revalidatePath("/", "layout");
  },
};
```

#### 実装ステップ
1. `src/lib/utils/cache.ts` を新規作成
2. 各アクションファイルで `CacheStrategy` をインポート
3. 既存の `revalidatePath` を置き換え
4. テスト実行

---

### 1.5 UUID検証の重複削除

優先度: 🔴 高
実装時間: 2時間
影響度: コード品質向上

#### 問題点
```typescript
// src/lib/tea-time/actions.ts (L185-188)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(matchId)) {
  return { error: t("errors.invalidInput") };
}

// 一方で、isValidUUID 関数が既にある
// src/lib/security/validation.ts (L24)
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

- 同じ正規表現が重複定義
- 保守性が低い

#### 解決策
```typescript
// src/lib/tea-time/actions.ts
import { isValidUUID } from "@/lib/security/validation";

// 変更前
const uuidRegex = /^[0-9a-f]{8}-...$/i;
if (!uuidRegex.test(matchId)) {
  return { error: t("errors.invalidInput") };
}

// 変更後
if (!isValidUUID(matchId)) {
  return { error: t("errors.invalidInput") };
}
```

#### 実装ステップ
1. `src/lib/tea-time/actions.ts` の全 UUID チェックを確認
2. `isValidUUID` をインポート
3. 重複コードを削除
4. テスト実行

---

## 🟡 中優先度改善項目

### 2.1 Next.js Image コンポーネント導入

優先度: 🟡 中（影響度大）
実装時間: 6-8時間
影響度: パフォーマンス大幅向上（LCP 30-50%改善）

#### 問題点
```typescript
// 現在：Avatar コンポーネントは <img> を使用
<Avatar className="w-full h-full rounded-none">
  <AvatarImage
    src={profile.avatar_url || undefined}
    alt={...}
    className="object-cover w-full h-full"
  />
</Avatar>
```

- 自動WebP変換なし
- 遅延読み込み（lazy loading）なし
- レスポンシブ画像なし
- LCP（Largest Contentful Paint）に悪影響

#### 解決策

オプション1: Avatar コンポーネントを拡張
```typescript
// src/components/ui/avatar.tsx に追加
import Image from "next/image";

interface OptimizedAvatarImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedAvatarImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 100vw, 200px"
}: OptimizedAvatarImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      priority={priority}
      sizes={sizes}
    />
  );
}
```

オプション2: Supabase Storage の画像変換を使用
```typescript
// src/lib/utils/image.ts (新規)
export function getOptimizedImageUrl(
  url: string | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): string | null {
  if (!url) return null;

  const { width = 400, height = 400, quality = 80 } = options;

  // Supabase Storage の画像変換機能を使用
  if (url.includes('supabase.co/storage')) {
    return `${url}?width=${width}&height=${height}&quality=${quality}`;
  }

  return url;
}
```

#### 実装ステップ
1. 調査フェーズ（1-2時間）
   - Radix UI Avatar と Next.js Image の互換性確認
   - Supabase Storage の画像変換機能の調査

2. 実装フェーズ（4-6時間）
   - 画像最適化ユーティリティ作成
   - Avatar コンポーネントの更新
   - 全コンポーネントでの置き換え
   - テスト

3. 検証フェーズ（1-2時間）
   - Lighthouse スコア測定
   - LCP 改善確認

注意事項:
- Next.js Image は `position: relative` を親要素に要求
- Radix UI Avatar との互換性に注意
- 大規模変更なので慎重に実施

---

### 2.2 アクセシビリティ改善

優先度: 🟡 中
実装時間: 4-6時間
影響度: UX向上、WCAG準拠

#### 問題点

2.2.1 ローディング状態の欠落
```typescript
// src/components/profile-edit-form.tsx (L488-506)
<button
  type="submit"
  disabled={isLoading || isUploading}
  className="..."
>
  {isLoading ? <spinner /> : t("profile.saveChanges")}
</button>
```

問題: `aria-busy` や動的な `aria-label` がない

解決策:
```typescript
<button
  type="submit"
  disabled={isLoading || isUploading}
  aria-busy={isLoading}
  aria-label={isLoading ? t("a11y.saving") : t("profile.saveChanges")}
  className="..."
>
  {isLoading ? <spinner /> : t("profile.saveChanges")}
</button>
```

2.2.2 エラー表示のロール
```typescript
// 現在
{error && (
  <motion.div className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]">
    <p className="text-sm text-[#8b6b6b]">{error}</p>
  </motion.div>
)}

// 改善後
{error && (
  <motion.div
    role="alert"
    aria-live="polite"
    className="py-3 px-4 bg-[#faf8f8] border-l-2 border-[#c9a0a0]"
  >
    <p className="text-sm text-[#8b6b6b]">{error}</p>
  </motion.div>
)}
```

2.2.3 タッチターゲットサイズ
```typescript
// src/components/mobile-nav.tsx
// 現在: 22px アイコン
<Icon size={22} strokeWidth={active ? 2 : 1.5} />

// WCAG 推奨: 最小 44x44px
// 改善: padding で実効タッチ領域を拡張
<Link
  className="relative flex flex-col items-center justify-center flex-1 h-full px-4 py-3"
  // h-full (64px) × px-4 (32px) = 十分なタッチ領域
>
  <Icon size={24} strokeWidth={active ? 2 : 1.5} />
</Link>
```

#### 実装ステップ
1. 翻訳キーの追加（`a11y.saving` など）
2. 全フォームボタンに `aria-busy` 追加
3. エラー表示に `role="alert"` 追加
4. モバイルナビのタッチ領域拡張
5. axe DevTools で検証

---

### 2.3 エラーハンドリング強化

優先度: 🟡 中
実装時間: 3-4時間
影響度: デバッグ容易性向上

#### 問題点
```typescript
// src/app/error.tsx (L15-17)
useEffect(() => {
  console.error("Application error:", error);
}, [error]);
```

- コンソール出力のみ
- プロダクション環境での追跡困難
- エラーの digest（Next.js が提供）が未使用

#### 解決策（段階的）

ステップ1: ログ出力の改善
```typescript
// src/lib/utils/logger.ts (新規)
export function logError(
  error: unknown,
  context?: {
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // 開発環境
  if (process.env.NODE_ENV === "development") {
    console.error("[AppError]", errorInfo);
  }

  // プロダクション環境（将来的に Sentry 等に送信）
  if (process.env.NODE_ENV === "production") {
    // TODO: Sentry.captureException(error, { contexts: { ...context } });
    console.error("[AppError]", errorInfo);
  }
}
```

ステップ2: エラー境界での使用
```typescript
// src/app/error.tsx
import { logError } from "@/lib/utils/logger";

useEffect(() => {
  logError(error, {
    action: "error-boundary",
    metadata: { digest: error.digest },
  });
}, [error]);
```

#### 実装ステップ
1. `src/lib/utils/logger.ts` を作成
2. 既存の `console.error` を `logError` に置き換え
3. サーバーアクションでも使用
4. （将来）Sentry 統合の準備

---

### 2.4 型安全性の向上

優先度: 🟡 中
実装時間: 3-4時間
影響度: バグ防止

#### 問題点
```typescript
// src/hooks/use-async.ts
const execute = useCallback(
  async (data: T): Promise<boolean> => {
    // ...
  },
  [action, options]  // options がオブジェクトの場合、毎回新しい参照
);
```

- `options` が依存配列に含まれているが、オブジェクトなので毎回再生成される可能性
- 無限ループのリスク

#### 解決策
```typescript
// オプション1: options を分解
const execute = useCallback(
  async (data: T): Promise<boolean> => {
    // ...
  },
  [action, options?.onSuccess, options?.onError]
);

// オプション2: useMemo でメモ化
const memoizedOptions = useMemo(() => options, [
  options?.onSuccess,
  options?.onError
]);

const execute = useCallback(
  async (data: T): Promise<boolean> => {
    // ...
  },
  [action, memoizedOptions]
);
```

#### 実装ステップ
1. `use-async.ts` の依存配列を見直し
2. テストケースで無限ループを確認
3. 修正実施
4. テスト実行

---

### 2.5 フォーム最適化

優先度: 🟡 中
実装時間: 4-6時間
影響度: パフォーマンス向上

#### 問題点
```typescript
// src/components/profile-edit-form.tsx
const [formData, setFormData] = useState({
  name: profile.name,
  room_number: profile.room_number || "",
  bio: profile.bio || "",
  interests: profile.interests?.join(", ") || "",
  mbti: profile.mbti || ("" as MBTIType | ""),
  move_in_date: profile.move_in_date || "",
});

// 各 input で onChange を呼ぶたびに全体が再レンダリング
onChange={(e) => setFormData({ ...formData, name: e.target.value })}
```

- 6つの state が1つのオブジェクトに集約
- 1つの input 変更で全フォームが再レンダリング

#### 解決策（React 19 対応）

オプション1: useFormState + useFormStatus
```typescript
import { useFormState, useFormStatus } from "react";

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [state, formAction] = useFormState(updateProfile, null);

  return (
    <form action={formAction}>
      <input name="name" defaultValue={profile.name} />
      <input name="room_number" defaultValue={profile.room_number || ""} />
      {/* ... */}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? <spinner /> : "保存"}
    </button>
  );
}
```

オプション2: 個別 state に分割
```typescript
const [name, setName] = useState(profile.name);
const [roomNumber, setRoomNumber] = useState(profile.room_number || "");
const [bio, setBio] = useState(profile.bio || "");
// ...
```

#### 実装ステップ
1. プロファイリングで再レンダリングを測定
2. React DevTools でパフォーマンス確認
3. 最適化手法を選択
4. 実装・テスト

注意: React 19 の機能を使う場合、互換性確認が必要

---

## 🟢 低優先度改善項目

### 3.1 サーバーアクションのテスト追加

優先度: 🟢 低（長期的に重要）
実装時間: 8-10時間
影響度: 品質保証

#### 対象ファイル
- `src/lib/auth/actions.ts`
- `src/lib/profile/actions.ts`
- `src/lib/tea-time/actions.ts`

#### 実装例
```typescript
// src/__tests__/lib/profile/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { updateProfile } from "@/lib/profile/actions";

describe("updateProfile", () => {
  it("should validate input before updating", async () => {
    const result = await updateProfile({
      name: "", // 無効な入力
      room_number: null,
      bio: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toHaveProperty("error");
  });

  it("should require authentication", async () => {
    // モック Supabase クライアントで未認証をシミュレート
    vi.mock("@/lib/supabase/server", () => ({
      createClient: () => ({
        auth: {
          getUser: () => ({ data: { user: null } })
        }
      })
    }));

    const result = await updateProfile({
      name: "Test",
      room_number: null,
      bio: null,
      interests: [],
      mbti: null,
      move_in_date: null,
    });

    expect(result).toHaveProperty("error");
  });
});
```

#### 実装ステップ
1. テストファイル構造の設計
2. Supabase クライアントのモック作成
3. 各アクションのテストケース作成
4. カバレッジ測定

---

### 3.2 JSDocドキュメント追加

優先度: 🟢 低
実装時間: 6時間
影響度: 保守性向上

#### 対象
- 複雑なコンポーネント（ProfileDetail, ResidentsGrid, ProfileEditForm）
- ユーティリティ関数
- カスタムフック

#### 実装例
```typescript
/
 * 住民プロフィール詳細コンポーネント
 *
 * プロフィール情報を表示し、編集ページへのリンクを提供します。
 * モックプロフィール（未登録ユーザー）の場合、特別なバナーを表示します。
 *
 * @component
 * @example
 * ```tsx
 * const profile = {
 *   id: "123",
 *   name: "山田太郎",
 *   room_number: "301",
 *   bio: "よろしくお願いします",
 *   // ...
 * };
 *
 * <ProfileDetail
 *   profile={profile}
 *   isOwnProfile={true}
 *   teaTimeEnabled={false}
 * />
 * ```
 *
 * @param {Object} props
 * @param {Profile} props.profile - 表示するプロフィール情報
 * @param {boolean} props.isOwnProfile - 自分のプロフィールかどうか
 * @param {boolean} [props.teaTimeEnabled=false] - ティータイム参加状態
 * @returns {React.ReactElement}
 */
export function ProfileDetail({
  profile,
  isOwnProfile,
  teaTimeEnabled,
}: ProfileDetailProps) {
  // ...
}
```

#### 実装ステップ
1. ドキュメント生成ツール（TypeDoc）の導入検討
2. 重要コンポーネントから順次追加
3. VSCode でのホバー表示確認

---

### 3.3 エラー追跡サービス統合

優先度: 🟢 低（プロダクション前に必須）
実装時間: 4-6時間
影響度: 運用時の問題追跡

#### 推奨サービス
- Sentry: 最もポピュラー、Next.js サポート充実
- LogRocket: セッションリプレイ機能あり
- Bugsnag: シンプルで使いやすい

#### 実装例（Sentry）
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// src/lib/utils/logger.ts に統合
import * as Sentry from "@sentry/nextjs";

export function logError(error: unknown, context?: any) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  }
  console.error("[AppError]", error);
}
```

#### 実装ステップ
1. Sentry アカウント作成
2. Next.js プロジェクトに統合
3. エラー境界で使用
4. ソースマップのアップロード設定

---

### 3.4 パスワード強度チェック

優先度: 🟢 低
実装時間: 2-3時間
影響度: セキュリティ向上

#### 現状
```typescript
// src/lib/constants/config.ts
passwordMinLength: 10,
```

- 長さのみのチェック
- 強度評価なし

#### 解決策
```typescript
// src/lib/validations/password.ts (新規)
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // 長さチェック
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;

  // 文字種チェック
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("大文字を含めてください");
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("小文字を含めてください");
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("数字を含めてください");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push("記号を含めてください");
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 4,
  };
}
```

#### 実装ステップ
1. パスワード強度チェック関数を作成
2. ログインページに強度メーターを追加
3. リアルタイムフィードバック実装

---

## 📊 その他の推奨事項

### パフォーマンス監視

```typescript
// src/lib/utils/performance.ts
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === "production") {
    // Google Analytics 等に送信
    // または Vercel Analytics
  }
  console.log(metric);
}

// app/layout.tsx で使用
export { reportWebVitals };
```

### モーション配慮

```typescript
// src/lib/utils/motion.ts
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// コンポーネントで使用
const prefersReducedMotion = shouldReduceMotion();

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={prefersReducedMotion ? false : { opacity: 1 }}
>
  {/* ... */}
</motion.div>
```

---

## 🎯 実装優先度マトリックス

| 項目 | 優先度 | 実装時間 | 影響度 | 実装順序 |
|------|--------|----------|--------|----------|
| セッション有効期限短縮 | 🔴 高 | 30分 | 中 | 1 |
| 検索Debounce適用 | 🔴 高 | 1時間 | 中 | 2 |
| UUID検証統一 | 🔴 高 | 2時間 | 低 | 3 |
| キャッシュ戦略統一 | 🔴 高 | 3-4時間 | 中 | 4 |
| CSP改善 | 🔴 高 | 2-3時間 | 高 | 5 |
| アクセシビリティ改善 | 🟡 中 | 4-6時間 | 中 | 6 |
| エラーハンドリング強化 | 🟡 中 | 3-4時間 | 中 | 7 |
| Next.js Image導入 | 🟡 中 | 6-8時間 | 高 | 8 |
| 型安全性向上 | 🟡 中 | 3-4時間 | 低 | 9 |
| フォーム最適化 | 🟡 中 | 4-6時間 | 中 | 10 |
| テスト追加 | 🟢 低 | 8-10時間 | 高 | 11 |
| JSDoc追加 | 🟢 低 | 6時間 | 低 | 12 |
| エラー追跡統合 | 🟢 低 | 4-6時間 | 高 | 13 |
| パスワード強度 | 🟢 低 | 2-3時間 | 低 | 14 |

---

## 📝 実装ログ

### 2026-01-28

#### フェーズ1: 高優先度改善
- [x] ドキュメント作成
- [x] 1.1 セッション有効期限を24時間に短縮 (config.ts)
- [x] 1.2 検索機能にDebounce適用 (residents-grid.tsx)
- [x] 1.5 UUID検証の重複削除 (tea-time/actions.ts)
- [x] 1.4 キャッシュ戦略の統一
  - `src/lib/utils/cache.ts` を新規作成
  - `src/lib/profile/actions.ts` で使用
  - `src/lib/tea-time/actions.ts` で使用
  - `src/lib/auth/actions.ts` で使用
- [x] ビルド & テスト実行 - 全て成功 ✅

#### リーダブルコード改善
- [x] `CODING_GUIDELINES.md` を作成
  - リーダブルコードの原則を明文化
  - コメントのベストプラクティス
  - 命名規則、関数設計、コンポーネント設計
  - 型安全性、テスト可能性、パフォーマンス
- [x] 不要コメントのクリーンアップ
  - 約50件以上の自明なコメントを削除
  - WHATを説明するコメントを削除
  - セクション分割の単純なコメントを削除
  - WHYを説明する重要なコメントは保持
  - 影響ファイル: `app/page.tsx`, `header.tsx`, `mobile-nav.tsx`, `auth/actions.ts`, `profile/actions.ts`, `tea-time/actions.ts`, `tea-time/matching.ts`
- [x] ESLint警告の修正
- [x] `README.md` にコーディングガイドラインへのリンクを追加
- [x] 最終ビルド & テスト - 全て成功 ✅

---

## 💡 新機能アイデア

### 1. 住人の部屋自慢写真機能

優先度: 🟡 中
実装時間: 4-6時間
影響度: コミュニティ活性化

#### 概要
各住人が自分の部屋の写真を投稿・共有できる機能。シェアハウス内でのコミュニケーション促進と、住人同士の理解を深めることを目的とする。

#### 要件
- プロフィールページまたは専用ページに「部屋自慢」セクションを追加
- 写真アップロード機能（複数枚対応）
- 写真にキャプション（説明文）を追加可能
- 自分の部屋写真のみ編集・削除可能（RLS）
- 他の住人の部屋写真は閲覧のみ

#### 技術的考慮事項
- Supabase Storageに写真を保存
- 既存の`uploadAvatar`機能を参考に実装
- 画像リサイズ・最適化を検討
- ストレージ容量の管理（無料枠の制限）

#### 実装ステップ
1. データベーススキーマ追加（`room_photos`テーブル）
2. ストレージバケット作成（`room-photos`）
3. アップロード機能の実装
4. UIコンポーネントの作成
5. RLSポリシーの設定

---

### 2. Wi-Fi情報管理ページ

優先度: 🟡 中
実装時間: 2-3時間
影響度: 利便性向上

#### 概要
各階のWi-Fi情報（SSID、パスワード、備考）を集約管理するページ。新入居者やゲストへの情報提供を容易にする。

#### 要件
- 各階のWi-Fi情報を一覧表示
- SSID、パスワード、備考（例: 「2階東側」）を表示
- パスワードはクリックでコピー可能
- 管理者のみ編集可能（または全員編集可能）
- セキュリティ: パスワードは暗号化保存を検討

#### 技術的考慮事項
- 新規テーブル: `wifi_info`（floor, ssid, password, notes）
- パスワードの暗号化（環境変数で暗号化キー管理）
- または、管理者のみが編集可能な設定として実装

#### 実装ステップ
1. データベーススキーマ追加（`wifi_info`テーブル）
2. 管理ページの作成（`/wifi`）
3. パスワード表示・コピー機能
4. 編集機能（権限チェック）

---

### 3. ゴミ出しスケジュール管理 + プッシュ通知

優先度: 🔴 高
実装時間: 8-12時間
影響度: 生活品質向上

#### 概要
ゴミ出しのスケジュールを管理し、担当者に決まった時間にプッシュ通知を送信する機能。シェアハウスの生活ルール遵守を支援する。

#### 要件
- ゴミ出しスケジュールの作成・編集・削除
- 担当者の割り当て（ローテーション対応）
- 通知時刻の設定（例: 前日の20時、当日の朝7時）
- プッシュ通知の送信機能
- 通知履歴の確認

#### 技術的考慮事項
- 新規テーブル: `garbage_schedule`（date, type, assigned_user_id, notified_at）
- プッシュ通知の実装方法:
  - Web Push API（ブラウザ通知）
  - または、メール通知（Supabase Functions）
  - または、LINE通知（LINE Notify API）
- スケジュール実行: Vercel Cron Jobs または Supabase Edge Functions
- 通知の重複防止

#### 実装ステップ
1. データベーススキーマ追加
2. スケジュール管理UIの作成（`/garbage`）
3. 通知送信機能の実装（Web Push API または メール）
4. Cron Job / Edge Function の設定
5. 通知履歴の表示

#### 通知実装の選択肢
- **Web Push API**: ブラウザ通知、実装が比較的簡単、ユーザーがブラウザを開いている必要がある
- **メール通知**: Supabase Functions + SendGrid等、確実に届く
- **LINE通知**: LINE Notify API、既存のLINEログインと統合しやすい

---

## 🔗 参考リンク

- [OWASP セキュリティガイド](https://owasp.org/)
- [WCAG 2.2 ガイドライン](https://www.w3.org/WAI/WCAG22/quickref/)
- [Next.js パフォーマンス最適化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React 19 新機能](https://react.dev/blog/2024/04/25/react-19)
