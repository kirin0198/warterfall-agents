# Telescope Agents

Claude Code のカスタムエージェント定義集です。
プロジェクトの全工程を **Discovery（要件探索）→ Delivery（設計・実装）→ Operations（デプロイ・運用）** の3領域に分割し、25の専門エージェントが自動化します。

**[English README](README.md)**

```
Discovery Flow ──[DISCOVERY_RESULT.md]──▶ Delivery Flow ──[DELIVERY_RESULT.md]──▶ Operations Flow
 (要件探索)                             (設計・実装)                            (デプロイ・運用)
 5 agents                               12 agents                              4 agents
```

各フェーズ完了ごとにユーザーの承認を得てから次へ進みます。`service` 以外（`tool` / `library` / `cli`）は Operations をスキップします。

---

## Quick Start

**前提:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストール済みであること

```bash
# 1. .claude/ ディレクトリをプロジェクトにコピー
cp -r .claude /path/to/your-project/

# 2. プロジェクトディレクトリで Claude Code を起動
cd /path/to/your-project && claude

# 3. スラッシュコマンドで開始
/discovery-flow TODOアプリを作りたい
```

フローオーケストレーターがプロジェクト規模を自動判定し、必要なエージェントだけを起動します。

---

## 利用シナリオ

### 新規プロジェクト（フルフロー）

要件探索から設計・実装・デプロイまで一気通貫で進めます。

```
/discovery-flow ブログ管理システムを作りたい
（Discovery 完了後）
/delivery-flow
（Delivery 完了後、service の場合）
/operations-flow
```

### サクッと作りたい（Delivery のみ）

要件が固まっていて、設計・実装だけ進めたい場合。

```
/pm TODOアプリを作りたい
```

### 既存プロジェクトの変更（SPEC / ARCHITECTURE あり）

バグ修正・機能追加・リファクタリングを issue として整理し、設計・実装に進みます。

```
/analyst ログイン時に500エラーが発生するバグ
（分析完了後）
/delivery-flow
```

### 既存プロジェクトの変更（SPEC / ARCHITECTURE なし）

まず既存コードから仕様書・設計書を逆生成し、ワークフローに乗せます。

```
/codebase-analyzer このプロジェクトの仕様と設計を分析して
（分析完了後）
/analyst ログイン機能を追加したい
/delivery-flow
```

### コマンド一覧

| コマンド | 用途 |
|---------|------|
| `/discovery-flow` | 要件探索フローを開始 |
| `/pm` `/delivery-flow` | 設計・実装フローを開始 |
| `/operations-flow` | デプロイ・運用フローを開始 |
| `/analyst` | 既存プロジェクトへの issue 分析 |
| `/codebase-analyzer` | 仕様書のない既存プロジェクトを分析 |

---

## アーキテクチャ

### 3領域モデル

各領域は独立セッションで動作し、`.md` ファイルでハンドオフします（自動チェーンなし）。

**Discovery**（要件探索） — interviewer → researcher → poc-engineer → concept-validator → scope-planner

**Delivery**（設計・実装） — spec-designer → ux-designer → architect → scaffolder → developer → test-designer → tester → security-auditor → reviewer → doc-writer → releaser

**Operations**（デプロイ・運用） — infra-builder → db-ops → observability → ops-planner

**スタンドアロン** — analyst（issue 分析）、codebase-analyzer（既存コード分析）

### トリアージシステム

フロー開始時にプロジェクト規模を判定し、4段階のプランから必要なエージェントを自動選択します。

| プラン | Discovery | Delivery | Operations |
|--------|-----------|----------|------------|
| **Minimal** | interviewer のみ | 最小構成（5 agents） | — |
| **Light** | + scope-planner | + reviewer, test-designer | infra + ops-planner |
| **Standard** | + researcher, poc-engineer | + scaffolder, doc-writer | + db-ops |
| **Full** | + concept-validator | + releaser | + observability |

`security-auditor` は全プランで必ず実行されます。`ux-designer` は UI を含むプロジェクトでのみ起動します。

---

## 主な特徴

- **3領域分離** — Discovery / Delivery / Operations を独立セッションで管理し、コンテキスト圧迫を防止
- **トリアージ適応** — プロジェクト規模に応じて Minimal〜Full を自動選択
- **承認ゲート** — 各フェーズ完了時にユーザー承認を必須化
- **セキュリティ必須** — security-auditor は全プランで実行（OWASP Top 10 + 依存脆弱性スキャン）
- **セッション中断・再開** — TASK.md による状態管理で途中再開が可能
- **自動差し戻し** — テスト失敗・レビュー指摘時に原因分析後ロールバック（最大3回）
- **多言語対応** — Python / TypeScript / Go / Rust に対応
- **ドキュメント駆動** — 領域間は `.md` ハンドオフでトレーサビリティを確保

---

## ファイル構成

```
.claude/
├── CLAUDE.md              # 全エージェント共通ルール
├── agents/*.md            # エージェント定義（25ファイル）
└── commands/*.md          # スラッシュコマンド定義
```

エージェント定義の詳細は [.claude/CLAUDE.md](.claude/CLAUDE.md) を参照してください。

---

## CI/CD との関係

Telescope は開発時ワークフローであり、CI/CD ランタイムではありません。`infra-builder` が GitHub Actions 等のパイプライン定義を生成します。

## ライセンス

MIT
