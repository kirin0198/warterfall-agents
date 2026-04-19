# Phase 1: TypeScript + CLI — publish `aphelion-agents` on npm

> 最終更新: 2026-04-19
> 更新履歴:
>   - 2026-04-19: 初版作成 (Phase 1 スコープ確定)

## ユーザー要件

Aphelion の配布経路として npm レジストリ経由の導入を追加したい。
現状はユーザーが `cp -r` または `git clone` で `.claude/` などを取り込んでいるが、
`npx aphelion-agents init` の 1 コマンドで導入できるようにする。

## Issue 分類

**Feature Addition (機能追加)** — 新しい配布経路と CLI を追加する。
既存の配布方法 (cp -r / git clone) は維持する (破壊的変更なし)。

## 4 解釈比較 (analyst 前回議論の要約)

| 解釈 | 内容 | 採否 |
|------|------|------|
| A | CLI 導入 + 既存スクリプトも同時に TS 化 | 不採用 (スコープ過大) |
| B | CLI のみ導入、既存 `.mjs` はそのまま | Phase 1 に近いが update コマンド不足 |
| **C** | **段階リリース: Phase 1 = CLI (init/update) のみ、Phase 2 で scripts 統合・CI・拡張** | **採用** |
| D | テンプレートリポジトリ方式 (degit) への切替 | 不採用 (既存 UX 保持できない) |

## 決定事項 (承認済み)

- **スコープ**: 解釈 C — 段階リリース。Phase 1 を本 issue で実装、Phase 2 は別 issue。
- **Phase 1 CLI コマンド**: `init` + `update` (+ `--version` / `--help`)。
- **既存 UX 保持**: `cp -r` / `git clone` 手順は削除せず、README に npx 手順を追記のみ。
- **CI 自動 publish はしない** (Phase 1 は手動 `npm publish`)。
- **パッケージ名**: `aphelion-agents` (無スコープ、npm registry で空き確認済)。
- **言語**: TypeScript (strict)。
- **Node 要件**: Node 20+。

## Phase 1 実装計画

### ディレクトリ構造 (新規追加分)

```
aphelion-agents/
├── src/
│   ├── cli.ts                  # エントリーポイント (shebang, cac ルーティング)
│   ├── commands/
│   │   ├── init.ts             # init コマンド
│   │   └── update.ts           # update コマンド
│   └── lib/
│       ├── copy.ts             # ファイルコピー / 上書き判断
│       └── sources.ts          # パッケージ内ソースパス解決
├── tsconfig.json               # strict, Node 20, ESM
├── tsup.config.ts              # ESM + CJS + shebang
├── biome.json                  # lint + format
├── vitest.config.ts            # test 設定
└── CHANGELOG.md                # 0.1.0 初回エントリ
```

既存 `scripts/*.mjs` には手を入れない (Phase 2)。

### CLI コマンド仕様

| Command | 動作 |
|---------|------|
| `npx aphelion-agents init` | カレントディレクトリに `.claude/` をコピー。既存があれば確認プロンプト。 |
| `npx aphelion-agents init --platform copilot` | `.github/` に Copilot 用ファイルをコピー |
| `npx aphelion-agents init --platform codex` | `AGENTS.md` + `skills/` をコピー |
| `npx aphelion-agents init --all` | 3 プラットフォーム同時 |
| `npx aphelion-agents update` | インストール済みファイルを最新に更新 (diff 表示・確認後に上書き) |
| `npx aphelion-agents --version` / `--help` | 標準 |

### package.json 変更一覧

- `private: true` を削除
- `bin`: `{ "aphelion-agents": "./dist/cli.js" }`
- `files`: `["dist", ".claude", "platforms"]`
- `engines`: `{ "node": ">=20" }`
- `version`: `0.1.0`
- `type`: `module`
- scripts 追加: `build` (tsup), `test` (vitest), `lint` (biome check), `format` (biome format)

### 依存追加

**dependencies**
- `cac` — 軽量 CLI フレームワーク
- `@clack/prompts` — 対話 UI
- `picocolors` — ANSI カラー

**devDependencies**
- `typescript`
- `tsup`
- `vitest`
- `@biomejs/biome`
- `@types/node`

すべて採用基準 (メンテ状態・採用実績・ライセンス MIT) を満たすことを前提とする。

### テスト戦略

- `src/lib/copy.ts`: コピー先が存在する場合の分岐、保護ファイル (`.claude/settings.local.json`) のスキップ挙動をユニットテスト。`fs/promises` はモックまたは `os.tmpdir()` 下で実ファイル操作。
- `src/lib/sources.ts`: パッケージルート解決ロジックをユニットテスト。
- `src/commands/*`: 対話プロンプトをモック化し、オプション分岐を検証。
- CI でのテスト自動化は Phase 2。本 Phase 1 ではローカル `npm test` で通過すれば良い。

### publish 手順 (ユーザー向けドキュメント)

Phase 1 では手動 publish。`CONTRIBUTING.md` もしくは `CHANGELOG.md` に以下を明記する。

1. `npm login`
2. `npm run build`
3. `npm run test`
4. `npm pack` で同梱ファイルを確認
5. `npm publish` (初回は `--access public`)
6. `git tag v0.1.0 && git push --tags`

### ドキュメント更新 (今 Phase)

- `README.md` / `README.ja.md` の Getting Started 節に `npx aphelion-agents init` 手順を追加 (既存 cp -r / git clone も残す、bilingual)。
- `docs/wiki/{en,ja}/Getting-Started.md` にも同様の追記。

## Phase 2 スコープ (別 issue で扱う)

- `scripts/generate.mjs` / `scripts/sync-wiki.mjs` の TypeScript 統合
- GitHub Actions による CI (test, lint, publish 自動化)
- `npm publish` の GitHub Release 連動
- `aphelion-agents doctor` など追加サブコマンド
- テンプレート以外 (例: `aphelion-agents upgrade --to <version>`)

## 制約とスコープ外 (Phase 1)

- **コード実装は developer の担当**: 本 issue 作成時点では実装を行わない。
- **`scripts/*.mjs` の書き換え禁止** (Phase 2)。
- **スコープ付きパッケージ名 (`@kirin0198/...`) は採用しない**。
- **npm publish を自動で走らせない** (ユーザーが手動)。
- **LICENSE**: リポジトリルートに LICENSE ファイルが存在しない。developer は `package.json` の `license` フィールド確認と、必要に応じたルート LICENSE 追加の要否をユーザーに確認すること (採用済ライセンスが不明な場合は作業保留)。

## 受入条件 (Phase 1 完了定義)

- `npm run build` でエラーなくバンドル生成される
- `npm run test` でユニットテスト通過
- `node dist/cli.js --help` で help が表示される
- `node dist/cli.js init` を temp dir で実行すると `.claude/` がコピーされる
- `README.md` / `README.ja.md` / wiki Getting-Started に npx 手順が追記されている
- `CHANGELOG.md` に `0.1.0` エントリがある

## developer 向けブリーフ

### 新規作成ファイル
- `src/cli.ts`, `src/commands/init.ts`, `src/commands/update.ts`
- `src/lib/copy.ts`, `src/lib/sources.ts`
- `tsconfig.json`, `tsup.config.ts`, `biome.json`, `vitest.config.ts`
- `CHANGELOG.md` (`## 0.1.0 - 2026-04-20` エントリ)

### 実装指針

**`init` コマンドフロー**
1. カレントディレクトリを解決
2. `--platform` / `--all` / default (claude-code) を判別
3. 既存 `.claude/` が存在する場合は `@clack/prompts` で「上書き / スキップ / マージ (デフォルト上書き)」を確認
4. パッケージ内の `.claude/` から `fs/promises.cp(..., { recursive: true })` でコピー
5. 完了メッセージ (picocolors で色付け)

**`update` コマンドフロー**
1. 既存 `.claude/` 検出 (なければエラー)
2. パッケージ内との diff を file list で表示
3. `@clack/prompts` で確認
4. `.claude/` 配下のみ上書き。`.claude/settings.local.json` は保護。

**エラーハンドリング**
- try/catch を徹底し、ユーザー向けメッセージは日本語 (rules準拠)。
- Node バージョンチェック: `process.versions.node` で 20 未満なら即 exit + 説明。

### 実装しないこと

- 既存 `scripts/generate.mjs` / `scripts/sync-wiki.mjs` の書き換え
- GitHub Actions CI 設定
- スコープ付きパッケージ名への変更
- `npm publish` 自体 (ユーザーが手動で `npm login && npm publish` を実行)
