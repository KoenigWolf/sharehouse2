# Share House Portal - ドキュメント

## 目次

### 概要・設計

| ドキュメント | 説明 |
|-------------|------|
| [concept.md](./concept.md) | プロダクトコンセプト・機能一覧・成功指標 |
| [architecture.md](./architecture.md) | システム構成・データフロー・設計方針 |
| [design-guidelines.md](./design-guidelines.md) | デザインシステム・カラー・タイポグラフィ |
| [coding-guidelines.md](./coding-guidelines.md) | コーディング規約・命名・型安全性 |

### 開発・運用

| ドキュメント | 説明 |
|-------------|------|
| [setup.md](./setup.md) | 環境構築・セットアップ手順 |
| [contributing.md](./contributing.md) | コントリビューションガイド |
| [github-workflows.md](./github-workflows.md) | CI/CD・GitHub自動化・ラベル管理 |
| [release-checklist.md](./release-checklist.md) | リリース前チェックリスト |
| [troubleshooting.md](./troubleshooting.md) | よくある問題と解決方法 |

### 改善・要件

| ドキュメント | 説明 |
|-------------|------|
| [requirements.md](./requirements.md) | 機能的改善要件・TODO |
| [improvements.md](./improvements.md) | 改善履歴・完了項目 |
| [improvement-proposals.md](./improvement-proposals.md) | 改善提案詳細 |

---

## クイックリンク

| やりたいこと | ドキュメント |
|-------------|-------------|
| 開発を始める | [setup.md](./setup.md) |
| 貢献したい | [contributing.md](./contributing.md) |
| システム構成を知る | [architecture.md](./architecture.md) |
| コードを書く | [coding-guidelines.md](./coding-guidelines.md) |
| UI を作る | [design-guidelines.md](./design-guidelines.md) |
| PR を出す | [github-workflows.md](./github-workflows.md) |
| リリースする | [release-checklist.md](./release-checklist.md) |
| 問題が起きた | [troubleshooting.md](./troubleshooting.md) |

---

## コミットメッセージ規約

```
<type>: <description>

<body>
```

### Type

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（コードの動作に影響なし） |
| `refactor` | リファクタリング |
| `perf` | パフォーマンス改善 |
| `test` | テスト追加・修正 |
| `chore` | ビルド・ツール・依存関係 |
| `ci` | CI/CD 設定 |

### 例

```
feat: Tea Time マッチング機能追加

週1回のランダムマッチングを実装。
オプトイン設定でON/OFF可能。
```

```
fix: プロフィール画像がアップロードできない問題を修正
```

```
docs: セットアップ手順を追加
```
