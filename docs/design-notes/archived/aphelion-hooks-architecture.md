> Last updated: 2026-04-30
> Linked Design Note: [aphelion-hooks-introduction.md](./aphelion-hooks-introduction.md) (analyst, reframed 2026-04-30)
> Linked Issue: [#107](https://github.com/kirin0198/aphelion-agents/issues/107)
> Authored by: architect (2026-04-30)
> Next: developer

## 1. Scope of this document

本ドキュメントは Issue #107 「Aphelion hooks 導入、利用者プロジェクト保護主軸」の architect
フェーズの確定設計である。analyst の reframe 後 design-note
([aphelion-hooks-introduction.md](./aphelion-hooks-introduction.md)) を入力とし、
developer が PR 1a 〜 1d の実装を始められる粒度まで以下を確定する。

- §2: Open Questions Q1〜Q9 の確定回答 (analyst 推奨を引き継ぎつつ architect 値で固定)
- §3: secret-patterns canonical の正規 8 regex
- §4: hook script 3 本 + secret-patterns ライブラリの完全アウトライン
- §5: `src/.claude/settings.json` テンプレ完全構造
- §6: `bin/aphelion-agents.mjs` 拡張仕様 (init copies / update protects)
- §7: `hooks-policy.md` 構造 (auto-load 対象)
- §8: `Hooks-Reference.md` (en/ja) 構造
- §9: `Rules-Reference.md` / `aphelion-overview.md` の差分仕様
- §10: `site/` 配下 (astro.config.mjs PAGES) への影響
- §11: README badge / CHANGELOG 差分
- §12: PR 戦略 (1a / 1b / 1c / 1d) 各 PR の境界と CI 整合性
- §13: テスト戦略
- §14: リスクレジスタ (analyst R1〜R6 継承 + architect 追加分)
- §15: developer 向け PR 1a 実装チェックリスト

実装そのもの (script 本体・bin/ コード差分・テンプレ JSON 本体) は **書かない**。
developer が §15 のチェックリストに従って PR 1a で実装する。

入力契約として以下が確定済 (analyst Decided、architect 変更不可):

- MVP = 3 hook (A: secrets-precommit、B: sensitive-file-guard、E: deps-postinstall)
- 配布方針 = 案 B (hybrid): canonical = `src/.claude/hooks/*.sh` + `src/.claude/settings.json`
- 依存 = bash + `grep -E` のみ、Windows native は Phase 2
- 既存 deny 層 (`src/.claude/settings.local.json`) と非重複
- 旧 MVP 3 件 (md-sync / agent-count / task-md-check) は Phase 2 (本 repo dogfooding 専用)

Claude Code hooks 仕様 (matcher / `if` 構文 / `PreToolUse` exit 2 で block / `PostToolUse` は
block 不可 / `$CLAUDE_PROJECT_DIR` / stdin JSON で `tool_input` 受領) は analyst §2.1 で
確認済のものをそのまま採用する。本 architect 段階で WebFetch による再確認を推奨するが、
実装上は §4 / §5 のシグネチャに沿って書けば仕様逸脱は発生しない。

## 2. Open Questions の確定回答 (Q1〜Q9)

| #  | 確定回答                                                                                              | 根拠                                                                  |
|----|-------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| Q1 | **`git diff --cached -U0`** を採用                                                                    | 周辺 context での誤検知抑止。巨大 commit でのレイテンシ抑制。analyst 推奨踏襲 |
| Q2 | `.env*` は **block 対象**。allow-list suffix = `.example` `.template` `.sample` `.dist`               | analyst 推奨 + 業界慣行 (Next.js / Rails / Laravel での通例 suffix)    |
| Q3 | hook B path 判定: §4.2 の `BLOCK_GLOBS` / `ALLOW_PATH_PATTERNS` を確定値で固定。allow-list 優先       | analyst R3 軽減。test fixture / sample コードを誤 block しない         |
| Q4 | hook E は **同期 stderr 警告のみ**。非同期 fork / バックグラウンド `npm audit` は採用しない           | zombie process リスクと CI 環境での `&` 不安定性。analyst 確定済を踏襲 |
| Q5 | `secret-patterns.sh` を canonical 化。`secrets-scan.md` slash command は patterns を参照する形に refactor (PR 1d) | 二重管理回避 (R5)。slash command と hook で regex set 完全一致を保証   |
| Q6 | hooks/ canonical 配置 = **`src/.claude/hooks/`** (rules/ と同一機構)                                  | 二重ロード回避 (`src/` 配下を canonical) の既存原則を踏襲               |
| Q7 | settings.json 既存検出時メッセージ (`bin/` stderr 出力、英語固定) = §6.3 の文言で確定                 | 既存 `settings.local.json` 保護メッセージとの一貫性                    |
| Q8 | `hooks-policy.md` を **`src/.claude/rules/`** に配置、auto-load 対象として登録 (rules count 12 → 13) | analyst 推奨。`sandbox-policy.md` と並列の policy 層に格納              |
| Q9 | dogfooding 範囲 = 本 repo `.claude/settings.json` に MVP 3 + 旧 MVP 3 を同居 (PR 1c)                 | analyst 推奨。本 repo 自身で eat-your-own-dogfood して誤検知率を測定    |

### 2.1 補足 (Q2 / Q3 path 判定の確定値)

Q2 `.env*` allow-list suffix (case-insensitive、末尾完全一致):

| Suffix       | block?  | 例                          |
|--------------|---------|-----------------------------|
| `.example`   | allow   | `.env.example`              |
| `.template`  | allow   | `.env.template`             |
| `.sample`    | allow   | `.env.sample`               |
| `.dist`      | allow   | `.env.dist`                 |
| (上記以外)   | **block** | `.env`, `.env.local`, `.env.production`, `.env.test` |

Q3 hook B 全体パス判定の確定値:

```
BLOCK_GLOBS=(
  '.env'                    # 完全一致
  '.env.*'                  # `.env.local` など (allow-list suffix を除く)
  '*.pem'
  '*.key'
  'credentials.*'
  '*.secret'                # settings.local.json deny の Read 防御と整合
  'id_rsa'
  'id_ed25519'
  'id_ecdsa'
)

# block より優先される allow-list (path 全体に対する正規表現)
ALLOW_PATH_PATTERNS=(
  '(^|/)tests?/'            # tests/ test/
  '(^|/)__fixtures__/'
  '(^|/)__snapshots__/'
  '(^|/)fixtures/'
  '(^|/)examples/'
  '(^|/)docs/'              # ドキュメント例示用 (例: docs/wiki/.../sample.env)
)

# Q2 の allow-list suffix (BLOCK_GLOBS より優先)
ALLOW_SUFFIXES=(
  '.example'
  '.template'
  '.sample'
  '.dist'
)
```

判定順序 (上が優先):

1. `ALLOW_PATH_PATTERNS` のいずれかに hit → exit 0 (allow)
2. `ALLOW_SUFFIXES` のいずれかで終わる → exit 0 (allow)
3. `BLOCK_GLOBS` のいずれかに hit → exit 2 (block)
4. それ以外 → exit 0 (allow)

## 3. Secret patterns canonical (8 regex)

`src/.claude/hooks/lib/secret-patterns.sh` で配列 `APHELION_SECRET_PATTERNS` として export
する正規 8 regex。`grep -E` 互換 (POSIX ERE) で記述。各 pattern には `# ID:` コメントを付与し、
`secrets-scan.md` slash command 側からも同じ ID で参照できるようにする。

| ID    | 名前                       | Regex (ERE)                                                                            | 出典                          |
|-------|----------------------------|-----------------------------------------------------------------------------------------|-------------------------------|
| P1    | AWS Access Key             | `AKIA[0-9A-Z]{16}`                                                                     | AWS docs / GitGuardian        |
| P2    | GitHub PAT / OAuth / etc.  | `gh[pousr]_[A-Za-z0-9]{36,}`                                                           | GitHub token format docs (2021+) |
| P3    | OpenAI API Key             | `sk-[A-Za-z0-9]{20,}`                                                                  | OpenAI key prefix             |
| P4    | Anthropic API Key          | `sk-ant-[A-Za-z0-9_-]{20,}`                                                            | Anthropic console docs        |
| P5    | Slack Token                | `xox[baprs]-[A-Za-z0-9-]{10,}`                                                         | Slack API docs                |
| P6    | Stripe Live Secret         | `sk_live_[A-Za-z0-9]{20,}`                                                             | Stripe API docs               |
| P7    | RSA / EC / DSA Private Key | `-----BEGIN (RSA \|EC \|DSA \|OPENSSH )?PRIVATE KEY-----`                              | OpenSSL / OpenSSH PEM headers |
| P8    | Generic credential assignment | `(api[_-]?key\|token\|secret\|password)[[:space:]]*[:=][[:space:]]*["'\''][A-Za-z0-9_+/=.~-]{16,}["'\'']` | OWASP ASVS / Aphelion 既存 secrets-scan.md |

設計メモ:

- `(?i)` は POSIX ERE では未対応のため `grep -iE` フラグで吸収する。`secret-patterns.sh` 側の
  helper 関数 `aphelion_secret_grep` で `-iE` 固定にする (§4.4)。
- P3 の OpenAI key は **長さ 48 固定だった旧仕様** が新形式 (variable length) に変わっているため、
  `{20,}` で広めに取る。誤検知が問題になれば PR 1a 後の dogfooding で `{40,}` に絞る。
- P8 は既存 `secrets-scan.md` の汎用 4 種 (api_key / password / secret / token) を 1 本に統合。
  database connection string (`mysql://...` 等) は **Phase 2** に降格 (誤検知比率が高く、
  utils/db_url.py 等で偽 URL を例示するケースが多発)。
- Bearer token (`Bearer [A-Za-z0-9...]{20,}`) は **Phase 2** に降格 (HTTP example で頻出)。
- 旧 `secrets-scan.md` から落とす 2 件 (DB connection string / Bearer) は P8 の generic
  assignment で間接的にカバーされる場合が多く、precommit 段階の false positive を抑える方を
  優先する。

PR 1d で `secrets-scan.md` 側を以下のように refactor する (Q5 確定):

```markdown
# Refactor target: .claude/commands/secrets-scan.md

Steps:
1. Source patterns from `.claude/hooks/lib/secret-patterns.sh` for parity with
   the precommit hook (hook A). Run `grep -rIEn -f <(...)` over the working
   tree, excluding `.git`, `node_modules`, etc.
2. (LLM judgment step) For each match, classify placeholder vs real secret.
3. Report (table format unchanged).
```

これにより、precommit hook が止めた候補を `/secrets-scan` で再精査するワークフローが
**完全同一の regex set** で連動する (analyst R5 mitigation)。

## 4. Hook script complete outlines

各 hook script は以下の共通構造を持つ:

```bash
#!/usr/bin/env bash
# {filename}
# {hook 名 / Aphelion #107}
# Reads stdin (Claude Code hook payload, JSON).
# Returns: exit 0 (continue), exit 2 (block, PreToolUse only), exit 1 (script error → non-blocking).
set -euo pipefail

# Aphelion hook scripts MUST tolerate failures of their own implementation:
# any uncaught error path falls through to `exit 0` so user work is not blocked
# by hook bugs. This is enforced by the trap below.
trap 'echo "[aphelion-hook:{name}] internal error at line $LINENO; passing through" >&2; exit 0' ERR

HOOK_NAME="{hook short name}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LIB_DIR="${PROJECT_DIR}/.claude/hooks/lib"
```

### 4.1 hook A: aphelion-secrets-precommit.sh

**Path**: `src/.claude/hooks/aphelion-secrets-precommit.sh`
**Event**: `PreToolUse`
**Matcher**: `Bash`
**`if` rule**: `Bash(git commit*)`
**Exit semantics**: `0` = pass, `2` = block commit, `1` = script error (non-blocking, fallback to 0 via trap)

入力契約 (Claude Code stdin payload, JSON 抜粋):

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git commit -m \"feat: add foo\"",
    "description": "..."
  }
}
```

`tool_input.command` のテキスト全体を `RAW_CMD` として読み出す。bash + grep のみで済ます方針
(Q4 / 依存制約) のため `jq` は使わず、以下の **fragile-by-design** parse を行う:

```bash
RAW_PAYLOAD="$(cat)"  # stdin 全文
# tool_input.command フィールドを抽出 (改行を含まない 1 行 command 前提)
RAW_CMD=$(printf '%s' "$RAW_PAYLOAD" \
  | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 \
  | sed -E 's/^"command"[[:space:]]*:[[:space:]]*"//; s/"$//')
```

`git commit` の `-m`/`-F` 値も `tool_input.command` 内に含まれているため、bypass 判定は
`RAW_CMD` の文字列全体に対して `[skip-secrets-check]` の存在を確認する:

```bash
if echo "$RAW_CMD" | grep -qE '\[skip-secrets-check\]'; then
  echo "[aphelion-hook:secrets-precommit] bypass marker [skip-secrets-check] found — skipping scan" >&2
  exit 0
fi
```

スキャン本体 (`git diff --cached -U0`):

```bash
source "${LIB_DIR}/secret-patterns.sh"

# git が無い / staging が空 / リポジトリ外 → 通過
DIFF=$(git -C "$PROJECT_DIR" diff --cached -U0 2>/dev/null || true)
if [ -z "$DIFF" ]; then
  exit 0
fi

# diff の追加行 (`^+` で始まり `^+++` ヘッダを除外) のみを対象に検査
ADDED_LINES=$(printf '%s\n' "$DIFF" | grep -E '^\+' | grep -vE '^\+\+\+')

HIT_PATTERN=""
for entry in "${APHELION_SECRET_PATTERNS[@]}"; do
  # entry format: "<ID>|<regex>"
  pid="${entry%%|*}"
  regex="${entry#*|}"
  if printf '%s' "$ADDED_LINES" | grep -qiE "$regex"; then
    HIT_PATTERN="$pid"
    break
  fi
done

if [ -n "$HIT_PATTERN" ]; then
  cat >&2 <<EOF
[aphelion-hook:secrets-precommit] BLOCKED: staged diff matches secret pattern ${HIT_PATTERN}.
- The actual matching value is intentionally NOT printed (avoid leaking via logs).
- Re-scan with /secrets-scan to inspect with LLM-aware placeholder detection.
- If the match is a placeholder / sample, append [skip-secrets-check] to the
  commit message and re-run.
EOF
  exit 2
fi

exit 0
```

DX / セキュリティ上の設計判断:

- マッチした **値そのもの** は stderr に出さない (commit log / Claude transcript への漏洩防止)。
  pattern ID のみ報告し、利用者は `/secrets-scan` で個別確認する。
- `[skip-secrets-check]` は `RAW_CMD` 文字列全体で検出 (`-m "..."` でも `-F file` でも有効)。
- `git -C "$PROJECT_DIR"` 経由で実行することで monorepo subtree の commit にも追従。

### 4.2 hook B: aphelion-sensitive-file-guard.sh

**Path**: `src/.claude/hooks/aphelion-sensitive-file-guard.sh`
**Event**: `PreToolUse`
**Matcher**: `Write|Edit`
**`if` rule** (settings.json で 1 行に収める):

```
Write(.env*)|Write(**/*.pem)|Write(**/*.key)|Write(**/credentials.*)|Write(**/*.secret)|Write(**/id_rsa)|Write(**/id_ed25519)|Write(**/id_ecdsa)|Edit(.env*)|Edit(**/*.pem)|Edit(**/*.key)|Edit(**/credentials.*)
```

**Exit semantics**: `0` = pass, `2` = block, `1` = script error (trap → 0)

入力契約:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/abs/path/.env",
    "content": "..."
  }
}
```

判定本体:

```bash
RAW_PAYLOAD="$(cat)"
TARGET_PATH=$(printf '%s' "$RAW_PAYLOAD" \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' \
  | head -1 \
  | sed -E 's/^"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')

[ -z "$TARGET_PATH" ] && exit 0  # フィールド不在 → fail-open

# 以下 §2.1 の判定順序を実装

# 1. ALLOW_PATH_PATTERNS (path 部分一致、大文字小文字区別)
ALLOW_PATH_PATTERNS=(
  '(^|/)tests?/'
  '(^|/)__fixtures__/'
  '(^|/)__snapshots__/'
  '(^|/)fixtures/'
  '(^|/)examples/'
  '(^|/)docs/'
)
for p in "${ALLOW_PATH_PATTERNS[@]}"; do
  if printf '%s' "$TARGET_PATH" | grep -qE "$p"; then
    exit 0
  fi
done

# 2. ALLOW_SUFFIXES (basename の suffix 完全一致、大文字小文字区別なし)
BASENAME=$(basename -- "$TARGET_PATH")
ALLOW_SUFFIXES=( '.example' '.template' '.sample' '.dist' )
for s in "${ALLOW_SUFFIXES[@]}"; do
  case "${BASENAME,,}" in *"${s,,}") exit 0 ;; esac
done

# 3. BLOCK_GLOBS (basename / パス全体に対する shell glob)
BLOCK_GLOBS=(
  '.env' '.env.*' '*.pem' '*.key' 'credentials.*' '*.secret'
  'id_rsa' 'id_ed25519' 'id_ecdsa'
)
for g in "${BLOCK_GLOBS[@]}"; do
  case "$BASENAME" in $g)
    cat >&2 <<EOF
[aphelion-hook:sensitive-file-guard] BLOCKED: write to sensitive file
  path: $TARGET_PATH
  matched glob: $g
  rationale: this filename is conventionally used for secrets (private keys,
    credentials, populated env files). Aphelion blocks creation/edit by default.
  bypass: there is no commit-message-style bypass for this hook.
    To proceed, edit .claude/settings.json and remove the
    aphelion-sensitive-file-guard PreToolUse entry, or rename the target file
    to one of: *.example, *.template, *.sample, *.dist.
EOF
    exit 2 ;;
  esac
done

# 4. その他は通過
exit 0
```

bypass を意図的に提供しないのは analyst §5.5 の判断 (毎回 bypass を許すと多層防御が形骸化)。
利用者が一時的に解除したい場合は settings.json 編集に誘導する。

### 4.3 hook E: aphelion-deps-postinstall.sh

**Path**: `src/.claude/hooks/aphelion-deps-postinstall.sh`
**Event**: `PostToolUse`
**Matcher**: `Bash`
**`if` rule**: `Bash(npm install*)|Bash(npm i *)|Bash(npm ci*)|Bash(uv add*)|Bash(uv pip install*)|Bash(pip install*)|Bash(cargo add*)|Bash(go get *)`
**Exit semantics**: `0` 固定 (PostToolUse は block 不可)。stderr 警告のみ。

入力契約 (PostToolUse は `tool_response` も含む):

```json
{
  "tool_name": "Bash",
  "tool_input": { "command": "npm install foo" },
  "tool_response": { "exit_code": 0, "stdout": "...", "stderr": "..." }
}
```

検出仕様 (parse 簡略化のため Q4 で確定した同期 stderr 警告のみ):

```bash
RAW_PAYLOAD="$(cat)"
CMD=$(printf '%s' "$RAW_PAYLOAD" \
  | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 | sed -E 's/^"command"[[:space:]]*:[[:space:]]*"//; s/"$//')

# tech stack 判定 (CMD prefix → tool name)
case "$CMD" in
  npm*)   STACK="Node.js"; SCAN_HINT="npm audit" ;;
  uv*)    STACK="Python";  SCAN_HINT="uv run pip-audit" ;;
  pip*)   STACK="Python";  SCAN_HINT="pip-audit" ;;
  cargo*) STACK="Rust";    SCAN_HINT="cargo audit" ;;
  go*)    STACK="Go";      SCAN_HINT="govulncheck ./..." ;;
  *)      STACK="unknown"; SCAN_HINT="" ;;
esac

# 非ブロッキング警告 (stderr に出すと Claude が読み取って次手を提案できる)
cat >&2 <<EOF
[aphelion-hook:deps-postinstall] $STACK dependency change detected.
  Recommended next step: run /vuln-scan to check for known vulnerabilities.
  (Manual equivalent: $SCAN_HINT)
  Skipping recommended after lockfile-only updates or when offline.
EOF
exit 0
```

Q4 確定通り、`npm audit &` 等の非同期 fork は実装しない。理由:

- bash trap + `&` で fork すると Claude Code 側 hook timeout (10s) との競合で zombie 化する事例あり。
- CI 環境では `&` の挙動が host shell に依存。
- 警告のみであれば `< 50ms` で完了し DX を毀損しない。

### 4.4 secret-patterns.sh (shared lib)

**Path**: `src/.claude/hooks/lib/secret-patterns.sh`
**Type**: Source-only library。スタンドアロン実行は禁止 (実行されても害は無いが意味なし)。

```bash
#!/usr/bin/env bash
# Aphelion shared library: secret detection patterns.
# Sourced by:
#   - .claude/hooks/aphelion-secrets-precommit.sh
#   - .claude/commands/secrets-scan.md (after PR 1d refactor)
#
# Updates here propagate to all callers automatically (single source of truth).
# Do NOT add inline regex to caller scripts.

# Each entry: "<ID>|<ERE regex>"
# Regex is intended to be used with: grep -iE
APHELION_SECRET_PATTERNS=(
  'P1|AKIA[0-9A-Z]{16}'
  'P2|gh[pousr]_[A-Za-z0-9]{36,}'
  'P3|sk-[A-Za-z0-9]{20,}'
  'P4|sk-ant-[A-Za-z0-9_-]{20,}'
  'P5|xox[baprs]-[A-Za-z0-9-]{10,}'
  'P6|sk_live_[A-Za-z0-9]{20,}'
  'P7|-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'
  'P8|(api[_-]?key|token|secret|password)[[:space:]]*[:=][[:space:]]*["'\''][A-Za-z0-9_+/=.~-]{16,}["'\'']'
)

# helper: aphelion_secret_grep <input>
# Returns 0 if any pattern matches, with first matching ID printed to stdout.
aphelion_secret_grep() {
  local input="$1"
  local entry pid regex
  for entry in "${APHELION_SECRET_PATTERNS[@]}"; do
    pid="${entry%%|*}"
    regex="${entry#*|}"
    if printf '%s' "$input" | grep -qiE "$regex"; then
      printf '%s\n' "$pid"
      return 0
    fi
  done
  return 1
}
```

shellcheck 観点:

- `set -euo pipefail` は **caller 側** で設定する (lib では未設定。`return` 利用のため)。
- 配列 `${VAR[@]}` は `"..."` で必ず quote。
- `case "${BASENAME,,}" in ...` の小文字化は bash 4+ 依存だが、Aphelion は WSL2 / macOS 12+ 前提のため許容。
  Windows native の場合は Phase 2 で別途対応。

## 5. settings.json template

**Path (canonical)**: `src/.claude/hooks/` ではなく `src/.claude/settings.json`
**Path (deployed)**: 利用者プロジェクトの `.claude/settings.json`

完全 JSON テンプレ:

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(git commit*)",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/aphelion-secrets-precommit.sh",
        "description": "Aphelion #107: scan staged diff for secret patterns; exit 2 blocks commit. Bypass: append [skip-secrets-check] to commit message."
      },
      {
        "matcher": "Write|Edit",
        "if": "Write(.env*)|Write(**/*.pem)|Write(**/*.key)|Write(**/credentials.*)|Write(**/*.secret)|Write(**/id_rsa)|Write(**/id_ed25519)|Write(**/id_ecdsa)|Edit(.env*)|Edit(**/*.pem)|Edit(**/*.key)|Edit(**/credentials.*)",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/aphelion-sensitive-file-guard.sh",
        "description": "Aphelion #107: block writes to sensitive filenames; allow .example/.template/.sample/.dist and tests/fixtures/ paths."
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(npm install*)|Bash(npm i *)|Bash(npm ci*)|Bash(uv add*)|Bash(uv pip install*)|Bash(pip install*)|Bash(cargo add*)|Bash(go get *)",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/aphelion-deps-postinstall.sh",
        "description": "Aphelion #107: advise running /vuln-scan after dependency installs (non-blocking)."
      }
    ]
  }
}
```

注:

- `description` フィールドは Claude Code hooks 仕様で許容される自由フィールド。実行には影響しない。
- `if` 構文は **permission rule 形式** で `|` 区切り。複雑な glob は `**/*.pem` のように prefix を許可。
- 利用者がカスタム hook を追加する場合は **このテンプレ JSON に追記** する形を推奨 (
  `Hooks-Reference.md` で案内、§8)。
- `outputStyle` 等の他フィールドは含めない (`.claude/settings.json` は hook 専用テンプレとして
  最小化する。利用者が `outputStyle` を別途設定したい場合は merge 編集する)。

## 6. bin/aphelion-agents.mjs changes

### 6.1 既存パターンの再利用

`settings.local.json` 用に既に確立されている **"init copies, update protects"** パターンを
そのまま `settings.json` にも適用する。`bin/` 改修は最小限:

| 変更箇所                   | 内容                                                            |
|---------------------------|-----------------------------------------------------------------|
| 定数追加 (top-level)      | `settingsSourcePath`, `hooksSourcePath` を追加                  |
| `cmdInit` 内              | `settings.json` の cp + `hooks/` の overlay copy を追加         |
| `cmdUpdate` 内            | `settings.json` 既存検出 → skip + 警告。`hooks/` は毎回 overlay copy |
| `package.json#files`      | `src/.claude/settings.json`, `src/.claude/hooks` を追加         |
| `showHelp()` 文言         | settings.json / hooks の保護挙動を 1 行追記                    |

### 6.2 定数追加 (擬似 diff)

```js
// 既存
const settingsLocalSourcePath = join(packageRoot, "src", ".claude", "settings.local.json");

// 追加
const settingsSourcePath      = join(packageRoot, "src", ".claude", "settings.json");
const hooksSourcePath         = join(packageRoot, "src", ".claude", "hooks");
```

### 6.3 cmdInit 内の追加ロジック

`cmdInit` 関数の `cp(...)` 群の **直後** に以下を挿入:

```js
// settings.json: hooks template を初期配置 (init は新規配置なので上書き OK)
await cp(settingsSourcePath, join(targetPath, "settings.json"), { force: true });

// hooks/ : 必ず overlay copy (canonical = src/.claude/hooks/)
await cp(hooksSourcePath, join(targetPath, "hooks"), {
  recursive: true,
  force: true,
});
// hooks script に実行権限を付与
await chmodHooks(join(targetPath, "hooks"));
```

`chmodHooks` は新規 helper:

```js
import { chmod, readdir } from "node:fs/promises";

async function chmodHooks(hooksDir) {
  // *.sh のみ 0755 に。lib/*.sh は source 専用だが実行権限あっても害なし
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
      } else if (entry.name.endsWith(".sh")) {
        await chmod(p, 0o755);
      }
    }
  }
  await walk(hooksDir);
}
```

理由: `npm pack` / `git clone` 経由でファイルが配布される際、実行ビットが落ちることがある
(特に Windows で git clone した場合)。Claude Code hooks は `command` field に書かれた path を
そのまま `execve` するため、x ビットが立っていないと `permission denied` で hook 全体が壊れる。

### 6.4 cmdUpdate 内の追加ロジック

settings.json は **既存があれば保護、無ければ書く** (settings.local.json と同パターン):

```js
const settingsPath = join(targetPath, "settings.json");
const hasSettings  = await exists(settingsPath);

// ... (既存の cp 群)

if (!hasSettings) {
  await cp(settingsSourcePath, settingsPath, { force: true });
  ok("settings.json (hooks template) を初期配置しました。");
} else {
  // Q7 確定文言 (英語固定、stderr 経由ではなく warn() 経由で表示)
  warn(
    "Aphelion hooks template (.claude/settings.json) was preserved. " +
    "To enable hooks, manually merge from " +
    "https://github.com/kirin0198/aphelion-agents/blob/main/src/.claude/settings.json " +
    "or remove .claude/settings.json and re-run `aphelion-agents update`."
  );
}

// hooks/ は毎回 overlay copy (canonical 更新を必ず反映)
await cp(hooksSourcePath, join(targetPath, "hooks"), {
  recursive: true,
  force: true,
});
await chmodHooks(join(targetPath, "hooks"));
```

設計判断:

- **settings.json は protect**: 利用者が hook を追加 / 無効化している可能性あり
- **hooks/ は overlay**: regex 更新 / バグ修正を毎回反映したい (canonical 更新の意義)
- 既存 hook script を利用者がローカル編集している可能性は **無視する** (canonical 配布物
  であることを `Hooks-Reference.md` に明記、利用者カスタムは別ファイル
  `~/.claude/hooks/local/` 等に置くよう案内する)

### 6.5 package.json#files 拡張

```jsonc
{
  "files": [
    "bin",
    ".claude/agents",
    ".claude/commands",
    ".claude/orchestrator-rules.md",
    "src/.claude/rules",
    "src/.claude/settings.local.json",
    "src/.claude/settings.json",   // 追加
    "src/.claude/hooks"            // 追加
  ]
}
```

`npm pack --dry-run` で配布物に hooks/ と settings.json が含まれることを developer が確認する
(§13.1)。

## 7. hooks-policy.md outline

**Path**: `src/.claude/rules/hooks-policy.md`
**Auto-load**: Yes (`.claude/rules/` 配下、Claude Code が session start で読む)
**Target lines**: ~150 行

### セクション構成

```
# Hooks Policy

> Last updated: 2026-{YYYY-MM-DD}
> Auto-loaded: Yes — placed in .claude/rules/, loaded by Claude Code on every session start

## 1. Overview
   - Aphelion が配布する hook の位置付け (= proactive content scan、第 4 層防御)
   - 既存 3 層 (settings.local.json deny / sandbox-runner / denial-categories) との分担

## 2. Available hooks (MVP)
   - hook A / B / E の表 (event / matcher / if / block? / bypass)
   - canonical path = src/.claude/hooks/aphelion-*.sh

## 3. Bypass mechanisms
   - hook A: commit message に [skip-secrets-check]
   - hook B: bypass なし (settings.json 編集が必要)
   - hook E: 警告のみ、bypass 不要

## 4. Distribution policy
   - canonical = src/.claude/hooks/ + src/.claude/settings.json
   - bin/aphelion-agents.mjs: init copies, update protects (settings.json)、hooks/ は overlay
   - 利用者カスタム hook の置き場所推奨 (.claude/hooks/local/ や ~/.claude/hooks/)

## 5. Failure modes
   - hook script が異常終了 → trap ERR で exit 0 (利用者作業を止めない)
   - hook script が timeout (Claude Code 既定 60s) → Claude Code 側で警告のみ
   - 依存ツール不在 (git 無し等) → 該当 hook は素通し
   - regex 誤検知 → bypass marker または settings.json 編集

## 6. Troubleshooting
   - hook が動いていない疑い: ls -la .claude/hooks/*.sh で実行ビット確認、
     `aphelion-agents update` で再配布
   - 誤検知頻発: PR で regex を修正提案 (canonical = src/.claude/hooks/lib/secret-patterns.sh)
   - WSL でのみ動作。Windows native は Phase 2、PowerShell 版予定
```

文書スタイルは既存 `sandbox-policy.md` / `denial-categories.md` を踏襲 (テーブル中心、
auto-load 注記の reference を末尾に置く)。

## 8. Hooks-Reference.md outline (en + ja)

**Path (en, canonical)**: `docs/wiki/en/Hooks-Reference.md`
**Path (ja)**: `docs/wiki/ja/Hooks-Reference.md`
**Bilingual Sync Policy 適用**: 同 PR 内で en / ja 両方を更新する (Contributing.md §Bilingual Sync)
**Target lines**: ~120 行/file

### セクション構成 (en/ja 共通)

```
# Hooks Reference

> Language: English | 日本語
> Last updated: 2026-{YYYY-MM-DD}
> Audience: Aphelion 利用者 (利用者プロジェクトで hook を運用する人)

## Table of Contents
- aphelion-secrets-precommit (hook A)
- aphelion-sensitive-file-guard (hook B)
- aphelion-deps-postinstall (hook E)
- How hooks are distributed
- Disabling a hook
- Adding your own hook
- Troubleshooting
- Related Pages
- Canonical Sources

## hook A / B / E (各セクション)
   - Canonical path
   - Scope (どの tool 呼び出しで fire するか)
   - Block behavior (block / non-block、exit 2 / 0)
   - Bypass mechanism
   - Interactions (関連 slash command、関連 rule)
   - Summary (1〜2 段落)

## How hooks are distributed
   - npx aphelion-agents init / update の挙動
   - settings.json (init copies, update protects) と hooks/ (毎回 overlay) の差
   - 実行ビットの自動付与 (chmodHooks)

## Disabling a hook
   - .claude/settings.json を編集して該当 PreToolUse / PostToolUse エントリを削除
   - update でも保護される (settings.json は init-only)

## Adding your own hook
   - .claude/hooks/local/your-hook.sh に置く (overlay の対象外)
   - .claude/settings.json の hooks セクションに追記

## Troubleshooting
   - hook が動かない / 誤検知の対処、WSL 推奨の明記、Windows native は Phase 2

## Related Pages
   - Rules-Reference (hooks-policy)
   - Getting-Started (Aphelion 全体の導入)

## Canonical Sources
   - src/.claude/hooks/
   - src/.claude/settings.json
   - src/.claude/rules/hooks-policy.md
```

JA 版は EN canonical date marker (`> EN canonical: {date}`) を付与する
(`docs/wiki/ja/{slug}.md` の通例、`Rules-Reference.md` 参照)。

## 9. Rules-Reference.md / aphelion-overview.md changes

### 9.1 Rules-Reference.md (en + ja)

PR 1b で **rules count を 12 → 13 に bump** する変更が同梱される。

| 箇所                                  | 現行 (12)                                      | PR 1b 後 (13)                                                |
|---------------------------------------|------------------------------------------------|--------------------------------------------------------------|
| L13 lead 文                           | "compact reference for all 12 behavioral rules" | "compact reference for all 13 behavioral rules"               |
| Update history L6                     | -                                              | "2026-{date}: add hooks-policy entry, sync rule count to 13 (#107)" |
| Table of Contents                     | 12 entries                                     | 13 entries (`hooks-policy` を `sandbox-policy` の隣に挿入)   |
| 詳細セクション                         | 12 sections                                    | 13 sections (新セクション `hooks-policy` を追加)              |

ja 版は en canonical date marker を更新 (`> EN canonical: 2026-{date}`)。

### 9.2 aphelion-overview.md

**変更**: "Hook layer" 段落を Cross-cutting agents 表の **直後** に新設。

```markdown
### Hook layer

Aphelion ships a small set of Claude Code hooks under `.claude/hooks/` to provide a
fourth defense layer (proactive content scan) on top of `settings.local.json` deny
rules, `sandbox-runner` isolation, and `denial-categories` post-mortem classification.
The MVP hook set focuses on user-project safety: secrets pre-commit guard, sensitive
file write block, and dependency-install vuln-scan reminder.

See `hooks-policy.md` (rule, auto-loaded) and `docs/wiki/en/Hooks-Reference.md`
(user-facing) for details.
```

Update history に 2026-{date} エントリを追加。

### 9.3 ja 版 aphelion-overview.md

該当箇所 (Cross-cutting agents の直後) に同等内容を JA で追記。skeleton heading
(`### Hook layer`) は EN-fixed なのでそのまま。

## 10. site/ 配下 (astro.config.mjs PAGES)

`site/` (Cloudflare Pages の Astro サイト) にも wiki page を配信する。新ページ追加に伴い
`site/astro.config.mjs` の `PAGES` 配列 (en/ja とも) に **新 leaf** を追加する必要がある:

| 配列                       | 新エントリ                                  |
|---------------------------|---------------------------------------------|
| EN PAGES                  | `{ slug: 'Hooks-Reference', title: 'Hooks Reference' }` |
| JA PAGES                  | `{ slug: 'Hooks-Reference', title: 'Hooks リファレンス' }` |

挿入位置は `Rules-Reference` の隣 (アルファベット順 / 既存パターン踏襲)。
`scripts/sync-wiki.mjs` は配列ベースで巡回するため、PAGES に追加しないと wiki/Hooks-Reference.md
は site/ にコピーされない。これは PR 1b の **必須** 同期更新項目。

(developer 注: 既存 PAGES の正確な構造は `site/astro.config.mjs` を実装直前に再 Read すること。
PR 1b 着手時点での AST が architect 設計時点と異なる可能性がある。)

## 11. README badge changes

PR 1b と PR 1d で 2 種類の badge 変更が走る:

### 11.1 PR 1b: rules badge bump (12 → 13)

| ファイル          | 現行                                                         | PR 1b 後                                                       |
|------------------|--------------------------------------------------------------|----------------------------------------------------------------|
| `README.md` L6   | `![rules](https://img.shields.io/badge/rules-12-green)`     | `![rules](https://img.shields.io/badge/rules-13-green)`       |
| `README.ja.md`   | (同等の rules-12)                                            | rules-13                                                       |
| `Rules-Reference.md` lead                          | "all 12 behavioral rules" | "all 13 behavioral rules" |

### 11.2 PR 1d: hooks badge 新設

| ファイル          | 追加                                                          |
|------------------|---------------------------------------------------------------|
| `README.md` L6   | `commands-14` の隣に `![hooks](https://img.shields.io/badge/hooks-3-orange)` |
| `README.ja.md`   | 同様に追加 (Repo-root README sync convention §3.2 同 PR 必須)                |
| `CHANGELOG.md`   | `[Unreleased]` に "Added: Aphelion hooks (3 MVP)" 追記                       |

**`scripts/check-readme-wiki-sync.sh` への影響**:

- Check 1 (agent count): 影響なし (agent 数不変)
- Check 2 (slash command list): 影響なし (commands 不変)。ただし PR 1d で
  `secrets-scan.md` を refactor する際、`aphelion-help.md` テーブル / `Getting-Started.md` の
  `/secrets-scan` エントリを削除しないこと (機能継続のため)。
- Check 3 (^## heading parity): 影響なし (README 構造不変、badge 行は L6 で `^## ` 行ではない)

PR 1d で hooks badge を grep する CI check を追加するかは architect 判断: **追加しない**
(badge 数値が手動運用なのは agents/commands/rules と同じであり、hooks のみ自動 enforce する
非対称性を導入する利益が薄い。代わりに `CHANGELOG.md` 更新を PR テンプレ checklist で促す)。

## 12. PR strategy (1a / 1b / 1c / 1d)

| PR | 範囲                                                                                                        | 規模 | check-readme-wiki-sync.sh | rules count 変動 |
|----|-------------------------------------------------------------------------------------------------------------|------|---------------------------|------------------|
| 1a | `src/.claude/hooks/` (4 ファイル) + `src/.claude/settings.json` + `bin/aphelion-agents.mjs` + `package.json#files` | 中    | unaffected                | 不変             |
| 1b | `src/.claude/rules/hooks-policy.md` + `aphelion-overview.md` 更新 + `Rules-Reference.md` (en/ja) + `Hooks-Reference.md` (en/ja 新規) + `Home.md` (en/ja) Related Pages + `site/astro.config.mjs` PAGES + `README.md` / `README.ja.md` rules badge 12→13 | 中    | check 影響あり (rules count) | **12 → 13**       |
| 1c | dogfooding: 本 repo `.claude/settings.json` (新規 commit) + 旧 MVP 3 hook (md-sync / agent-count / task-md-check) を `src/.claude/hooks/` に同居 | 中    | unaffected                | 不変             |
| 1d | `.claude/commands/secrets-scan.md` refactor (canonical 参照化) + `README.md` / `README.ja.md` hooks-3 badge + `CHANGELOG.md` | 小    | unaffected (commands 不変) | 不変             |

各 PR の境界設計理由:

- **1a / 1b 分離**: 1a は **コード** (hooks 動作の core)、1b は **ドキュメント + rules count 同期**。
  rules count 12→13 は 1b で **完結** させる (1a で hooks-policy.md を入れずに code のみ入れることで、
  1a の CI が rules badge 検証に巻き込まれない)。これにより 1a が独立に revert 可能。
- **1c 分離**: dogfooding は本 repo 専用の hook 同居なので、配布物 (1a + 1b) と分ける。
  1c が落ちても 1a / 1b の配布物には影響しない設計。
- **1d 分離**: secrets-scan.md refactor は hook A の正常動作に依存するため 1a の後に来る。
  README badge `hooks-3` も hook 配布が完了した後に出すのが自然。

### 12.1 PR 1a 必須成果物 (CI 通過条件)

- [ ] `src/.claude/hooks/aphelion-secrets-precommit.sh` (§4.1 アウトライン準拠)
- [ ] `src/.claude/hooks/aphelion-sensitive-file-guard.sh` (§4.2)
- [ ] `src/.claude/hooks/aphelion-deps-postinstall.sh` (§4.3)
- [ ] `src/.claude/hooks/lib/secret-patterns.sh` (§4.4)
- [ ] `src/.claude/settings.json` (§5)
- [ ] `bin/aphelion-agents.mjs` 拡張 (§6.2 / 6.3 / 6.4)
- [ ] `package.json#files` 拡張 (§6.5)
- [ ] (任意) `bin/smoke-update.sh` で settings.json protect / hooks/ overlay 回帰テストを追加
- [ ] `shellcheck src/.claude/hooks/*.sh src/.claude/hooks/lib/*.sh` で no errors
- [ ] `node bin/aphelion-agents.mjs init` を tmpdir で実行し、hooks/ + settings.json 配置確認
- [ ] `bash scripts/check-readme-wiki-sync.sh` が pass (count 不変なので影響なし)

### 12.2 PR 1b 必須成果物 (CI 通過条件)

- [ ] `src/.claude/rules/hooks-policy.md` 新規 (§7 アウトライン)
- [ ] `src/.claude/rules/aphelion-overview.md` "Hook layer" 段落追加 + Update history 更新 (§9.2 / 9.3 en/ja)
- [ ] `docs/wiki/en/Rules-Reference.md` rule entry 追加 + lead 文 12→13 + ToC 更新 (§9.1)
- [ ] `docs/wiki/ja/Rules-Reference.md` 同期 (EN canonical date marker 更新)
- [ ] `docs/wiki/en/Hooks-Reference.md` 新規 (§8)
- [ ] `docs/wiki/ja/Hooks-Reference.md` 新規 (§8、Bilingual Sync 必須)
- [ ] `docs/wiki/en/Home.md` Related Pages に Hooks-Reference 追加
- [ ] `docs/wiki/ja/Home.md` 同期
- [ ] `site/astro.config.mjs` PAGES 配列 (en/ja とも) に Hooks-Reference エントリ追加 (§10)
- [ ] `README.md` rules badge 12→13 (§11.1)
- [ ] `README.ja.md` rules badge 12→13 (Repo-root README sync convention 同 PR 必須)
- [ ] `bash scripts/check-readme-wiki-sync.sh` が pass (Check 1 / 2 / 3 全 pass、rules count は本 script の対象外であることを確認)

### 12.3 PR 1c 必須成果物

- [ ] 本 repo `.claude/settings.json` 新規 (PR 1a の template + 旧 MVP 3 hook 同居)
- [ ] `src/.claude/hooks/aphelion-md-sync.sh` (旧 MVP、本 repo dogfooding 専用、scripts/check-readme-wiki-sync.sh をラップ)
- [ ] `src/.claude/hooks/aphelion-agent-count-check.sh` (旧 MVP)
- [ ] `src/.claude/hooks/aphelion-task-md-lifecycle.sh` (旧 MVP、developer SubagentStop 時の reset 確認)
- [ ] `.gitignore` 確認: `.claude/settings.json` は **commit 対象** (本 repo dogfooding を共有資産とする)
- [ ] dogfooding 動作確認: 本 repo で任意 commit を hook A 経由で 10 件通し、誤検知率を測定
      (analyst R2 mitigation)

### 12.4 PR 1d 必須成果物

- [ ] `.claude/commands/secrets-scan.md` refactor (§3 末尾の refactor target 仕様準拠)
- [ ] `README.md` `hooks-3` badge 追加
- [ ] `README.ja.md` 同期 (Repo-root README sync 同 PR 必須)
- [ ] `CHANGELOG.md` `[Unreleased]` "Added: Aphelion hooks (3 MVP)" 追記
- [ ] PR description で 1a / 1b / 1c の merge 順を明記

## 13. Test strategy

### 13.1 PR 1a (hook 配布 / bin/ 拡張)

| 種別               | 内容                                                                          |
|--------------------|-------------------------------------------------------------------------------|
| Static lint        | `shellcheck src/.claude/hooks/*.sh src/.claude/hooks/lib/*.sh` で no errors    |
| Smoke (init)       | `node bin/aphelion-agents.mjs init` を tmpdir で実行 → hooks/3 + lib/1 + settings.json + 実行ビット確認 |
| Smoke (update)     | 既存 `.claude/settings.json` を残した状態で update → 保護 + warn 出力 + hooks/ overlay 確認 |
| Hook A 単体        | `git diff --cached` で AKIA / sk-ant- 等を含む staged content を作り、hook が exit 2 で block することを確認 |
| Hook A bypass      | commit message に `[skip-secrets-check]` を含めた場合に exit 0 で通過することを確認 |
| Hook B 単体        | `.env` 書き込み → exit 2、`.env.example` → exit 0、`tests/fixtures/.env` → exit 0 |
| Hook E 単体        | `npm install foo` の payload を流して stderr に `/vuln-scan` 推奨が出ることを確認 |
| `npm pack --dry-run` | 配布物に `src/.claude/hooks/` と `src/.claude/settings.json` が含まれることを確認 |

### 13.2 PR 1b (docs / rules count bump)

| 種別               | 内容                                                                          |
|--------------------|-------------------------------------------------------------------------------|
| Sync check         | `bash scripts/check-readme-wiki-sync.sh` で全 check pass                      |
| Wiki bilingual     | `docs/wiki/en/Hooks-Reference.md` と `docs/wiki/ja/Hooks-Reference.md` の `^## ` heading 数 / 順序が一致 |
| Site build         | `cd site && npx astro build` (もしくは sync-wiki.mjs dry-run) でリンク切れなし |
| Rules-Reference 整合 | `docs/wiki/en/Rules-Reference.md` の lead 文と ToC が "13" を反映              |

### 13.3 PR 1c (dogfooding)

- 本 repo の任意 commit を 10 件 hook A 経由で通し、誤検知率を測定 (analyst R2 mitigation)
- 旧 MVP 3 hook が本 repo の特定操作 (例: `.claude/agents/` 編集後の commit) で正しく
  fire することを確認

### 13.4 PR 1d (secrets-scan refactor / badge)

- `/secrets-scan` slash command が refactor 後も既存ファイル群に対し誤検知 0 で動作 (
  本 repo の `.claude/agents/`, `.claude/rules/`, `bin/` を対象に dry-run)
- `README.md` / `README.ja.md` の badge レンダリング目視確認 (shields.io URL が valid)

## 14. Risk register

analyst §8 の R1〜R6 を継承し、architect が R7〜R9 を追加。

| #  | リスク                                                                            | 影響度 | mitigation                                                                                |
|----|-----------------------------------------------------------------------------------|--------|-------------------------------------------------------------------------------------------|
| R1 | `update` が既存 `settings.json` を破壊                                            | 重大   | §6.4 で `hasSettings` ガード必須。`bin/smoke-update.sh` に回帰テスト追加 (§13.1)             |
| R2 | hook A の誤検知で commit ブロック → DX 破壊                                       | 中     | `[skip-secrets-check]` bypass。PR 1c dogfooding で誤検知率測定                              |
| R3 | hook B path matcher が利用者プロジェクト構造で誤動作                              | 中     | §2.1 ALLOW_PATH_PATTERNS で test fixtures / docs / examples を allow-list                  |
| R4 | bash + grep 前提で Windows native 不動作                                          | 小     | Hooks-Reference.md に "WSL 推奨" 明記、Phase 2 で PowerShell 版                              |
| R5 | `secret-patterns.sh` canonical 化で `secrets-scan.md` の LLM 文脈判断が失われる   | 小     | hook A 検出時に `/secrets-scan` 再精査を stderr で促す (§4.1)                                |
| R6 | hook script 自体のバグで作業停止                                                  | 小     | 各 hook 冒頭で `trap ... ERR` → exit 0 fail-open (§4 共通構造)                              |
| R7 | hook が **値そのもの** を stderr に書き出して transcript / commit log に漏洩      | 中     | hook A は pattern ID のみ報告、値は出さない (§4.1)                                          |
| R8 | `chmod +x` ビット欠落で hook が `permission denied` で全停止 (Windows clone 経由) | 中     | `bin/aphelion-agents.mjs` の `chmodHooks()` で init / update のたびに 0755 付与 (§6.3)        |
| R9 | settings.json の `if` 構文が複雑化し利用者カスタマイズ時に壊れやすい              | 小     | Hooks-Reference.md "Adding your own hook" セクションで Aphelion entry をコピー編集する手順を案内 (§8) |

## 15. Implementation checklist for developer (PR 1a 用)

developer は本セクションを **作業順** にこなすこと。各項目はおおむね 1 commit に対応。

1. **TASK-001** branch 作成
   - `git checkout main && git pull && git checkout -b feat/aphelion-hooks-mvp`
   - REPO_STATE probe (.claude/rules/git-rules.md §Startup Probe)

2. **TASK-002** secret-patterns.sh canonical 作成
   - 対象: `src/.claude/hooks/lib/secret-patterns.sh`
   - §4.4 のアウトラインに準拠
   - `shellcheck` で clean

3. **TASK-003** hook A: secrets-precommit
   - 対象: `src/.claude/hooks/aphelion-secrets-precommit.sh`
   - §4.1 のアウトラインに準拠、§3 の 8 regex を `secret-patterns.sh` から source
   - 単体テスト: `git diff --cached` 偽 input で exit 2 / exit 0 を確認

4. **TASK-004** hook B: sensitive-file-guard
   - 対象: `src/.claude/hooks/aphelion-sensitive-file-guard.sh`
   - §4.2 + §2.1 の判定順序を厳密に実装
   - 単体テスト: 8 ケース (`.env` block / `.env.example` allow / `tests/.env` allow / `*.pem` block / `docs/.../sample.pem` allow / `*.key` block / `credentials.json` block / `random.txt` allow)

5. **TASK-005** hook E: deps-postinstall
   - 対象: `src/.claude/hooks/aphelion-deps-postinstall.sh`
   - §4.3 アウトライン準拠、tech stack 5 種 (Node/Python uv/Python pip/Rust/Go) で stderr 出力確認

6. **TASK-006** settings.json テンプレ
   - 対象: `src/.claude/settings.json`
   - §5 完全 JSON コピー、`description` 含む

7. **TASK-007** bin/aphelion-agents.mjs 拡張
   - §6.2 / 6.3 / 6.4 の差分適用
   - `chmodHooks()` helper 追加
   - showHelp 文言更新

8. **TASK-008** package.json#files 拡張
   - §6.5 の 2 行追加

9. **TASK-009** smoke test (回帰追加)
   - `bin/smoke-update.sh` に settings.json protect / hooks/ overlay の test を追加 (任意だが推奨)
   - `npm pack --dry-run` で配布対象確認

10. **TASK-010** PR 1a 提出
    - `gh pr create` (.claude/rules/git-rules.md 準拠)
    - PR title: `feat: introduce Aphelion hooks MVP (PR 1a/4: scripts + bin) (#107)`
    - PR body: `Closes #107` (PR 1d で最終 close、各 PR は `Linked Issue: #107`)
    - linked plan: `docs/design-notes/aphelion-hooks-architecture.md`

11. PR 1a レビュー後、PR 1b 着手 (§12.2)。PR 1b 着手前に **再度 main を pull** し、
    `site/astro.config.mjs` の最新 PAGES 配列を Read してから差分を入れる。

実装中に design-note と矛盾する事項が見つかった場合、`AGENT_RESULT` に
`STATUS: blocked` + `BLOCKED_TARGET: architect` で fall-back する
(.claude/rules/agent-communication-protocol.md §blocked STATUS Usage)。
