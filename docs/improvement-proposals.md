# 改善提案書 - Share House Portal

## 概要

本ドキュメントは、Share House Portal (Web + Mobile) の包括的なコード分析に基づく改善提案をまとめたものです。

**分析範囲:**
- Web アプリケーション (Next.js 16 / React)
- Mobile アプリケーション (Expo / React Native)
- Supabase 統合 (RLS / Storage / Auth)
- テスト・開発環境

---

## 目次

1. [セキュリティ (CRITICAL)](#1-セキュリティ-critical)
2. [パフォーマンス最適化](#2-パフォーマンス最適化)
3. [コード品質改善](#3-コード品質改善)
4. [アクセシビリティ・UX](#4-アクセシビリティux)
5. [Mobile 機能完成](#5-mobile-機能完成)
6. [テストカバレッジ](#6-テストカバレッジ)
7. [実装計画](#7-実装計画)

---

## 1. セキュリティ (CRITICAL)

### 1.1 RLS ポリシー脆弱性 [CRITICAL]

**ファイル:** `supabase/migrations/020_create_share_items.sql` (lines 44-45)

**問題:** Share Items の UPDATE ポリシーが過度に permissive

```sql
-- 現状: 誰でも "available" ステータスのアイテムを更新可能
create policy "Shareの更新ポリシー"
  on public.share_items for update to authenticated
  using (auth.uid() = user_id or status = 'available');
```

**リスク:** ユーザーAが他ユーザーBの `claimed_by` フィールドを不正に変更可能

**修正案:**
```sql
create policy "Shareの更新ポリシー"
  on public.share_items for update to authenticated
  using (
    auth.uid() = user_id OR
    (status = 'available' AND claimed_by IS NULL)
  )
  with check (
    auth.uid() = user_id OR
    (claimed_by = auth.uid() AND status = 'claimed')
  );
```

**工数:** 1時間

---

### 1.2 Storage RLS ポリシー未定義 [HIGH]

**ファイル:** `supabase/migrations/012_create_room_photos_bucket.sql`

**問題:** room-photos バケットに Storage RLS ポリシーが定義されていない

**リスク:** 認証済みユーザーが他ユーザーの写真を削除/上書き可能

**修正案:**
```sql
-- Upload policy
create policy "Users can upload room photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'room-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Delete policy
create policy "Users can delete own room photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'room-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**工数:** 2時間

---

### 1.3 レート制限の拡張 [MEDIUM]

**ファイル:** `src/lib/security/rate-limit.ts`

**問題:** 書き込み操作にレート制限がない
- Bulletin POST
- Share Item POST
- Event POST

**リスク:** スパム投稿、DoS 攻撃

**修正案:**
```typescript
export const RateLimiters = {
  // 既存
  auth: createRateLimiter("auth", PRESETS.auth),
  upload: createRateLimiter("upload", PRESETS.upload),
  // 追加
  bulletin: createRateLimiter("bulletin", { max: 10, windowMs: 60_000 }),
  share: createRateLimiter("share", { max: 5, windowMs: 60_000 }),
  event: createRateLimiter("event", { max: 3, windowMs: 60_000 }),
};
```

**工数:** 2時間

---

## 2. パフォーマンス最適化

### 2.1 N+1 クエリ解消 [HIGH]

**ファイル:** `src/lib/residents/queries.ts` (lines 75-79)

**問題:** profiles と latest_bulletins を別クエリで取得

**修正案:** Supabase View を作成
```sql
CREATE VIEW residents_with_latest_bulletin AS
SELECT
  p.*,
  (SELECT message FROM bulletins b WHERE b.user_id = p.user_id ORDER BY created_at DESC LIMIT 1) as latest_bulletin
FROM profiles p;
```

**工数:** 3時間

---

### 2.2 FlatList 最適化 (Mobile) [HIGH]

**ファイル:**
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/bulletin.tsx`
- `mobile/app/(tabs)/events.tsx`
- `mobile/app/(tabs)/share.tsx`

**問題:** FlatList にパフォーマンス最適化 props が未設定

**修正案:**
```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  // 追加
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={8}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

**工数:** 4時間 (全4画面)

---

### 2.3 画像最適化 (Web) [MEDIUM]

**ファイル:** `src/components/events-content.tsx` (lines 978-1002)

**問題:**
- `priority` prop 未設定 (First Contentful Paint 遅延)
- `placeholder="blur"` 未設定 (CLS 悪化)

**修正案:**
```tsx
<Image
  src={event.cover_image_url}
  alt={`Event cover: ${event.title}`}
  fill
  priority={isFirstVisible}
  placeholder="blur"
  blurDataURL={PLACEHOLDER_BLUR_DATA_URL}
  sizes="(min-width: 1024px) 448px, 100vw"
/>
```

**工数:** 2時間

---

### 2.4 Real-time 購読最適化 (Mobile) [MEDIUM]

**ファイル:** `mobile/app/(tabs)/bulletin.tsx` (lines 60-73)

**問題:** 全データ再取得（差分更新なし）

**修正案:**
```typescript
.on("postgres_changes", { event: "INSERT", ... }, (payload) => {
  // 差分のみ追加
  setMessages(prev => [payload.new as BulletinMessage, ...prev]);
})
.on("postgres_changes", { event: "DELETE", ... }, (payload) => {
  setMessages(prev => prev.filter(m => m.id !== payload.old.id));
})
```

**工数:** 3時間

---

## 3. コード品質改善

### 3.1 カスタムフック抽出 [HIGH]

重複パターンを共通化

| Hook 名 | 用途 | 対象ファイル数 | 削減行数 |
|---------|------|---------------|---------|
| `useImagePreview()` | 画像プレビュー + Object URL 管理 | 3 | ~40行 |
| `useBodyScrollLock()` | Modal 表示時の背景スクロール抑止 | 4 | ~10行 |
| `useKeyDown()` | キーボードショートカット (Escape等) | 4 | ~10行 |

**ファイル作成:** `src/hooks/use-image-preview.ts`

```typescript
export function useImagePreview() {
  const [preview, setPreview] = useState<string | null>(null);

  const handleSelect = useCallback((file: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }, [preview]);

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }, [preview]);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  return { preview, handleSelect, handleRemove };
}
```

**工数:** 4時間

---

### 3.2 サーバーアクション応答型統一 [MEDIUM]

**問題:**
- `events/actions.ts`: `{ success: true } | { error: string }`
- `share/actions.ts`: `{ success: true } | { success: false; error: string }`

**修正案:**
```typescript
// src/lib/types/action-response.ts
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**工数:** 3時間

---

### 3.3 FeedbackMessage コンポーネント作成 [MEDIUM]

**問題:** エラー/成功メッセージのスタイリングが不統一

**修正案:**
```typescript
// src/components/ui/feedback-message.tsx
export function FeedbackMessage({
  type,
  message
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div className={cn(
      "rounded-xl px-4 py-3 border-l-4",
      type === "success" && "bg-success-bg/50 border-success text-success",
      type === "error" && "bg-error-bg/50 border-error text-error"
    )}>
      {message}
    </div>
  );
}
```

**工数:** 1時間

---

### 3.4 大規模コンポーネント分割 [MEDIUM]

| ファイル | 行数 | 分割提案 |
|---------|------|---------|
| `events-content.tsx` | 1,158 | `EventComposeModal`, `AttendeesModal`, `EventCard` に分割 |
| `profile-edit-form.tsx` | 955 | `ProfileFormFields`, `AvatarUpload`, `SocialLinksForm` に分割 |
| `bulletin-board.tsx` | 915 | `BulletinComposeModal`, `BulletinItem` に分割 |

**工数:** 6時間

---

## 4. アクセシビリティ・UX

### 4.1 モーダルのフォーカストラップ [HIGH]

**ファイル:**
- `src/components/events-content.tsx`
- `src/components/bulletin-board.tsx`
- `src/components/share-content.tsx`

**問題:** モーダル外へのフォーカス移動が可能（WCAG 2.1 Level AA 違反）

**修正案:**
```typescript
import { FocusTrap } from 'focus-trap-react';

<FocusTrap active={isOpen}>
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    {/* モーダルコンテンツ */}
  </div>
</FocusTrap>
```

**工数:** 4時間

---

### 4.2 Reduced Motion 対応 [MEDIUM]

**ファイル:** `src/components/bulletin-board.tsx` (skeletons)

**問題:** `animate-pulse` がモーション感度の高いユーザーに影響

**修正案:**
```typescript
const shouldReduceMotion = useReducedMotion();

<div className={shouldReduceMotion ? "bg-muted/20" : "animate-pulse"}>
```

**工数:** 2時間

---

### 4.3 画像 alt テキスト改善 [LOW]

**問題:** `alt={event.title}` のみで文脈不足

**修正案:**
```typescript
// src/lib/utils/accessibility.ts
export const getImageAlt = {
  eventCover: (title: string) => `イベントカバー: ${title}`,
  profileAvatar: (name: string) => `${name}のプロフィール写真`,
  shareItemImage: (title: string) => `シェアアイテム: ${title}`,
};
```

**工数:** 1時間

---

## 5. Mobile 機能完成

### 5.1 未実装ページ [CRITICAL]

| ページ | 現状 | 優先度 |
|--------|------|--------|
| イベント詳細 (`events/[id].tsx`) | プレースホルダーのみ | HIGH |
| イベント作成モーダル | TODO コメント | HIGH |
| シェア作成モーダル | TODO コメント | HIGH |
| プロフィール編集 | 未作成 | HIGH |
| 設定画面の各機能 | No-op | MEDIUM |

**工数:** 20時間

---

### 5.2 Web にあり Mobile にない機能

| 機能 | Web パス | 優先度 |
|------|---------|--------|
| Admin パネル | `/admin` | LOW (Web only 可) |
| フロアプラン | `/floor-plan` | MEDIUM |
| ルーム写真 | `/room-photos` | HIGH |
| Tea Time マッチング | `/tea-time` | MEDIUM |
| 統計ダッシュボード | `/stats` | LOW |

**工数:** 40時間+

---

### 5.3 オフライン対応 [MEDIUM]

**問題:** ネットワーク切断時の動作未定義

**修正案:**
1. AsyncStorage でキャッシュ
2. NetInfo で接続状態監視
3. Stale-While-Revalidate パターン

```typescript
// mobile/hooks/use-cached-data.ts
export function useCachedData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    // 1. キャッシュから即時読み込み
    AsyncStorage.getItem(key).then(cached => {
      if (cached) {
        setData(JSON.parse(cached));
        setIsStale(true);
      }
    });

    // 2. ネットワークから最新取得
    fetcher().then(fresh => {
      setData(fresh);
      setIsStale(false);
      AsyncStorage.setItem(key, JSON.stringify(fresh));
    });
  }, [key]);

  return { data, isStale };
}
```

**工数:** 8時間

---

## 6. テストカバレッジ

### 6.1 現状

| カテゴリ | ファイル数 | テスト数 | カバレッジ |
|---------|-----------|---------|-----------|
| Web Components | 32 | 1 | ~3% |
| Web Lib | 43 | 5 | ~12% |
| Mobile | 25 | 0 | 0% |

### 6.2 優先テスト対象

**Critical Path:**
1. `src/lib/security/rate-limit.ts` ✅ (テスト済み)
2. `src/lib/security/validation.ts` (未テスト)
3. `src/lib/profile/actions.ts` (未テスト)
4. `src/lib/share/actions.ts` (未テスト)
5. `mobile/lib/auth.tsx` (未テスト)

**推奨テストファイル:**
```
src/__tests__/
├── lib/
│   ├── security/
│   │   └── validation.test.ts     # 追加
│   ├── profile/
│   │   └── actions.test.ts        # 追加
│   └── share/
│       └── actions.test.ts        # 追加
└── components/
    ├── events-content.test.tsx    # 追加
    └── bulletin-board.test.tsx    # 追加
```

**工数:** 16時間

---

## 7. 実装計画

### Phase 1: セキュリティ修正 (Week 1)

| タスク | 工数 | 担当 |
|--------|------|------|
| RLS ポリシー修正 (share_items) | 1h | - |
| Storage RLS ポリシー追加 | 2h | - |
| レート制限拡張 | 2h | - |
| **合計** | **5h** | |

### Phase 2: パフォーマンス (Week 1-2)

| タスク | 工数 | 担当 |
|--------|------|------|
| FlatList 最適化 (Mobile) | 4h | - |
| N+1 クエリ解消 (View 作成) | 3h | - |
| Real-time 差分更新 | 3h | - |
| 画像最適化 (priority/blur) | 2h | - |
| **合計** | **12h** | |

### Phase 3: Mobile 機能完成 (Week 2-3)

| タスク | 工数 | 担当 |
|--------|------|------|
| イベント詳細ページ | 6h | - |
| イベント作成モーダル | 6h | - |
| シェア作成モーダル | 4h | - |
| プロフィール編集 | 4h | - |
| **合計** | **20h** | |

### Phase 4: コード品質 (Week 3-4)

| タスク | 工数 | 担当 |
|--------|------|------|
| カスタムフック抽出 | 4h | - |
| FeedbackMessage コンポーネント | 1h | - |
| サーバーアクション型統一 | 3h | - |
| 大規模コンポーネント分割 | 6h | - |
| **合計** | **14h** | |

### Phase 5: アクセシビリティ (Week 4)

| タスク | 工数 | 担当 |
|--------|------|------|
| フォーカストラップ実装 | 4h | - |
| Reduced Motion 対応 | 2h | - |
| alt テキスト改善 | 1h | - |
| **合計** | **7h** | |

### Phase 6: テスト拡充 (Ongoing)

| タスク | 工数 | 担当 |
|--------|------|------|
| validation.test.ts | 4h | - |
| profile/actions.test.ts | 4h | - |
| share/actions.test.ts | 4h | - |
| Mobile auth.test.ts | 4h | - |
| **合計** | **16h** | |

---

## 総工数サマリー

| Phase | 工数 | 優先度 |
|-------|------|--------|
| Phase 1: セキュリティ | 5h | CRITICAL |
| Phase 2: パフォーマンス | 12h | HIGH |
| Phase 3: Mobile 機能 | 20h | HIGH |
| Phase 4: コード品質 | 14h | MEDIUM |
| Phase 5: アクセシビリティ | 7h | MEDIUM |
| Phase 6: テスト | 16h | MEDIUM |
| **合計** | **74h** | |

---

## 付録: ファイル別改善箇所一覧

<details>
<summary>Web - src/components/ (クリックで展開)</summary>

| ファイル | 行 | 問題 | 修正案 |
|---------|-----|------|--------|
| `events-content.tsx` | 67-88 | 画像プレビュー重複 | `useImagePreview` 抽出 |
| `events-content.tsx` | 108-117 | body scroll lock 重複 | `useBodyScrollLock` 抽出 |
| `events-content.tsx` | 978-1002 | 画像最適化不足 | `priority`, `placeholder` 追加 |
| `bulletin-board.tsx` | 430-439 | body scroll lock 重複 | hook 化 |
| `bulletin-board.tsx` | 612, 777-791 | フィードバック表示不統一 | `FeedbackMessage` 使用 |
| `share-content.tsx` | 55-77 | 画像プレビュー重複 | hook 化 |
| `profile-edit-form.tsx` | - | 955行と巨大 | 3コンポーネントに分割 |

</details>

<details>
<summary>Mobile - mobile/app/ (クリックで展開)</summary>

| ファイル | 行 | 問題 | 修正案 |
|---------|-----|------|--------|
| `(tabs)/index.tsx` | 136-146 | FlatList 最適化なし | `getItemLayout` 等追加 |
| `(tabs)/bulletin.tsx` | 60-73 | 全データ再取得 | 差分更新 |
| `(tabs)/events.tsx` | 163-164 | FAB TODO | イベント作成実装 |
| `(tabs)/share.tsx` | 156-157 | FAB TODO | シェア作成実装 |
| `events/[id].tsx` | 13-45 | プレースホルダー | 詳細ページ実装 |

</details>

<details>
<summary>Supabase - migrations/ (クリックで展開)</summary>

| ファイル | 行 | 問題 | 修正案 |
|---------|-----|------|--------|
| `020_create_share_items.sql` | 44-45 | UPDATE ポリシー過緩 | 所有者 OR claimer のみ許可 |
| `012_create_room_photos_bucket.sql` | - | Storage RLS なし | ポリシー追加 |

</details>

---

*最終更新: 2026-02-17*
