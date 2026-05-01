> Last updated: 2026-04-30
> GitHub Issue: [#107](https://github.com/kirin0198/aphelion-agents/issues/107)
> Authored by: analyst (2026-04-30, reframed)
> Next: architect

## 1. Problem statement

Aphelion は **Claude Code の hook 機構を利用した開発フロー保護を一切提供していない**。
本リポジトリは `npx github:kirin0198/aphelion-agents init` によって、
**利用者の既存プロジェクト** (Web アプリ / API / CLI / library 等) に
`.claude/agents/` `.claude/commands/` `.claude/rules/` を overlay 配布する設計を持つ。
しかし `.claude/settings.json` の `hooks` セクションは **現時点で未配布**であり、
利用者が Aphelion ワークフローで実装作業を進めるとき、

- `git commit` で `.env` の値や API key を誤って混入させる
- `npm install` / `uv add` で脆弱な依存を導入したまま気付かない
- `*.pem` / `*.key` / credentials.* を編集ツリー内に直接書き込む
- 既存 `settings.local.json` の deny で覆えない経路 (例: hook で前段検査) で
  シークレットを通過させる

といった **利用者プロジェクトでの典型事故** を、Aphelion 側からは
何ら自動防御できない。これは Aphelion の価値提案 (= 「Claude Code を使った
個人開発に守りを最初から組み込む」) の中核に対する欠落である。

### 1.1 reframe 経緯 (旧 §1 との差分)

本 design-note は **2026-04-30 初版を全面 reframe** した版である。
初版 (commit `e56a58d` 時点) は MVP を以下の **Aphelion 自身の repo 運用 hook**
に置いていた:

| 旧 MVP 候補         | 検出対象                              | 配布先での価値             |
|---------------------|---------------------------------------|----------------------------|
| README/Home sync    | #103 README/Home agent count drift    | **本リポジトリ限定**        |
| agent count drift   | `.claude/agents/` 編集後の README bump 漏れ | **本リポジトリ限定** |
| TASK.md lifecycle   | developer SubagentStop 時の reset 漏れ | Aphelion ユーザー全員に弱く有効 |

ユーザーフィードバック (2026-04-30):

> このhookはaphelionのAgent開発用のhookです。
> aphelionを利用した開発ではあまり価値が見出せません。
> 例えばgit commit時にシークレットの埋め込みがないことの確認など、
> aphelionを用いた開発時に必要となるhookを考えたい。

**根本ずれ**: 旧版は "Aphelion を開発する人" を対象にしていたが、
正しい受益者は "Aphelion を **使って** 自分のプロジェクトを開発する人" である。
配布物としての hook は、利用者プロジェクトの開発フローで
**実害が出る事故** を未然に止めるものでなければならない。

本版では:

- 主軸を **利用者プロジェクト保護 (security 系 hook)** に shift
- 旧 MVP 3 件は **Phase 2 (本リポジトリ専用 dogfooding hook)** に降格
- 主目玉は **A: PreToolUse `git commit` シークレット混入 block**

## 2. Current state evidence

### 2.1 Claude Code hooks 仕様 (再確認、初版から不変)

公式ドキュメント (`https://docs.claude.com/en/docs/claude-code/hooks`、
2026-04-30 取得分) より MVP 設計に直接効く事実のみを抽出する。

| Event              | matcher 対象 | exit 2 の効果                               | 用途           |
|--------------------|--------------|---------------------------------------------|----------------|
| `PreToolUse`       | tool_name    | tool call を **block** (Claude にエラー返却) | **commit 等の前段検査** |
| `PostToolUse`      | tool_name    | block 不可 (stderr 警告のみ Claude に届く)   | 編集後の自動チェック |
| `SessionStart`     | session 種別 | block 不可 (stdout で context 注入可)        | 起動時状態確認 |
| `SubagentStop`     | agent_type   | sub-agent 継続 (block 不可)                  | sub-agent 完了時 |
| `UserPromptSubmit` | (なし)       | prompt 消去で **block**                      | prompt 加工    |
| `Stop`             | (なし)       | turn 継続                                    | turn 完了      |

**MVP 設計に効く制約**:

- `PreToolUse on Bash` で `git commit` を **physical block 可能** (exit 2)。
  これがユーザー要求の中核 (commit 前のシークレット混入チェック) を満たす唯一の event。
- `PostToolUse` は **block 不可**。Edit/Write 後のシークレット patterning 検知は
  「警告のみ」になる (= 既に書き込まれた後)。Pre 段階で止めたい場合は
  `PreToolUse on Edit|Write` を使う必要がある。
- `$CLAUDE_PROJECT_DIR` 環境変数で project root 起点のスクリプト参照が可能。
  Aphelion が配布する hook script は `$CLAUDE_PROJECT_DIR/.claude/hooks/*.sh` で参照する。
- matcher 構文: `Bash` (tool 全体) / `if: "Bash(git commit*)"` (permission rule 形式) で絞り込み。
- `.claude/settings.json` は project-shared (commit 可能)、
  `.claude/settings.local.json` は project-personal (gitignored 想定) で
  **scope が異なる**。Aphelion は前者にテンプレを配布する。

### 2.2 既存 Aphelion 資産 (hook から再利用できるもの)

`/.claude/commands/` 配下に **regex / 静的検査ベースの slash command が既に存在**。
hook は agent を invoke できないが、slash command の検査ロジックは
**規格化された regex / ツール呼び出しの集合** であり、shell script へ抽出可能。

| 資産                                     | 種別            | hook 化可否 | 抽出方針                                  |
|------------------------------------------|-----------------|-------------|-------------------------------------------|
| `.claude/commands/secrets-scan.md`        | slash command   | ○ (regex)   | regex 群を bash 関数化 (§5.4)              |
| `.claude/commands/vuln-scan.md`           | slash command   | △ (CLI 呼び出し) | tech stack 判定 + 既存 CLI (`npm audit` 等) を呼ぶ薄い wrapper |
| `.claude/commands/security-review.md`     | slash command   | × (LLM 判断主体) | hook 対象外 (Phase 3+)                    |
| `scripts/check-readme-wiki-sync.sh`       | shell script    | ○ (既製)    | 旧 MVP 用、Phase 2 に温存                  |
| `src/.claude/settings.local.json` deny    | platform deny   | (重複領域)  | hook と deny の役割分担を §3.3 で整理      |

`secrets-scan.md` の regex (8 種) は以下の通り (確認済み):

```
api[_-]?key\s*[:=]\s*["'][^"']{8,}["']
password\s*[:=]\s*["'][^"']+["']
secret\s*[:=]\s*["'][^"']{8,}["']
token\s*[:=]\s*["'][^"']{8,}["']
(mysql|postgres|mongodb|redis)://[^\s"']+
AKIA[0-9A-Z]{16}
-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----
Bearer\s+[A-Za-z0-9\-._~+/]{20,}
```

これらは `grep -rEn` でほぼ等価に shell 化できる。
LLM 判断 (placeholder vs real secret) は失われるため、
hook 側では **検出時に commit を block + 利用者に "/secrets-scan で精査せよ" と指示** という
2 段運用にする (§5.5)。

### 2.3 利用者プロジェクトでの典型事故 (analyst が想定する痛み)

公開事例 (Github Search / Codecov 等) と Aphelion ユーザーから類推される頻出パターン:

| 痛み                                       | 既存 deny でカバー? | hook 適用 event                        |
|--------------------------------------------|--------------------|----------------------------------------|
| `.env` 値を誤って commit                   | × (`Read(.env)` deny は読み防止のみ、commit 経路は別) | PreToolUse on Bash `git commit*` |
| API key (sk-*, ghp_*, AKIA*) の hardcode   | ×                  | PreToolUse on Edit/Write              |
| `*.pem` `*.key` をプロジェクトに配置       | △ (`Read(**/*.pem)` deny 済み, 書き込みは未防御) | PreToolUse on Write |
| 脆弱依存追加 (npm install / uv add)        | ×                  | PostToolUse on Bash (after `npm install` 等) |
| main 直 push                                | ○ (deny 済み)      | (重複、対象外)                         |
| force push                                  | ○ (deny 済み)      | (重複、対象外)                         |
| `npm publish` 等の誤配布                    | ○ (deny 済み)      | (重複、対象外)                         |

deny で既にカバー済みの領域には hook を入れず、**deny で覆えない領域だけ hook で補強する**。
この線引きが本 reframe の核心である。

### 2.4 hook 配布インフラの現状

`bin/aphelion-agents.mjs` の確認結果 (2026-04-30):

- `settings.local.json`: `src/.claude/settings.local.json` を canonical とし、
  init 時は新規配置、update 時は既存があれば保護 (上書きしない)。
- `settings.json`: **未対応** (canonical も配布ロジックも存在しない)。
- `agents/`, `commands/`, `orchestrator-rules.md`: `<packageRoot>/.claude/` から overlay copy。
- `rules/`: `<packageRoot>/src/.claude/rules/` から overlay copy
  (二重ロード回避のため `src/` 配下が canonical)。

⇒ hook MVP の配布は **`settings.local.json` と同じ "init copies, update protects"
パターンを `settings.json` にも横展開する** ことで実現可能。`bin/` への新規ロジックは
`settings.json` 用 protection branch 1 個分のみ。

## 3. Constraints

### 3.1 既存 deny / sandbox-runner との分担

Aphelion には既に 3 層の防御がある:

| 層                              | 担当領域                                  | 起動契機                  |
|---------------------------------|-------------------------------------------|---------------------------|
| `settings.local.json` deny      | 静的に列挙された危険パターンの完全 block   | platform-permission       |
| `sandbox-runner` agent          | `required` カテゴリ Bash の隔離実行         | 明示 delegate (Standard+) |
| `denial-categories.md`          | Bash 失敗後の post-mortem 分類             | 失敗発生時 (advisory)     |

hook はこの 3 層に **第 4 層 = `proactive content scan`** を追加する位置付け。

- deny は文字列パターンマッチで止めるが、**commit 内容の中身は見ていない**。
  例: `Bash(git commit -m "...")` は許可される。中身に `.env` の値が含まれていても deny は素通し。
- sandbox-runner は危険コマンドの隔離実行であり、内容検査は行わない。
- hook はコマンドの **stdin / 引数 / 関連ファイル** を直接読み、内容検査して block できる。

### 3.2 block の使い方

ユーザーフィードバックの "git commit 時のシークレット埋め込み確認" は
**block 必須** (commit を止めなければ事故は防げない)。MVP では:

- A (commit 前 secrets check): **block 型** (exit 2)
- B (`*.pem` / `*.key` / `.env*` の Write 防止): **block 型** (exit 2)
- E (依存追加後の vuln 警告): **非 block 型** (exit 0 + stderr 警告)

block 型の誤検知は開発を止めてしまうので、**bypass 経路を必ず提供する**。
具体的には commit message に `[skip-secrets-check]` を含めれば hook を素通しさせる
(Conventional Commits の `[skip ci]` パターンに倣う)。詳細は §5.5。

### 3.3 配布の上書き安全性

`settings.json` は project-shared なので利用者がカスタマイズしている可能性が高い。
`settings.local.json` と同じ "init copies, update protects" を厳守する:

- `init`: ファイルが存在しなければ書く、存在すれば skip + 警告
- `update`: 存在すれば skip (既存保護)、存在しなければ書く

利用者が hook を無効化したい場合は、生成された `.claude/settings.json` を
編集して該当 hook ブロックを削除すれば良い (update でも保護される)。

### 3.4 依存ツール

hook script は **bash + `grep -E` のみ** に限定する (jq 不要、Python 不要)。
理由:

- WSL2 / macOS / Linux で追加 install なしに動く
- `jq` を入れると Windows native で `chocolatey install jq` 等が要件化
- secrets-scan の regex 8 種は `grep -rEn` で十分表現可能
- hook の stdin JSON は **`grep -oE '"tool_input":[^}]*'` 等の素朴 parse** で済む
  (hook の JSON 構造は固定なので fragile parse でも実害は小さい)

vuln-scan 呼び出し系は既存 CLI (`npm audit`, `pip-audit`, `cargo audit`) を呼ぶだけ。

Windows native PowerShell 対応は **Phase 2 課題**として `Hooks-Reference.md` に明記する。
WSL 推奨を明記。

### 3.5 実行レイテンシ

- A (PreToolUse Bash matcher `git commit*`): commit 時のみ fire ⇒ 影響軽微
- B (PreToolUse Edit|Write): **すべての Edit/Write で fire**
  ⇒ matcher を `if: "Write(*.pem)|Write(*.key)|Write(.env*)|Edit(.env*)"` 等で厳密に絞る
- E (PostToolUse Bash): `if: "Bash(npm install*)|Bash(uv add*)|Bash(pip install*)|Bash(cargo add*)"` で絞る

各 hook の実行時間目標: **< 200ms**。
secrets-scan A は対象が `git diff --cached` の出力のみ (commit 候補の差分) なので
`grep -E` で 100ms 以下に収まる想定。

## 4. Approach (Decided)

### 4.1 MVP hook 一覧 (3 hook、ハイブリッド = security 重点案 X 派生)

`A` をユーザー必須要望から確定、`B` を多層防御として追加、
`E` を非 block 警告でサプライチェーン保護、の 3 件構成。

| # | Event         | Matcher / `if`                                                              | Action                                                       | block? | 解決する痛み                |
|---|---------------|------------------------------------------------------------------------------|--------------------------------------------------------------|--------|------------------------------|
| A | PreToolUse    | `Bash`, `if: "Bash(git commit*)"`                                             | `aphelion-hook-secrets-precommit.sh` 実行。検出時 stderr に該当行出力 + exit 2 で commit block。`[skip-secrets-check]` 含む commit msg は通過 | **Yes** | `.env` / API key 混入 commit を物理 block |
| B | PreToolUse    | `Write\|Edit`, `if: "Write(.env*)\|Write(**/*.pem)\|Write(**/*.key)\|Write(**/credentials.*)\|Edit(.env*)"` | `aphelion-hook-sensitive-file-guard.sh` 実行。対象パスへの書き込みを exit 2 で block。`.env.example` / `.env.template` は通過 | **Yes** | 機密ファイル誤生成防止 |
| E | PostToolUse   | `Bash`, `if: "Bash(npm install*)\|Bash(npm i *)\|Bash(uv add*)\|Bash(pip install*)\|Bash(cargo add*)"` | `aphelion-hook-deps-postinstall.sh` 実行。検出した tech stack に応じて vuln scan を **非同期で起動**、stderr に "/vuln-scan で精査推奨" を表示 | No     | 脆弱依存導入の検知遅延 |

### 4.2 設計判断の根拠

1. **A は MVP 必須**: ユーザー要望 (`git commit時のシークレット埋め込みがないことの確認`)
   に直接対応。block しなければ commit が止まらないので block 型確定。
2. **B は A の補完**: A は commit 段階の最終防御。B は Write 段階の事前防御。
   多層防御の哲学に沿う。`Write` matcher なので新規作成のみ block、既存ファイルの
   Edit は通す (利用者が `.env.example` を `.env` にコピーする初回起動を阻害しない)。
3. **E のみ非 block**: vuln scan は時間がかかる (npm audit は数十秒〜)。
   block すると DX が壊滅。warning + 次の手 (`/vuln-scan`) を促す形にする。
4. **既存 deny との non-overlap**: main 直 push / force push / `npm publish` 等は
   `settings.local.json` deny で既に block されているため、hook に重複登録しない。

### 4.3 配布方針 (案 B = ハイブリッド: settings.json テンプレ + script overlay)

3 案を比較し、analyst 推奨は **案 B** で確定。

| 案 | 説明 | 利点 | 欠点 |
|----|------|------|------|
| A  | `bin/init` で `.claude/settings.json` を強制配布、毎回上書き | 即有効化 | 利用者既存設定を破壊。**選ばない** |
| **B (推奨)** | hook scripts を `src/.claude/hooks/` に canonical 配置し overlay copy。`src/.claude/settings.json` をテンプレ配布、`settings.local.json` と同一の "init copies, update protects" 規則を `bin/` に追加 | update 安全。`bin/` 改修最小 (1 ファイル分の protection branch) | 初期化 1 ステップ増 (= update でも mtime 更新) |
| C  | scripts のみ配布、settings.json は `.claude/hooks/README.md` で手動有効化を案内 | 副作用ゼロ | 利用者が手動設定する手間で導入率低下、dogfooding 効果薄い。**選ばない** |

### 4.4 Phase 2 / Out of scope の明示

| 候補 | 元案 | 配置 | 理由                                          |
|------|------|------|-----------------------------------------------|
| 旧 MVP 3 件 (README sync / agent count / TASK.md lifecycle) | 旧版 | **Phase 2 (Aphelion 自身の dogfooding 専用)** | 利用者プロジェクトに価値ない。本 repo `.claude/settings.json` ローカル追記のみ |
| C (PostToolUse on Edit/Write secret pattern 検査) | 候補 | Phase 2 | B (Pre 段階) で十分カバー、PostToolUse は block 不可なので価値半減 |
| D (`git push.*main`)                              | 候補 | **却下** | settings.local.json deny で既にカバー (`Bash(git push --force*)`)。main 直 push は project-rules.md の Branch Strategy で文書管理 |
| F (`npm publish` 等公開前検査)                    | 候補 | **却下** | settings.local.json deny で完全 block 済み |
| G (PostToolUse on Edit/Write build verification) | 候補 | Phase 3 | tech stack 判定が複雑、build-verification-commands.md 連動の設計が別途必要 |
| H (PreToolUse `git push` test 実行漏れ警告)       | 候補 | Phase 3 | "test 実行済み" の判定が困難 (last-test-timestamp 等の state 必要) |
| I (`git push --force` / `git reset --hard` 確認) | 候補 | **却下** | settings.local.json deny で完全 block 済み |
| J (Co-Authored-By trailer 不在検知)               | 候補 | Phase 2 | trailer 判定が脆弱 (commit msg format に依存)、誤検知リスク |
| K (SessionStart 起動時状態確認)                   | 候補 | Phase 2 | DX 系、context 注入で window 圧迫リスク |
| L (Stop 長時間 agent 完了通知)                    | 候補 | Out  | 個人設定領域、Aphelion が出すべきものではない |
| M (UserPromptSubmit prompt suggestion)           | 候補 | Out  | context window 圧迫、効果不確実 |
| Windows native PowerShell 対応                   | -    | Phase 2 | bash 前提を緩和する大改修、WSL 推奨で凌ぐ |

## 5. Document changes

### 5.1 新規ファイル

| ファイル                                            | 役割                                                    |
|-----------------------------------------------------|---------------------------------------------------------|
| `src/.claude/settings.json` (新規)                   | MVP 3 hook を登録したテンプレ                            |
| `src/.claude/hooks/aphelion-hook-secrets-precommit.sh` (新規) | A 用: git diff --cached の中身を 8 regex で検査          |
| `src/.claude/hooks/aphelion-hook-sensitive-file-guard.sh` (新規) | B 用: パス pattern を再確認し block 判定                 |
| `src/.claude/hooks/aphelion-hook-deps-postinstall.sh` (新規) | E 用: tech stack 判定 + 非同期 vuln-scan 起動 stderr 警告 |
| `src/.claude/hooks/lib/secret-patterns.sh` (新規)    | secrets-scan.md regex 群を関数化、hook A から source される |
| `src/.claude/rules/hooks-policy.md` (新規)           | Aphelion hook 採用ポリシー (block 可否、命名規約、bypass の与え方) |
| `docs/wiki/en/Hooks-Reference.md` (新規)             | 利用者向け: 各 hook の意味、無効化方法、bypass 方法、自作追加方法 |
| `docs/wiki/ja/Hooks-Reference.md` (新規)             | EN canonical の対訳                                      |

### 5.2 既存ファイルへの追記

| ファイル                                            | 変更                                                    |
|-----------------------------------------------------|---------------------------------------------------------|
| `bin/aphelion-agents.mjs`                            | `settings.json` と `hooks/` を `settings.local.json` と同じ "init copies, update protects" 規則で配布。**新規 protection branch 1 つ + overlay copy 1 行追加** |
| `src/.claude/rules/aphelion-overview.md`             | "Hook layer" 段落を Cross-cutting agents 節の後に新設    |
| `docs/wiki/{en,ja}/Home.md`                          | Related Pages に `Hooks-Reference.md` を追記             |
| `docs/wiki/{en,ja}/Contributing.md`                  | hook を編集するときの手順 (canonical = `src/.claude/hooks/`) |
| `README.md` / `README.ja.md`                         | `hooks-3` shields.io バッジ追加 (`commands-14` の隣)     |
| `CHANGELOG.md` `[Unreleased]`                        | "Added: Aphelion hooks (3 MVP: secrets-precommit / sensitive-file-guard / deps-postinstall)" |

### 5.3 dogfooding (Phase 1c で別 PR)

本リポジトリ自身の `.claude/settings.json` を作成し、MVP 3 hook を有効化する。
さらに Phase 2 候補のうち **本 repo 専用** の旧 MVP (README sync / agent count / TASK.md)
をローカル追記する。これで:

- 配布対象 (利用者プロジェクト) には security 系 3 hook のみ
- 本 repo (Aphelion 開発) には security 系 + dogfooding 系の混合構成

### 5.4 secret-patterns.sh の構造案

architect が確定する詳細は別途として、現時点での構造は:

```bash
# src/.claude/hooks/lib/secret-patterns.sh
# Source-only library. Defines APHELION_SECRET_PATTERNS array.

APHELION_SECRET_PATTERNS=(
  'api[_-]?key\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']'
  'password\s*[:=]\s*["'"'"'][^"'"'"']+["'"'"']'
  'secret\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']'
  'token\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']'
  '(mysql|postgres|mongodb|redis)://[^[:space:]"'"'"']+'
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
  'Bearer\s+[A-Za-z0-9._~+/-]{20,}'
)

aphelion_scan_stdin() {
  # Reads stdin, returns 0 if no match, non-zero with matched line on stderr.
  ...
}
```

利用者が独自 pattern を足したい場合は `~/.claude/hooks/lib/secret-patterns.user.sh` を
optional に source する設計を推奨 (architect が確定)。

### 5.5 bypass の与え方

- **A (commit 前検査)**: `git commit -m "feat: ... [skip-secrets-check]"` で hook 自身が
  早期 exit 0。理由は `[skip ci]` の慣行と一致しており、利用者の学習コストが低い。
  hook 内で `git diff --cached -m HEAD` の出力に `\[skip-secrets-check\]` が
  あれば検査せず通す。
- **B (sensitive file write)**: bypass を **意図的に提供しない**。
  どうしても `.env` を作りたい場合は、利用者が `.claude/settings.json` を編集して
  hook B を無効化する。これは "data の上で `.env` をプロジェクトルートに書く事故"
  自体を稀にするためで、毎回 bypass を許すと意味がなくなる。
- **E (依存追加後)**: 非 block なので bypass 不要。

## 6. Phase 2 / Out of scope (再掲、確定版)

### 6.1 Phase 2 候補 (本 PR には含めない)

- 旧 MVP 3 件: README/Home sync / agent count / TASK.md lifecycle
  → 本 repo `.claude/settings.json` のみ追加 (配布対象外)
- C (PostToolUse Edit/Write secret pattern 二次検査)
- J (Co-Authored-By trailer 不在検知)
- K (SessionStart 起動時状態確認)
- Windows native PowerShell 版

### 6.2 Out of scope (本 design-note では扱わない)

- D (main 直 push 検知): settings.local.json deny で済
- F (`npm publish` 公開前確認): settings.local.json deny で済
- I (`git push --force` 等): settings.local.json deny で済
- L (Stop 長時間完了通知)
- M (UserPromptSubmit prompt suggestion)

## 7. Open questions (architect 確定対象)

| #  | 質問                                                          | analyst 推奨                          |
|----|---------------------------------------------------------------|---------------------------------------|
| Q1 | hook A: `git diff --cached` の取得は `git diff --cached -U0` で十分か、`-U3` の方が文脈付きで誤検知少ないか | `-U0` (ヒット行のみ最小化、巨大 commit でのレイテンシ抑制) |
| Q2 | hook B: `.env.example` / `.env.template` / `.env.sample` の通過判定方法 | パス末尾が `.example` `.template` `.sample` `.dist` のいずれかなら通す。それ以外の `.env*` は block |
| Q3 | hook B: `**/*.pem` `**/*.key` を block するとき、`tests/fixtures/` 等の test dummy はどうするか | path に `/tests/` `/test/` `/__fixtures__/` を含むなら通す。architect が pattern 列を確定 |
| Q4 | hook E: vuln-scan を **非同期 fork** するか、stderr に "推奨" を出すだけか | stderr 警告のみ (非同期実行は zombie process 残留リスク) |
| Q5 | `secret-patterns.sh` の更新ルート: `secrets-scan.md` を canonical にするか、`secret-patterns.sh` を canonical にするか | **`secret-patterns.sh` canonical** にし、`secrets-scan.md` はそれを参照する形に書き換える (二重管理回避) |
| Q6 | `bin/aphelion-agents.mjs` の hooks/ 配布: `rules/` 同様 src/.claude 配下 canonical で良いか | Yes (`rules/` と同じ機構を踏襲) |
| Q7 | settings.json の保護: 既存ファイル発見時にユーザーに何を伝えるか (init / update のメッセージ) | "Aphelion hooks template skipped (existing settings.json preserved). To enable, see docs/wiki/.../Hooks-Reference.md" |
| Q8 | `hooks-policy.md` を auto-load 対象 (`src/.claude/rules/`) に置くか、別パスに置くか | `src/.claude/rules/` 配下 (sandbox-policy.md と並列) |
| Q9 | dogfooding hook (旧 MVP 3 件) は本 repo の `.claude/settings.json` に同居させるか、別パス (`scripts/dev-hooks/`) で管理するか | 同居 (Phase 1c PR で `.claude/settings.json` を本 repo にも commit) |

## 8. Handoff

**HANDOFF_TO**: `architect`

**理由**:
- 新規ディレクトリ (`src/.claude/hooks/`) と新規 settings.json テンプレの追加が必要。
  `bin/aphelion-agents.mjs` への配布ロジック追加は overlay copy 1 行 + protection branch 1 つで済むが、
  update セマンティクスの設計確定が必要。
- hook script の実装詳細 (regex の hook A 内挙動、test fixture 通過判定、
  bypass token 解釈、PostToolUse の非同期挙動) は ARCHITECTURE 観点で確定したい。
- Phase 2 への分割境界 (本 repo 専用 dogfooding hook の置き場所) を確定したい。
- `secret-patterns.sh` を canonical にしたとき `secrets-scan.md` slash command を
  どう書き換えるか (削除 / リダイレクト) も architect 判断。

**推奨 PR 構成**:

| Phase | PR 内容                                                                                              | 規模     |
|-------|------------------------------------------------------------------------------------------------------|----------|
| 1a    | `src/.claude/hooks/` 4 ファイル (lib + 3 hook scripts) + `src/.claude/settings.json` テンプレ + `bin/` 配布ロジック | 中       |
| 1b    | `src/.claude/rules/hooks-policy.md` 新設 + `aphelion-overview.md` 改訂 + `Hooks-Reference.md` 双言語 | 中       |
| 1c    | dogfooding: 本 repo `.claude/settings.json` 作成 + Phase 2 候補のうち本 repo 専用 hook (旧 MVP 3 件) を同居  | 中       |
| 1d    | README badge `hooks-3` 追加 + `secrets-scan.md` の secret-patterns.sh 参照書き換え + CHANGELOG               | 小       |
| 2     | (後続セッション) Phase 2 候補から優先度順 (Co-Authored-By / Windows PS / 等)                                  | 大 (分割) |

**リスク**:

- **R1** (重大): `aphelion-agents update` が利用者の `.claude/settings.json` を上書きすると
  ユーザーが個別に設定した hook が消失する。`settings.local.json` と同じ
  "init copies, update protects" を **必ず** 適用すること。`bin/smoke-update.sh` で回帰テスト追加推奨。
- **R2** (中): hook A が誤検知で commit を止めると DX が破壊される。
  `[skip-secrets-check]` bypass を確実に動作させること。
  Phase 1a の最初の dogfooding 段階で「本 repo の任意 commit 10 件」を
  hook 経由で通し、誤検知率を測定する acceptance 推奨。
- **R3** (中): hook B の path matcher が利用者プロジェクトのレイアウト差で誤動作。
  `tests/fixtures/` 等の通過判定 (Q3) を architect が網羅。
- **R4** (小): bash + grep のみ前提なので Windows native では動かない。
  `Hooks-Reference.md` に "WSL 推奨" を明記、Phase 2 で PowerShell 版を出す宣言。
- **R5** (小): `secret-patterns.sh` を canonical 化したとき、`secrets-scan.md` slash command の
  自然言語による文脈判断 (placeholder vs real) は失われる。hook 検出時に
  「`/secrets-scan` で再検査推奨」と stderr に出すことで補完する。
- **R6** (小): hook 失敗 (script 自体のバグ等) は exit 1 で non-blocking error として扱う。
  hook が壊れても利用者作業は止まらない設計を `hooks-policy.md` に明記。
