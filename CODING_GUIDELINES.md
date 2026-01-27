# コーディングガイドライン

このドキュメントは、Share House Portalプロジェクトのコード品質を維持するためのガイドラインです。
Claude Codeは、コード作成・修正時に必ずこのガイドラインに従ってください。

最終更新: 2026-01-28

---

## 基本原則

### 1. リーダブルコード第一

> "コードはコンピューターが理解できるように書くのではなく、人間が理解できるように書く"

- コードの意図は、コメントではなくコード自体で表現する
- 明確な命名により、コメントを不要にする
- コメントは「なぜ（WHY）」を説明し、「何を（WHAT）」は説明しない

---

## コメントのガイドライン

### 書くべきコメント

#### 1. WHYを説明するコメント
```typescript
// ❌ 悪い例（WHATを説明）
// ユーザーをフィルタリングする
const activeUsers = users.filter(u => u.isActive);

// ✅ 良い例（WHYを説明）
// セキュリティ上、非アクティブユーザーはマッチング対象外とする
const activeUsers = users.filter(u => u.isActive);
```

#### 2. 複雑なロジックの背景説明
```typescript
// ✅ 良い例
// Supabaseの制約: identitiesが空の場合、メール確認が必要
if (!user?.identities || user.identities.length === 0) {
  // ...
}
```

#### 3. セキュリティ・パフォーマンス上の重要事項
```typescript
// ✅ 良い例
// CSRF対策: オリジンヘッダーがない場合も許可（同一オリジンのフォーム）
if (!origin && !host) {
  return t("errors.forbidden");
}
```

#### 4. TODO、FIXME、NOTE
```typescript
// TODO: Sentry統合時にエラー追跡を追加
// FIXME: React 19移行後、useFormStateに置き換え
// NOTE: この実装はTailwind CSS 4の制限による一時的な対応
```

#### 5. 外部仕様・API制約の説明
```typescript
// Supabase PostgREST: PGRST116 = no rows returned（エラーではない）
if (error && error.code !== "PGRST116") {
  throw error;
}
```

#### 6. JSDoc（APIドキュメント）
```typescript
/
 * プロフィールを更新する
 *
 * @param data - 更新データ
 * @returns 成功時は{ success: true }、失敗時は{ error: string }
 * @throws セッションが無効な場合
 */
export async function updateProfile(data: ProfileUpdateInput) {
  // ...
}
```

---

### 書かないべきコメント

#### 1. 自明なコメント
```typescript
// ❌ 悪い例
// ユーザーIDを取得
const userId = user.id;

// 配列をフィルタリング
const filtered = items.filter(item => item.isActive);

// ✅ 良い例（コメント不要）
const userId = user.id;
const activeItems = items.filter(item => item.isActive);
```

#### 2. 関数名・変数名で説明できるコメント
```typescript
// ❌ 悪い例
// 登録済みユーザーの部屋番号を取得
const registeredRoomNumbers = new Set(
  dbProfiles.filter(p => p.room_number).map(p => p.room_number)
);

// ✅ 良い例（コメント不要、関数名で明確）
const registeredRoomNumbers = extractRegisteredRoomNumbers(dbProfiles);
```

#### 3. セクション分割のための単純なコメント
```typescript
// ❌ 悪い例
// Server-side validation
const validation = validateInput(data);

// Rate limiting
const rateLimitResult = await RateLimiters.auth(identifier);

// ✅ 良い例（コメント不要、関数抽出で明確化）
const validation = validateInputOnServer(data);
const rateLimitResult = await enforceAuthRateLimit(identifier);
```

#### 4. JSXの構造説明
```typescript
// ❌ 悪い例
{/* ヘッダー */}
<header>...</header>

{/* メインコンテンツ */}
<main>...</main>

{/* フッター */}
<footer>...</footer>

// ✅ 良い例（コメント不要、コンポーネント名で明確）
<Header />
<MainContent />
<Footer />
```

#### 5. 処理の手順を説明するコメント
```typescript
// ❌ 悪い例
// 1. データを取得
const data = await fetchData();

// 2. データを変換
const transformed = transform(data);

// 3. データを保存
await save(transformed);

// ✅ 良い例（関数抽出で明確化）
async function processAndSaveData() {
  const data = await fetchData();
  const transformed = transform(data);
  await save(transformed);
}
```

---

## 命名規則

### 変数名・関数名

#### 1. 意図が明確な名前
```typescript
// ❌ 悪い例
const d = new Date();
const temp = users.filter(u => u.a);
function proc() { ... }

// ✅ 良い例
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
function processUserRegistration() { ... }
```

#### 2. Boolean値は is/has/can で始める
```typescript
// ❌ 悪い例
const loading = true;
const user = false;
const edit = true;

// ✅ 良い例
const isLoading = true;
const hasUser = false;
const canEdit = true;
```

#### 3. 配列・リストは複数形
```typescript
// ❌ 悪い例
const user = users.filter(...);
const itemList = getItems();

// ✅ 良い例
const filteredUsers = users.filter(...);
const items = getItems();
```

#### 4. 関数名は動詞で始める
```typescript
// ❌ 悪い例
function userValidation() { ... }
function profileData() { ... }

// ✅ 良い例
function validateUser() { ... }
function fetchProfileData() { ... }
function updateProfile() { ... }
```

---

## 関数設計

### 1. 単一責任の原則

一つの関数は一つのことだけを行う。

```typescript
// ❌ 悪い例
async function updateUserAndSendEmail(userId: string, data: any) {
  await updateUser(userId, data);
  await sendEmail(userId);
  await logActivity(userId);
}

// ✅ 良い例
async function updateUserProfile(userId: string, data: ProfileData) {
  await updateUser(userId, data);
}

async function notifyUserOfProfileUpdate(userId: string) {
  await sendEmail(userId);
  await logActivity(userId);
}
```

### 2. 早期リターン（ガード節）

```typescript
// ❌ 悪い例
function processUser(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // 実際の処理
        return doSomething(user);
      }
    }
  }
  return null;
}

// ✅ 良い例
function processUser(user: User | null) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;

  return doSomething(user);
}
```

### 3. 関数の長さ

- 1関数は最大50行を目安に
- それ以上になる場合は、機能を分割する

```typescript
// ❌ 悪い例（100行以上の巨大関数）
function processEverything() {
  // ... 100行以上
}

// ✅ 良い例（小さな関数に分割）
function validateInput() { ... }
function transformData() { ... }
function saveToDatabase() { ... }
function sendNotification() { ... }

function processEverything() {
  validateInput();
  transformData();
  saveToDatabase();
  sendNotification();
}
```

---

## コンポーネント設計（React）

### 1. コンポーネントの責任を明確に

```typescript
// ❌ 悪い例（データ取得とUIが混在）
export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users").then(res => res.json()).then(setUsers);
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// ✅ 良い例（関心の分離）
// データ取得
function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users").then(res => res.json()).then(setUsers);
  }, []);

  return users;
}

// UI表示
export function UserList() {
  const users = useUsers();

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Propsは明確に型定義

```typescript
// ❌ 悪い例
export function UserCard({ user }: any) { ... }

// ✅ 良い例
interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => void;
  isEditable?: boolean;
}

export function UserCard({ user, onEdit, isEditable = false }: UserCardProps) {
  // ...
}
```

---

## スタイリング（Tailwind CSS）

### 1. クラス名の順序

```typescript
// 推奨順序:
// 1. Layout (flex, grid, position)
// 2. Spacing (p-, m-)
// 3. Sizing (w-, h-)
// 4. Typography (text-, font-)
// 5. Colors (bg-, text-, border-)
// 6. Effects (shadow-, opacity-)
// 7. Interactive (hover:, focus:, active:)

// ✅ 良い例
<div className="flex items-center gap-4 p-4 w-full text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
  {children}
</div>
```

### 2. カスタムカラーは定数化

```typescript
// ❌ 悪い例
<div className="text-[#1a1a1a] bg-[#fafaf8]">

// ✅ 良い例（tailwind.config.tsで定義）
// colors: {
//   primary: { text: '#1a1a1a', bg: '#fafaf8' }
// }
<div className="text-primary-text bg-primary-bg">
```

---

## 型安全性

### 1. anyを避ける

```typescript
// ❌ 悪い例
function processData(data: any) {
  return data.value;
}

// ✅ 良い例
interface DataType {
  value: string;
}

function processData(data: DataType) {
  return data.value;
}
```

### 2. Optionalチェーンとnullish合体演算子

```typescript
// ❌ 悪い例
const name = user && user.profile && user.profile.name;
const age = user.age !== null && user.age !== undefined ? user.age : 0;

// ✅ 良い例
const name = user?.profile?.name;
const age = user?.age ?? 0;
```

---

## テスト可能なコード

### 1. 副作用を分離

```typescript
// ❌ 悪い例（テストしづらい）
function processUser() {
  const user = fetchUserFromAPI();  // 外部依存
  const result = transform(user);
  saveToDatabase(result);  // 副作用
  return result;
}

// ✅ 良い例（テスト容易）
function transformUser(user: User) {
  return {
    ...user,
    name: user.name.toUpperCase(),
  };
}

async function processUser(userId: string) {
  const user = await fetchUser(userId);
  const transformed = transformUser(user);  // 純粋関数
  await saveUser(transformed);
  return transformed;
}
```

---

## パフォーマンス

### 1. 不要な再レンダリングを避ける

```typescript
// ❌ 悪い例
function Component() {
  const handleClick = () => { ... };  // 毎回新しい関数

  return <Child onClick={handleClick} />;
}

// ✅ 良い例
function Component() {
  const handleClick = useCallback(() => { ... }, []);

  return <Child onClick={handleClick} />;
}
```

### 2. 重い計算はメモ化

```typescript
// ❌ 悪い例
function Component({ items }) {
  const sorted = items.sort(...).filter(...).map(...);  // 毎回実行

  return <List items={sorted} />;
}

// ✅ 良い例
function Component({ items }) {
  const sorted = useMemo(
    () => items.sort(...).filter(...).map(...),
    [items]
  );

  return <List items={sorted} />;
}
```

---

## エラーハンドリング

### 1. 明確なエラーメッセージ

```typescript
// ❌ 悪い例
throw new Error("Error");
throw new Error("Something went wrong");

// ✅ 良い例
throw new Error(`Failed to update profile for user ${userId}: ${reason}`);
throw new ValidationError("Email format is invalid", { field: "email" });
```

### 2. エラーの適切な伝播

```typescript
// ❌ 悪い例
try {
  await updateUser();
} catch (error) {
  console.log(error);  // エラーを隠蔽
}

// ✅ 良い例
try {
  await updateUser();
} catch (error) {
  logError(error, { action: "updateUser", userId });
  throw error;  // 適切に伝播
}
```

---

## 推奨リソース

### 書籍
- リーダブルコード - Dustin Boswell, Trevor Foucher
- Clean Code - Robert C. Martin

### オンライン
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [React公式ドキュメント](https://react.dev/)
- [Next.js公式ドキュメント](https://nextjs.org/docs)

---

## チェックリスト（コードレビュー前）

コード提出前に以下を確認：

- [ ] 不要なコメントを削除したか？
- [ ] 変数名・関数名は意図が明確か？
- [ ] 1関数は50行以内か？
- [ ] 単一責任の原則に従っているか？
- [ ] 型定義は適切か（anyを使っていないか）？
- [ ] エラーハンドリングは適切か？
- [ ] テストを書いたか？
- [ ] パフォーマンスに問題はないか？
- [ ] アクセシビリティに配慮したか？

---

## このガイドラインの更新

プロジェクトの進化に合わせて、このガイドラインも更新してください。
新しいベストプラクティスを発見したら、積極的に追加しましょう。

最終更新: 2026-01-28
次回レビュー予定: プロジェクト完了時
