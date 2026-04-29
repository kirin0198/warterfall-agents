# refactor: clarify README ↔ Wiki responsibility split and add cross-source consistency checks

> Reference: current `main` (HEAD post-#75, 2026-04-29)
> Created: 2026-04-26
> Last updated: 2026-04-29
> Update history:
>   - 2026-04-26: 初稿（analyst, #76 §1–§8 を一括下書き）
>   - 2026-04-29: 言語ポリシーを #75（`language-rules.md` "Hand-authored canonical narrative"）へ委譲。
>     §3 / §5 / §7 / §8 を「コンテンツ層」と「整合性検査機構」のみにスコープ縮小。
>     `scripts/check-readme-wiki-sync.sh` の正規表現を実テキスト（`31 エージェント`）に合わせて修正。
> Analyzed by: analyst (2026-04-26 → 2026-04-29 update)
> Author: analyst (design-only phase — no implementation yet)
> Scope: design / planning document; the change will be executed in a follow-up `developer` phase
> GitHub Issue: [#76](https://github.com/kirin0198/aphelion-agents/issues/76)
> Implemented in: [#83](https://github.com/kirin0198/aphelion-agents/pull/83)

> **Language policy note** — このノートは新ポリシー（`docs/design-notes/<slug>.md` は単一言語、Output Language に追従、現状 `ja`）の発効前に作成された。skeleton 見出し（`## 1. Background & Motivation` 等）は新ルールの "English-fixed" 規定どおり英語で残し、本文はすべて日本語で統一する。初稿時の英語混在箇所は本更新で日本語化していない（既存の正確な記述まで触る必要はないため）。新規追記分は日本語で記述している。

---

## 1. Background & Motivation

### 1.1 元 issue の主旨

> README ↔ Wiki の二重情報・責任分担が暗黙のままになっている。PR #69 で README を 208/202 行 → 75 行に圧縮したが、依然として両者をまたぐ情報（コマンド一覧、agent 数、Quick Start、Features 等）が残り、片方だけ更新される事故が起こりうる。

### 1.2 補足コンテキスト

- **本 issue は #53 の意図的な持ち越し**。`docs/design-notes/archived/readme-readability-wiki-links.md` §4 question 3 および §7 Out of scope の第 1 項目が、まさに「Wiki と README のメンテ責任分担の明文化」を別 issue へ送ると明記している。
- README は PR #69 で「ランディングページ」として再定義されたが、その**位置づけ自体はリポジトリ内のどこにも明文化されていない**。Contributing.md §"README vs Wiki separation" には簡素な 3 行の指示があるのみ（後述 §2.3）。
- PR #67（`/pm` ショートカット削除、Closes #55）は本問題の**生きた実例**。PR body から:

  > Drop 11 `/pm` references across 6 files (Shortcuts table, READMEs, wiki Home + Getting-Started for both languages)

  この 6 ファイル同時更新が必要であることは、貢献者が `grep -rn '/pm'` を手で打って初めて分かった。Contributing.md / PR Checklist のどこにも「コマンド削除時は最低でもこの 6 サーフェスを当たれ」とは書かれていない。
- Aphelion のリリースサイクル（`package.json` version bump → `npx ... update`）でユーザーに届くのは `.claude/` 配下のみだが、READMEとWiki はリポジトリ可視層であり、GitHub の repo ホームを開いた読者にとっては **README が事実上の正規ソース**として機能する。Wiki が canonical という運用と GitHub 側 UX のズレも、責任分担を明文化すべき動機の 1 つ。

### 1.3 ゴール

新規貢献者が「ある変更を加えるとき、どのファイル群を同時に触るべきか」を **grep に頼らず Contributing.md または overview から判断できる** 状態にする。さらに、忘れがちな項目（agent 数、コマンド一覧）を機械チェックで担保する。

---

## 2. Current state

### 2.1 README と Wiki の現行ファイル群

| ファイル | 行数 (HEAD) | 性格 |
|----------|-------------|------|
| `README.md` | 75 | ランディングページ (en) |
| `README.ja.md` | 75 | ランディングページ (ja) |
| `docs/wiki/en/Home.md` | 103 | Wiki エントリ (en) |
| `docs/wiki/ja/Home.md` | 104 | Wiki エントリ (ja) |
| `docs/wiki/en/Getting-Started.md` | 319 | クイックスタート canonical (en) |
| `docs/wiki/ja/Getting-Started.md` | 306 | クイックスタート canonical (ja) |
| `docs/wiki/en/Contributing.md` / `ja/Contributing.md` | (相互 sync 規定あり) | 貢献ルール |
| `.claude/commands/aphelion-help.md` | 46 | スラッシュコマンド一覧（実行時表示） |

### 2.2 README ↔ Wiki / コマンド定義間の重複箇所（実 grep で確認）

`grep -nE "npx github:kirin0198|aphelion-init|aphelion-help|/discovery-flow|/delivery-flow|/operations-flow|/maintenance-flow"` および `grep "31 agents\|31 specialized"` の結果から得られた重複点:

| 項目 | README.md | README.ja.md | Wiki Home (en/ja) | Wiki Getting-Started (en/ja) | aphelion-help.md | `.claude/agents/` 実体 |
|------|-----------|--------------|--------------------|------------------------------|------------------|----------------------|
| **Aphelion キャッチコピー（agent 数）** | L3: `31 specialized agents` | L3: `31 の専門エージェント` | Home L22 / L37: `all 31 agents` | — | — | `ls .claude/agents/ \| wc -l` = **31** |
| **Quick Start `npx ... init` コマンド** | L41 | L41 | — | L29 (prose) / L45 (code) | — | — |
| **`/aphelion-init` 案内** | L43 | L43 | — | L99 / L235 | "Shortcuts" 表 | `aphelion-init.md` |
| **`/aphelion-help` 案内** | L49 | L49 | — | L105 / L236 / L250 | "Discoverability" 表 | `aphelion-help.md` |
| **`/discovery-flow` 言及** | (Learn more 圏外) | — | Home L48 | L79, L110, L148, L237 | Orchestrators 表 | `discovery-flow.md` |
| **`/delivery-flow` 言及** | — | — | — | L122, L154, L168, L184, L216, L238 | Orchestrators 表 | `delivery-flow.md` |
| **`/operations-flow` 言及** | — | — | — | L134, L160, L239 | Orchestrators 表 | `operations-flow.md` |
| **`/maintenance-flow` 言及** | — | — | Home L67, L89 | L194, L241 | Orchestrators 表 | `maintenance-flow.md` |
| **3-domain 図 (mermaid)** | L15-26 | L15-26 | — (描かない) | — | — | — |
| **Features 5 項目** | L55-59 | L55-59 | — | — | — | — |
| **Wiki ページ目次（5 項目）** | L65-69 | L65-69 | L29-39 (Core Pages 表) | — | — | — |
| **Triage Plan 名 (Minimal/Light/Standard/Full)** | (削除済) | — | Home L79 (glossary) | — | — | `aphelion-overview.md` |

### 2.3 Contributing.md の現行記述（en, L125-129）

```markdown
### README vs Wiki separation

- **README**: Entry point and Quick Start. Keep it short — setup, scenarios, command reference.
- **Wiki**: Detailed reference. Agent schemas, rule explanations, triage logic.
- Do not add detailed reference content to README. Do not add Quick Start content to the wiki Home.md.
```

評価:
- **役割定義は最低限ある**が、抽象的（"keep it short" / "detailed reference"）。
- **どの項目が両方に存在し、同時更新を要するか**は一切列挙されていない。
- **README 自体が canonical か mirror か**の宣言がない（読者は「README がランディング」と認識するが、執筆責任までは追えない）。
- **PR Checklist (L155-163)** は wiki/en ↔ wiki/ja の sync を強制しているが、`README.md` `README.ja.md` は登場しない。Wiki ↔ README の co-update も同様に登場しない。
- bilingual sync policy (L133-147) は wiki 限定で、README en ↔ ja には適用されない（運用慣行として両方更新する暗黙合意のみ）。

### 2.4 アクシデントモデル（過去の更新パターン）

PR ログを見るに、README と Wiki の同時更新が必要だった近過去の典型例:

| PR | 必要だった同時更新サーフェス | 漏れの起こりやすさ |
|----|------------------------------|----------------------|
| #67 (remove `/pm`) | aphelion-help.md / README.md / README.ja.md / Home (en/ja) / Getting-Started (en/ja) = 6 ファイル | 高（grep に頼った） |
| #69 (README compression) | README.md / README.ja.md + Wiki Getting-Started 軽微補強 = 3〜4 ファイル | 中（事前 plan があった） |
| #42 (Agents-Reference 分割) | wiki/en/ と wiki/ja/ の Agents-* 5 ペア + Home の目次 + Contributing | 中（bilingual sync policy が機能） |
| 仮想シナリオ: 32 番目の agent 追加 | `.claude/agents/` 追加 + Agents-{Domain}.md (en/ja) + README.md L3 + README.ja.md L3 + Home.md L22, L37 (en) + ja Home の対応行 | **高**（README L3 を忘れがち） |

agent 数の 32 化は将来必ず起こる。`grep -rn "31 agents\|31 specialized"` で 4 サーフェスがヒットするが、貢献者が事前にこの grep を実行する保証はない。

### 2.5 現行 PR Checklist の限界

> **2026-04-29 注記**: #75 が `en/Contributing.md` 冒頭に "Source of truth" callout（L137–141）を挿入し、Bilingual Sync Policy が wiki 限定であることを明示した。これにより「READMEに対する bilingual sync policy がない」という当初の漏れ指摘は **#75 によって**意図的な区切りとして整理済み — language-rules.md が canonical。残るのは下記のとおり、**Checklist 自体に**「README ↔ Wiki コンテンツ層の co-update」という観点が依然欠けている点。

`docs/wiki/en/Contributing.md` L161–170 の Checklist:

- [x] Canonical source (`.claude/agents/` or `.claude/rules/`) updated
- [x] `wiki/en/` page updated (if the change affects wiki content)
- [x] `wiki/ja/` page updated in the same PR (bilingual sync)
- [x] `> Last updated:` line updated in modified wiki pages
- [x] `> EN canonical:` line updated in corresponding `wiki/ja/` pages
- [x] Matching `Agents-{Domain}.md` or `Rules-Reference.md` entry updated
- [x] If a new flow / orchestrator is added, update all integration points: Architecture-Domain-Model.md figures, ...
- [x] If a new file is added under `.claude/commands/`, also append a row to `.claude/commands/aphelion-help.md`
- [x] `package.json` `version` bumped if any file under `.claude/agents/`...

漏れ（コンテンツ層に限定。言語層は #75 で別ファイルに整理済み）:
- **README ↔ Wiki の co-update（コンテンツ層の同時更新）が Checklist に登場しない**。Wiki ページを修正すると README L3 / 65–69 の更新が必要なケースがあるが、項目化されていない。
- agent 数表記の整合性チェックがない（4 サーフェスにハードコード）。
- aphelion-help.md ↔ Wiki Getting-Started.md §Command Reference の整合性チェックがない（既に列構造が異なる）。

---

## 3. Proposed approach

> **Scope after #75 landing** — #75 (`src/.claude/rules/language-rules.md` →
> "Hand-authored canonical narrative") が、`README.md` ↔ `README.ja.md` の bilingual
> 関係および canonical 言語を**正規ルールとして宣言済み**。本 issue (#76) はその上で、
> 言語層には介入せず「**コンテンツ層の責任分担**」と「**サーフェス間ドリフト検出機構**」
> の 2 点のみをスコープとする。
>
> 具体的には:
> - 「README は landing / Wiki は canonical」というロール定義は維持・補強する（コンテンツ層の話題）
> - 「README en ↔ ja を同時更新せよ」というルールは **language-rules.md と repo-root README sync convention に既に存在**するため、本 issue では再宣言せず**ポインタのみ置く**（旧 §3.1.4 を削除）
> - en/Contributing.md は #75 で既に "Source of truth" callout（L137–141）が追加されており、Bilingual Sync Policy は wiki 限定であることが明示されている。**ここに README 並列ルールを混ぜ戻すのは #75 と矛盾する**

### 3.1 設計方針

1. **ドキュメントによる明文化 + 機械チェックのハイブリッド**: 暗黙ルールを Contributing.md に書き起こすだけでは漏れる（PR #67 の経験）。grep ベースの軽量スクリプトで重要 2 項目（agent 数、コマンド一覧）を機械的にガードする。
2. **README は "landing snapshot"、Wiki は "canonical" の関係を明示する**。「mirror」と書くと自動同期の含意が出るので **"landing page that snapshots a hand-curated subset of facts from the Wiki"** のような表現にする（自動再生成は Out of scope）。
3. **PR Checklist にコンテンツ層の co-update 行を追加する**。Wiki のページが触られたとき、`README.md` `README.ja.md` を grep で確認するチェック項目を 1 行追加する。**bilingual / 言語層のチェックは追加しない**（#75 + 既存 sync convention に委譲）。
4. **重複項目の "co-update set" 表を 1 つ作る**。Contributing.md に「以下の値はリポジトリ内 N サーフェスに重複している。ひとつ更新したら全部探せ」という物理的なリストを置く。これは README ↔ Wiki の**コンテンツ境界**を運用ルールとして固定するための表である。
5. **"境界線" の運用ルールを明文化する**。READMEに何を**書くべきでない**か（= Wikiに置くべきもの）の判定基準を 1 段落で書く。例: 「3 行を超える解説」「条件分岐ロジック（plan 選択など）」「画面/CLI の網羅 reference」は Wiki 側へ。「導入動線（npx → init → help）」「3-domain の図 1 つ」「5 項目以下の Features 箇条書き」は README に残せる。

### 3.2 ドキュメント変更案

#### 3.2.1 `docs/wiki/{en,ja}/Contributing.md` §"README vs Wiki separation" の拡張

現行 3 行を以下のような節へ拡充:

```markdown
### README ↔ Wiki responsibility split

**Roles**

- **README** (`README.md` / `README.ja.md`) — landing page. Snapshots a small,
  hand-curated subset of facts from the Wiki: tagline + agent count, Quick Start
  command, Features (5 bullet points), and a Learn-more link section. The README
  is **not** a canonical source for any of these; it mirrors the Wiki.
- **Wiki** (`docs/wiki/{en,ja}/`) — canonical reference. Agent schemas, rule
  explanations, triage logic, command reference, troubleshooting all live here.
  The Wiki is the source of truth for everything the README mentions.

**Co-update set**

The following facts are intentionally duplicated between README and Wiki.
Updating one without the others is a defect; reviewers will block the PR.

| Fact | README sites | Wiki sites | Other sites |
|------|--------------|------------|-------------|
| Agent count (`31`, `32`, …) | `README.md` L3, `README.ja.md` L3 | `docs/wiki/en/Home.md` (×2), `docs/wiki/ja/Home.md` (×2) | — |
| Slash command names | (none — README defers to `/aphelion-help`) | `docs/wiki/{en,ja}/Getting-Started.md` §Command Reference | `.claude/commands/aphelion-help.md` |
| Quick Start command (`npx … init`) | `README.md`, `README.ja.md` (Quick Start section) | `docs/wiki/{en,ja}/Getting-Started.md` §Quick Start | — |
| 3-domain mermaid figure | `README.md`, `README.ja.md` | (Wiki uses prose + Architecture diagrams instead) | — |
| Features bullets (5 items) | `README.md`, `README.ja.md` | (Wiki Home Persona-Based Entry Points covers same ground in prose) | — |
| Plan tier names (Minimal/Light/Standard/Full) | (none currently) | `docs/wiki/{en,ja}/Triage-System.md`, `Home.md` glossary | `.claude/rules/aphelion-overview.md` |

**README en ↔ ja parity**

`README.md` and `README.ja.md` are bilingual at the repository root with English
canonical. The sync convention is governed by
[`language-rules.md` → "Hand-authored canonical narrative"](../../src/.claude/rules/language-rules.md)
and the repo-root README sync convention — **not** by this Wiki Bilingual Sync
Policy. See `language-rules.md` for the authoritative rule. (#75)
```

> **境界線運用ルール（README に置いてよい / Wiki へ送るべき）**
>
> README に **残してよい** もの:
> - 1 行 tagline + agent 数（landing snapshot の対象）
> - 3-domain mermaid 図 1 つ（プロジェクト一目把握用）
> - Quick Start 3 コマンド（`npx … init` / `cd && claude` / `/aphelion-init`）
> - Features 箇条書き 5 項目以下（各 1 行）
> - Wiki 主要 5 ページへのリンク群
>
> README に **置かない** もの（= Wiki に送る）:
> - スラッシュコマンドの網羅表（`/aphelion-help` への参照に留める）
> - インストール代替手段の詳細（`--user` / git clone 等）
> - cache caveat やトラブルシューティング
> - triage plan 選択ロジックの解説
> - エージェント別の入出力 / NEXT 条件
> - 任意の persona-based entry point
>
> 判定基準: **「3 行を超える解説」「条件分岐ロジック」「網羅 reference」は Wiki 側**。
> このルールは `Contributing.md` §"README ↔ Wiki responsibility split" 末尾に短い
> パラグラフとして残す（co-update set 表の前置きとして機能させる）。

#### 3.2.2 PR Checklist の追記（`Contributing.md` §"Pull Request Checklist"）

現行の 9 項目（en/Contributing.md L161–170）に以下 1 項目を追加。**README en ↔ ja parity チェック行は追加しない**（#75 の language-rules.md と repo-root sync convention で既にカバーされている）。

```markdown
- [ ] If the change touches anything in the **README ↔ Wiki co-update set**
      (see "README ↔ Wiki responsibility split"), all duplicated sites are
      updated in this PR. Run:
      ```
      bash scripts/check-readme-wiki-sync.sh
      ```
      and confirm no diffs are reported.
```

#### 3.2.3 `aphelion-overview.md` の 1 行追記（任意）

ルールファイルに 1 文だけ "README is the landing snapshot; Wiki is canonical" を加えるかどうかは判断分岐。aphelion-overview.md は Claude Code のセッション起動時に auto-load されるため、過剰に増やすと token を消費する。**推奨**: aphelion-overview.md は触らず、Contributing.md だけで完結させる。理由は overview がエージェントの実行時挙動の文書であり、人間貢献者向けの sync ルールはスコープ外であるため。

#### 3.2.4 機械チェックスクリプト `scripts/check-readme-wiki-sync.sh`

最小実装案。実テキストは以下のとおり（HEAD 2026-04-29 で grep 確認済み）:

| サーフェス | 表記例 |
|------------|--------|
| `README.md` L3 | `31 specialized agents` |
| `README.ja.md` L3 | `31 の専門エージェント` |
| `docs/wiki/en/Home.md` L22 / L37 | `all 31 agents` |
| `docs/wiki/ja/Home.md` L23 / L38 | `31 エージェント` （`全` プレフィクスは付かない） |

```bash
#!/usr/bin/env bash
set -euo pipefail

# Check 1: agent count
ACTUAL=$(ls .claude/agents/ | wc -l | tr -d ' ')
README_EN=$(grep -oE "[0-9]+ specialized agents" README.md | grep -oE "[0-9]+" | head -1)
README_JA=$(grep -oE "[0-9]+ の専門エージェント" README.ja.md | grep -oE "[0-9]+" | head -1)
HOME_EN=$(grep -oE "all [0-9]+ agents" docs/wiki/en/Home.md | head -1 | grep -oE "[0-9]+")
# ja Home は "31 エージェント" 形式（"全" は付かない）。複数行ヒットするため uniq で重複除去
HOME_JA=$(grep -oE "[0-9]+ エージェント" docs/wiki/ja/Home.md | grep -oE "[0-9]+" | sort -u | tr '\n' ',' | sed 's/,$//')

fail=0
for label_value in "README.md=$README_EN" "README.ja.md=$README_JA" "wiki/en/Home.md=$HOME_EN" "wiki/ja/Home.md=$HOME_JA"; do
  label="${label_value%%=*}"
  value="${label_value#*=}"
  if [ "$value" != "$ACTUAL" ]; then
    echo "✗ agent count mismatch: $label reports '$value', actual=$ACTUAL" >&2
    fail=1
  fi
done

# Check 2: slash command list parity
HELP_CMDS=$(grep -oE '/[a-z][a-z-]*' .claude/commands/aphelion-help.md | sort -u)
WIKI_CMDS=$(grep -oE '`/[a-z][a-z-]*' docs/wiki/en/Getting-Started.md | tr -d '`' | sort -u)
DIFF=$(diff <(echo "$HELP_CMDS") <(echo "$WIKI_CMDS") || true)
if [ -n "$DIFF" ]; then
  echo "✗ command list mismatch between aphelion-help.md and Getting-Started.md (en):" >&2
  echo "$DIFF" >&2
  fail=1
fi

exit $fail
```

これは grep ベースの**仮実装案**。developer フェーズで実装する際:
- `grep -oP` (Perl regex) は使わない（macOS BSD grep 互換のため）
- agent count の ja Home 値は `sort -u` で 1 行に正規化する（L23 / L38 で 2 回登場するため）
- HOME_JA が複数の異なる数字を返した場合（`31,32` のような結果）は、それ自身が ja Home 内ドリフトのシグナルとして失敗扱いとなる
- CI で `pull_request` イベント時に走らせる拡張は §3.2.5 で別途扱う

#### 3.2.5 CI 統合（任意拡張）

`.github/workflows/check-readme-wiki-sync.yml` を新設し、`on: pull_request` で `bash scripts/check-readme-wiki-sync.sh` を実行する。失敗時は PR ステータスチェックを fail させる。

ただしこの拡張は **本 issue ではオプション扱い**とする。ローカル実行の Checklist チェックボックスのみで運用上は十分機能する見込み。CI 化は最初の数回 PR を経て「漏れが発生する」と判明してから別 issue で追加してもよい。

### 3.3 ドキュメント変更しないもの（明示）

- README.md / README.ja.md 本文の文言変更は行わない（PR #69 の構成を保持）。
- Wiki Home / Getting-Started の本文変更は行わない。
- `.claude/rules/aphelion-overview.md` は触らない（理由: §3.2.3）。
- `.claude/commands/aphelion-help.md` も触らない（コマンド一覧は実態に既に追従している）。

---

## 4. Open questions

implementation 前にユーザー判断が必要な事項:

> **Decisions taken (2026-04-30):** Q1 → 別 issue #81 に分離 / Q5 → 別 issue #82 に分離 / Q6 → スクリプトに追加（README en ↔ ja の `^## ` 見出し parity チェックも実装）。Q2–Q4 / Q7 は推奨案を採用。実装は本 design note の §3 / §5 / §6 の通りに進める。

1. **CI 統合を本 issue で行うか、別 issue に分けるか**
   - 推奨: **別 issue に分ける**。本 issue は "documentation + local script" までを完了とし、CI 化はスクリプトが安定してから判断。
   - 理由: CI ワークフロー追加は GitHub Actions の権限（`GITHUB_TOKEN` scope）や `archive-closed-plans.yml` との干渉を再確認する必要があり、本 issue のスコープを膨らませる。
   - **2026-04-30 決定: 別 issue として #81 ([CI integration follow-up](https://github.com/kirin0198/aphelion-agents/issues/81)) を作成済み。本 issue では CI ワークフローを追加しない。**

2. **agent 数を「マニフェスト化」するか**
   - 案: `.claude/manifest.json` のようなファイルを 1 つ作り、`{ "agent_count": 31 }` を保持。スクリプトはこれを参照。
   - 推奨: **やらない**（本 issue では）。`ls .claude/agents/ | wc -l` で十分自己記述的。マニフェスト導入は overhead に見合わない。

3. **Contributing.md 拡張だけで十分か、`Architecture-*.md` にも書くか**
   - 推奨: **Contributing.md に集約**。Architecture ページは「Aphelion の構造」を説明する場所であり、貢献ルールはここではない。

4. **Features 5 項目を co-update set に含めるべきか**
   - Features は意図的に Wiki に直接対応がない（Wiki Home の Persona-Based Entry Points が機能的に近いだけ）。完全 mirror ではないので、co-update set 表に含める意義は薄い。
   - 推奨: 表には残すが「Wiki sites: (none — README-only summary)」と明示する。

5. **#75 が残したギャップ — repo-root README sync convention の所在**
   - #75 は `language-rules.md` で「README は repo-root README sync convention に従う」と宣言したが、その convention 文書自体はまだリポジトリに存在しない（grep `README sync convention` → ヒットなし。ポリシーの参照のみ）。
   - 推奨: **別 issue 推奨**。#76 のスコープは「コンテンツ層 + 整合性検査」であり、言語層の追記を混ぜると本 issue が再び肥大化する。
   - **2026-04-30 決定: 別 issue として #82 ([repo-root README sync convention follow-up](https://github.com/kirin0198/aphelion-agents/issues/82)) を作成済み。本 issue では `language-rules.md` を変更せず、convention 文書も書かない。**

6. **`scripts/check-readme-wiki-sync.sh` を README en ↔ ja の節構造チェックにも使うか**
   - 言語層は #75 + 既存の repo-root convention に委譲すると 5 で決めたが、**機械チェックを 1 ファイルに集約する価値**もある（PR 1 つでチェック箇所が 1 つに集まる）。
   - 案: スクリプトに Check 3 として「README.md と README.ja.md の `^## ` 見出し数と順序が一致」を追加。
   - 推奨: **追加する**。既存スクリプトに対する追加コストは小さく、節構造ドリフトは PR #69 直後の現状でも実害が起きうる典型ケース。
   - **2026-04-30 決定: 追加する。スクリプトには Check 3（README.md と README.ja.md の `^## ` 見出し数 + 順序の一致）を実装する。§6 AC#6 も「Q6 で『追加する』が選ばれた場合」の条件付きから無条件 AC に格上げする。**

7. **`scripts/` ディレクトリ運用**
   - 既に `scripts/smoke-update.sh` と `scripts/sync-wiki.mjs` が存在。新規ディレクトリ作成は不要、ファイル追加のみ。
   - 確認: developer 着手時に `ls scripts/` を再実行し、命名衝突がないことだけ確認する。

---

## 5. Document changes

### 5.1 編集対象ファイル

| ファイル | 変更種別 | 概要 |
|----------|----------|------|
| `docs/wiki/en/Contributing.md` | 修正 | §"README vs Wiki separation" を §"README ↔ Wiki responsibility split" にリネーム＋拡張（roles / 境界線運用ルール / co-update set 表 / 既存 #75 callout への言及）。PR Checklist に 1 行追加 |
| `docs/wiki/ja/Contributing.md` | 修正 | en と同期。`> EN canonical:` を更新 |
| `scripts/check-readme-wiki-sync.sh` | 新規 | agent count + command list（+ §4 Q6 の判断次第で README en ↔ ja 節構造）を確認する grep スクリプト。実行ビット付き |
| `docs/design-notes/readme-wiki-responsibility-split.md` | 修正（本ファイル） | 既に main にコミット済み（#78 で他 2 ノートと併せ取り込み）。実装 PR では `> Implemented in: #N` を追記して closing PR と同 commit に含める |

### 5.2 編集しないファイル

- `README.md` / `README.ja.md`（行数 75 を維持。コンテンツ層変更は範囲外）
- `docs/wiki/{en,ja}/Home.md`
- `docs/wiki/{en,ja}/Getting-Started.md`
- `.claude/commands/aphelion-help.md`
- `.claude/rules/aphelion-overview.md`
- `src/.claude/rules/language-rules.md`（#75 で完了済み。本 issue から触らない）
- `.github/workflows/`（CI 統合は §4 Q1 の判断次第で別 issue へ）

### 5.3 文書バージョン更新

- `docs/wiki/en/Contributing.md` 冒頭の `> Last updated:` を `2026-MM-DD (updated 2026-MM-DD: README ↔ Wiki responsibility split documented, #76)` に更新（#75 の更新行は残す）
- `docs/wiki/ja/Contributing.md` 冒頭の `> EN canonical:` を同日付に更新

---

## 6. Acceptance criteria

PR レビュー時に以下を機械的または目視で確認:

1. `docs/wiki/en/Contributing.md` に "Co-update set" 表が存在し、最低 4 行（agent count / slash command names / Quick Start command / mermaid 図）を含む
2. 同表が `docs/wiki/ja/Contributing.md` にも対応する形で存在し、章数・順序が en と一致
3. PR Checklist に **co-update set チェック行 1 行**が追加されている。**README en ↔ ja parity 行は追加されていない**（#75 への委譲を尊重）
4. `scripts/check-readme-wiki-sync.sh` が実行可能ファイルとして存在し、`bash scripts/check-readme-wiki-sync.sh` がリポジトリ HEAD で `exit 0` を返す
5. スクリプトを意図的に壊した 4 ケースすべてで `exit 1` を返し、stderr に違反箇所が出力される:
   - `README.md` L3 を `99 specialized agents` に変更
   - `README.ja.md` L3 を `99 の専門エージェント` に変更
   - `docs/wiki/en/Home.md` の `all 31 agents` を `all 99 agents` に変更
   - `docs/wiki/ja/Home.md` の `31 エージェント` を `99 エージェント` に変更
6. `README.md` の `^## ` 見出し数を 1 個削った状態（または順序を入れ替えた状態）でスクリプトが `exit 1` を返す（§4 Q6 = 追加する確定済み）
7. 既存の Bilingual Sync Policy / "Source of truth" callout（en/Contributing.md L137–141, #75 で追加）が壊れていない
   - `grep -n "Source of truth" docs/wiki/en/Contributing.md` がヒットすること
   - `grep -n "Bilingual Sync Policy" docs/wiki/en/Contributing.md` がヒットすること
8. 新セクションが #75 の language-rules.md を**矛盾なく参照**している（en/Contributing.md 内に `language-rules.md` への明示リンクが存在する）
9. `package.json` `version` の bump は **不要**（`.claude/` 配下を変更しないため。Contributing.md "Version bumping policy" L172–183 の対象外）

---

## 7. Out of scope

以下は本 issue の範囲外。必要なら別 issue を切る:

- **README.md / README.ja.md の文言変更**（PR #69 の構成を尊重）
- **Wiki ページの本文変更**（Home / Getting-Started 等）
- **CI 統合**（`.github/workflows/check-readme-wiki-sync.yml` の追加）
- **agent 数のマニフェスト化** (`manifest.json` / `version.lock` 等)
- **README en ↔ ja の自動翻訳・自動同期ツール導入**
- **Wiki の構造変更**（5-page Agents-Reference 分割は維持）
- **Cloudflare Pages デプロイ設定の変更**
- **`aphelion-overview.md` への記載追加**（本 issue では Contributing.md に集約）
- **既存 PR Checklist の他項目の整理**（version bumping policy, settings deny-list policy 等）

---

## 8. Handoff brief for developer

### 8.0 One-liner（PR タイトル候補）

> `refactor: document README ↔ Wiki content boundary and add cross-source consistency check script (#76)`

実装は **Contributing.md 拡張 + 1 本の grep スクリプト**で完結する。**言語層には触らない**（#75 完了範囲）。**README / Wiki 本文には触らない**（コンテンツ境界の宣言と機械チェックの導入のみ）。

### 8.1 対象ファイル

- `docs/wiki/en/Contributing.md` — 修正（§"README vs Wiki separation" → §"README ↔ Wiki responsibility split" に拡張）
- `docs/wiki/ja/Contributing.md` — 修正（en と同期、`> EN canonical:` 更新）
- `scripts/check-readme-wiki-sync.sh` — 新規（実行ビット必須、§3.2.4 のスクリプトをベースに実装）
- `docs/design-notes/readme-wiki-responsibility-split.md` — 既存ファイル。実装 PR で `> Implemented in: #N` 行を追記する（同 PR 内で）

### 8.2 編集方針

1. **§3.2.1 の文面案**をベースに `docs/wiki/en/Contributing.md` §"README vs Wiki separation" を **§"README ↔ Wiki responsibility split"** にリネームしつつ書き換える。Co-update set 表は §2.2 の表をテンプレートとして使うが、**セルに行番号は書かない**（陳腐化防止のため、ファイルパスのみに留める）。
2. §3.2.1 末尾の「**README en ↔ ja parity**」段落は、`language-rules.md` への 1 文ポインタに留める（**bilingual sync の再宣言はしない**。#75 と矛盾するため）。
3. §3.2.1 の「境界線運用ルール」段落（README に置いてよい/置かないの判定基準）を必ず含める。これが本 issue の「コンテンツ層の責任分担」アウトプット。
4. **§3.2.2 の追加 Checklist 行 1 行**を `Contributing.md` §"Pull Request Checklist" の末尾近くに追加。**README en ↔ ja parity チェック行は追加しない**。
5. **`docs/wiki/ja/Contributing.md`** を en と同じ章立てで同期更新。文面は ja の自然な敬体に。`> EN canonical:` を更新。
6. **`scripts/check-readme-wiki-sync.sh`** を §3.2.4 の案ベースで実装。注意:
   - shebang は `#!/usr/bin/env bash`
   - `set -euo pipefail`
   - macOS BSD / Linux GNU 両対応（`grep -oP` を避ける）
   - ja 側の agent count 正規表現は `[0-9]+ エージェント` で `全` プレフィクスは要求しない（実テキストに `全` は付いていない、§3.2.4 の表参照）
   - HOME_JA は L23 / L38 で 2 回登場するため `sort -u` で重複除去する
   - 失敗時は人間可読なメッセージを stderr へ（どのファイルのどの値が actual と食い違ったか）
   - `chmod +x` してコミット（`git update-index --chmod=+x` を使う）
   - §4 Q6 で「追加する」が選ばれた場合のみ Check 3（README en ↔ ja の `^## ` 見出し数比較）を実装する
7. **README / Wiki Home / Getting-Started 本文は触らない**。
8. **agent 数は実行時に `ls .claude/agents/ | wc -l` で取得**し、スクリプトにハードコードしない。
9. **`src/.claude/rules/language-rules.md` には絶対に触らない**（#75 完了範囲）。

### 8.3 検証手順

1. **スクリプトの正常系**:
   ```bash
   bash scripts/check-readme-wiki-sync.sh
   echo "exit=$?"  # exit=0 を期待
   ```
2. **スクリプトの異常系（4 サーフェスすべて）**:
   ```bash
   for f in README.md README.ja.md docs/wiki/en/Home.md docs/wiki/ja/Home.md; do
     cp "$f" "$f.bak"
     sed -i 's/31/99/' "$f"
     bash scripts/check-readme-wiki-sync.sh && echo "FAIL: $f did not trigger"
     mv "$f.bak" "$f"
   done
   ```
   各反復で `exit=1` と「`{file} reports '99', actual=31`」のような違反メッセージが出ることを確認。
3. **コマンド list parity の動作確認**:
   ```bash
   sed -i.bak 's|/aphelion-help|/aphelion-help-x|' .claude/commands/aphelion-help.md
   bash scripts/check-readme-wiki-sync.sh  # exit=1 を期待
   mv .claude/commands/aphelion-help.md.bak .claude/commands/aphelion-help.md
   ```
4. **章立て対応確認**:
   ```bash
   diff <(grep -nE "^### |^## " docs/wiki/en/Contributing.md | sed 's/^[0-9]*://') \
        <(grep -nE "^### |^## " docs/wiki/ja/Contributing.md | sed 's/^[0-9]*://')
   ```
   出力が空（en と ja で見出し構造が一致）であることを確認。
5. **#75 callout が壊れていない**:
   ```bash
   grep -n "Source of truth\|language-rules.md" docs/wiki/en/Contributing.md
   ```
   既存 2 行（L137 "Source of truth" callout、L139 への `language-rules.md` リンク）が残っていることを確認。
6. **smoke**: `bash scripts/smoke-update.sh` を念のため走らせて exit 0 を確認（既存の release-time gate）。

### 8.4 コミット・PR 方針

- ブランチ: `refactor/readme-wiki-responsibility-split`（developer が `main` から派生。`git-rules.md` § "Branch Naming" 準拠）
- コミット粒度（推奨 2 コミット、まとめても可）:
  - `docs(wiki): document README ↔ Wiki responsibility split and co-update set (#76)` — Contributing.md (en/ja) 更新 + 設計ノートの `Implemented in:` 行追記
  - `chore(scripts): add check-readme-wiki-sync.sh consistency script (#76)` — scripts/ 追加（実行ビット）
- PR 本文に必須:
  - 追加されたチェック項目の一覧
  - スクリプトの正常系・異常系の動作証跡（コピペ可な terminal 出力）
  - Contributing.md の before/after diff サマリー
  - **`Closes #76`** — `archive-closed-plans` workflow が `docs/design-notes/readme-wiki-responsibility-split.md` を `archived/` へ移動するため必須
  - **`Linked Plan: docs/design-notes/readme-wiki-responsibility-split.md`**

### 8.5 リスクと対処

| リスク | 対処 |
|--------|------|
| #75 の "Source of truth" callout（en/Contributing.md L137–141）と新セクションが矛盾する | §3.2.1 末尾の README en ↔ ja parity 段落は **`language-rules.md` への 1 文ポインタに留める**。bilingual sync を本セクションで再宣言しない。AC #7 で grep 確認 |
| Contributing.md の co-update 表が将来陳腐化（行番号などが変わる） | 表に行番号を**書かない**。セル内容は「ファイルパス + 該当箇所のキーワード」のみに留める。スクリプトが grep で動的に位置検出する |
| スクリプトが false negative（漏らし）を出す | scripts は最小実装。漏れが見つかった場合は別 issue で改善。本 issue のゴールは「主要 2 項目（agent 数 / slash command 一覧）を機械化する」 |
| CI 化を期待されるが本 issue では実装しない | PR 本文と Out of scope に明記。§4 Q1 のユーザー判断結果を反映 |
| README ↔ Wiki sync 慣行を「強制」と読まれて摩擦になる | Contributing.md 文言は "reviewers will block the PR" の強さを保ちつつ、現行 Bilingual Sync Policy の minor-fix exception を踏襲する旨を併記 |
| ja Home.md の "31 エージェント" が将来 "全 31" 形式に表記変更される | スクリプトの ja 正規表現は `[0-9]+ エージェント` のみマッチさせるので "全" の有無は関係しない。ただし `エージェント` を別語（`agent` 等）に置換されると壊れる — その場合のみスクリプト追従が必要 |

---

> **Note**: 本設計ノートは既に main にコミット済み（PR #78、#75 と併せて取り込み）。
> 実装フェーズで developer は **本 PR と同じ commit 内で** `> Implemented in: #N` 行を更新する（merge 後に `archive-closed-plans` workflow が archived/ へ移動する際、`Implemented in:` が空のままにならないようにするため）。
