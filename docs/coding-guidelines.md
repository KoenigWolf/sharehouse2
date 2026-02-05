# コーディングガイドライン

Share House Portal - Coding Guidelines

関連: [README.md](../README.md) / [DESIGN_GUIDELINES.md](./design-guidelines.md) / [IMPROVEMENTS.md](./improvements.md)

---

## 基本原則

- コードの意図は、コメントではなくコード自体で表現する
- 明確な命名により、コメントを不要にする
- 1関数1責任、最大50行を目安に

---

## コメント

### 書くべきコメント

- **WHY（なぜそうしたか）** の説明
- 外部仕様・API制約の補足（例: Supabaseの挙動、ブラウザ互換性）
- セキュリティ・パフォーマンス上の意図
- TODO / FIXME / NOTE
- 公開関数のJSDoc（`@param`, `@returns`）

### 書かないべきコメント

- コードを読めばわかるWHAT（何をしているか）
- `{/* ヘッダー */}` のようなJSXの構造説明
- 処理手順の番号付き説明（関数抽出で解決する）

---

## 命名規則

| 対象 | ルール | 例 |
|------|--------|-----|
| Boolean | `is` / `has` / `can` で始める | `isLoading`, `hasUser`, `canEdit` |
| 配列 | 複数形 | `users`, `filteredItems` |
| 関数 | 動詞で始める | `fetchProfile`, `validateInput` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| コンポーネント | PascalCase | `ResidentCard` |
| 型/Interface | PascalCase | `ProfileData`, `RateLimitConfig` |

短縮名（`d`, `temp`, `proc`）は避け、意図が明確な名前を使う。

---

## 関数設計

- **単一責任**: 1関数が複数のことをしていたら分割する
- **早期リターン**: ネストを減らすためガード節を使う
- **純粋関数を優先**: 副作用（API呼び出し、DB書き込み）はビジネスロジックから分離する

---

## コンポーネント設計（React）

- データ取得ロジックはカスタムフックに分離する
- Propsは必ずinterface/typeで型定義する（`any`禁止）
- `useMemo` / `useCallback` は実測でパフォーマンス問題がある場合に使う

---

## スタイリング（Tailwind CSS）

クラス名の推奨順序:
1. Layout（flex, grid, position）
2. Spacing（p-, m-）
3. Sizing（w-, h-）
4. Typography（text-, font-）
5. Colors（bg-, text-, border-）
6. Effects（shadow-, opacity-）
7. Interactive（hover:, focus:）

---

## 型安全性

- `any` は使わない。不明な型は `unknown` で受けてnarrowingする
- Optional chaining（`?.`）とnullish合体演算子（`??`）を活用する
- サーバーアクションの戻り値は成功/失敗をユニオン型で表現する

---

## null / undefined の設計指針

**原則: null / undefined は「状態」か「前提違反」かを判断し、暗黙的に処理しない。**

### 状態（正当な値）として扱う場合

ドメイン上 null が起こり得るデータ。フォールバックで安全に処理する。

- **DB の nullable カラム**: `bio`, `avatar_url`, `move_in_date` など → `??` で既定値を与える
- **フォーム初期値**: 未入力フィールド → `?? ""` で空文字に（`|| ""` は `0` や空文字を潰すため不可）
- **表示名フォールバック**: `profile.nickname ?? profile.name ?? ""` → 連鎖は許容

### 前提違反として扱う場合

null であること自体がバグや設定ミスを示す。黙って握り潰さず、早期に失敗させるか型で不可能にする。

- **環境変数**: `requireEnv()` で起動時にクラッシュさせる（`process.env.X!` 禁止）
- **認証ユーザー**: ガード節で早期リターン（`if (!user) return { error: ... }`）
- **Supabase クエリ結果**: error チェック後の `data` は非 null が保証される → `?? []` で二重防御しない。`if (error || !data)` で明示ガード
- **バリデーション結果**: 判別可能ユニオン型（`{ success: true; data: T } | { success: false; error: string }`）で `.data!` を不要にする

### 演算子の使い分け

| 演算子 | 用途 | 注意 |
|--------|------|------|
| `??` | null / undefined のみフォールバック | `0`, `""`, `false` を保持する |
| `\|\|` | 全 falsy 値をフォールバック | 意図的に `0` や `""` を除外したい場合のみ |
| `?.` | プロパティが存在しない可能性がある場合 | 前提上存在するはずの値に使わない |
| `!` (非 null アサーション) | **禁止** | 型設計で不要にする |

### チェックポイント

`??`, `||`, `?.`, `!` を書くとき、必ず自問する:

1. この値が null になるのは**正常な状態**か、**バグ**か？
2. 正常なら → フォールバックで処理（`??`）
3. バグなら → ガード節で早期リターン、または型で null を排除

---

## エラーハンドリング

- エラーメッセージは具体的に（何が、なぜ失敗したか）
- `console.error` ではなく `logError` ユーティリティを使う
- エラーを握り潰さない。適切にログ記録し、必要なら上位に伝播する

---

## チェックリスト（コードレビュー前）

- [ ] 不要なコメントを削除したか？
- [ ] 変数名・関数名は意図が明確か？
- [ ] 1関数は50行以内か？
- [ ] 型定義は適切か（anyを使っていないか）？
- [ ] エラーハンドリングは適切か？
- [ ] null / undefined の扱いは「状態」か「前提違反」か判断したか？
- [ ] アクセシビリティに配慮したか？

---

## 参考リンク

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React ドキュメント](https://react.dev/)
- [Next.js ドキュメント](https://nextjs.org/docs)
