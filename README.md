# Waterfall Agents

Claude Code のカスタムエージェント定義集です。
ウォーターフォール型のスペック駆動開発フローを、複数のエージェントが連携して自動化します。

## フロー概要

```
[新規開発（UIあり）]
  spec-designer → ux-designer → architect → developer → test-designer → tester → reviewer
       ↑                                                                        |
       └──────────────────────── PM が全体を管理 ──────────────────────────┘

[新規開発（UIなし）]
  spec-designer → architect → developer → test-designer → tester → reviewer

[既存プロジェクトへの変更]
  analyst → architect → developer → test-designer → tester → reviewer
```

各フェーズの完了ごとにユーザーの承認を得てから次へ進みます。

## エージェント一覧

| エージェント | 役割 | 主な成果物 |
|---|---|---|
| **spec-designer** | 要件から仕様書を策定 | `SPEC.md` |
| **ux-designer** | UI仕様・デザインプロンプトを作成 | `UI_SPEC.md` |
| **architect** | 仕様から技術設計書を作成 | `ARCHITECTURE.md` |
| **developer** | 設計に従いコードを実装 | 実装コード, `TASK.md` |
| **test-designer** | テスト計画を策定 | `TEST_PLAN.md` |
| **tester** | テストコードを作成・実行 | テストコード, テストレポート |
| **reviewer** | コード品質・仕様適合をレビュー | レビューレポート |
| **PM** | フロー全体を管理・承認ゲート制御 | — |
| **analyst** | バグ/機能追加/リファクタの方針決定 | `ISSUE.md`, GitHub issue |

## 使い方

### 前提条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストールされていること

### セットアップ

`agents/` ディレクトリと `.claude/commands/` ディレクトリをプロジェクトにコピーします。

```bash
# エージェント定義をコピー
mkdir -p .claude/agents
cp agents/*.md .claude/agents/

# スラッシュコマンドをコピー
mkdir -p .claude/commands
cp .claude/commands/*.md /path/to/your-project/.claude/commands/
```

`CLAUDE.md` はプロジェクトルートにコピーします。
既存の `CLAUDE.md` がある場合は内容をマージしてください。

```bash
cp CLAUDE.md /path/to/your-project/CLAUDE.md
```

### 実行

Claude Code 上でスラッシュコマンドを使って各エージェントを起動できます。

**新規開発（フルフロー）:**

```
/pm TODOアプリを作りたい
```

**個別エージェントの直接起動:**

| コマンド | エージェント | 用途 |
|---------|------------|------|
| `/pm` | PM | ウォーターフォールフロー全体を管理 |
| `/analyst` | analyst | バグ/機能追加/リファクタの方針決定 |
| `/spec-designer` | spec-designer | 要件から仕様書を策定 |
| `/ux-designer` | ux-designer | UI仕様・デザインプロンプトを作成 |
| `/architect` | architect | 仕様から技術設計書を作成 |
| `/developer` | developer | 設計に従いコードを実装 |
| `/test-designer` | test-designer | テスト計画を策定 |
| `/tester` | tester | テストコードを作成・実行 |
| `/reviewer` | reviewer | コード品質・仕様適合をレビュー |

**使用例:**

```
/spec-designer ブログ管理システムの仕様を作って
/architect
/developer フェーズ1を実装して
/analyst ログイン時に500エラーが発生するバグ
```

引数なしで実行した場合は、エージェントが前提ドキュメントを確認して作業を開始します。

## ファイル構成

```
waterfall-agents/
├── CLAUDE.md                          # 全エージェント共通ルール
├── README.md
├── .claude/
│   └── commands/                      # スラッシュコマンド定義
│       ├── pm.md                      # /pm
│       ├── analyst.md                 # /analyst
│       ├── spec-designer.md           # /spec-designer
│       ├── ux-designer.md             # /ux-designer
│       ├── architect.md               # /architect
│       ├── developer.md               # /developer
│       ├── test-designer.md           # /test-designer
│       ├── tester.md                  # /tester
│       └── reviewer.md               # /reviewer
└── agents/
    ├── spec-designer.md               # 仕様策定
    ├── ux-designer.md                 # UIデザイン
    ├── architect.md                   # アーキテクチャ設計
    ├── developer.md                   # 実装
    ├── test-designer.md               # テスト設計
    ├── tester.md                      # テスト実行
    ├── reviewer.md                    # レビュー
    ├── PM.md                          # オーケストレーター
    └── analyst.md                     # Issue対応
```

## 主な特徴

- **承認ゲート**: 各フェーズ完了時にユーザー承認を必須化し、自律エージェントの暴走を防止
- **セッション中断・再開**: `TASK.md` による状態管理で、長時間タスクの途中再開が可能
- **自動差し戻し**: テスト失敗時はtest-designerが原因分析後developerへ差し戻し、レビューCRITICAL指摘時も自動差し戻し（最大3回）
- **多言語対応**: Python (FastAPI) をデフォルトとしつつ、他言語プロジェクトにも対応
- **ドキュメント駆動**: SPEC.md → ARCHITECTURE.md → コードの一方向フローでトレーサビリティを確保

## ライセンス

MIT
