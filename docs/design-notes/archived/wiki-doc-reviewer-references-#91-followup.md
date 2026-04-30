> Last updated: 2026-04-30
> GitHub Issue: [#94](https://github.com/kirin0198/aphelion-agents/issues/94)
> Analyzed by: analyst (2026-04-30)
> Linked Issue: #91 follow-up (issue #94)
> Source spec: docs/design-notes/archived/doc-reviewer-architecture.md (architect 確定仕様)
> Source rules: .claude/orchestrator-rules.md (PR #92 でマージ済)
> Next: developer

---

## 1. Problem statement

Issue #91 の doc-reviewer agent 導入は、PR #92 (本体実装) と PR #93 (Agents-Orchestrators.md
への wiki 反映) で main にマージ済みである。一方で wiki の以下 4 ページは scope 外として
PR #93 に含まれず、現在 **canonical な仕様 (orchestrator-rules.md) と乖離した状態** に
ある:

- `docs/wiki/en/Triage-System.md` / `docs/wiki/ja/Triage-System.md`
- `docs/wiki/en/Architecture-Operational-Rules.md` / `docs/wiki/ja/Architecture-Operational-Rules.md`

これらは plan tier ごとの mandatory agent 列、Delivery / Discovery / Maintenance の phase
シーケンス、rollback rule 一覧を含む中核ページであり、doc-reviewer の auto-insertion
仕組みが未反映なのは明確な documentation drift である。本 follow-up はこの drift を
解消する。

## 2. Current state evidence

### 2.1 canonical 側 (既に main に存在)

`.claude/orchestrator-rules.md` (現行 HEAD):

- L118–168: `## Doc Reviewer Auto-insertion` セクション (Trigger Conditions /
  Double-Execution Prevention / Standalone Agent Fallback / Invocation Format)
- L479–491: `### Rollback Limit (Common)` (4 種の rollback で共有される max=3)
- L515–545: `### Doc Review FAIL Rollback Flow`
- L549–571: `### Approval Gate after Doc Review FAIL (rollback limit exceeded)`

`docs/wiki/en/Agents-Orchestrators.md` (PR #93 でマージ済):

- L4–6: 更新履歴に `2026-04-30: Add doc-reviewer (Quality Agents) per #91`
- doc-reviewer エントリは Quality Agents セクションに追加済み (en + ja 同期済)

### 2.2 反映漏れ側 (本 issue の対象)

`docs/wiki/en/Triage-System.md`:

- L102–113 Delivery Flow Triage table: doc-reviewer の post-insert 言及なし
- L114–128 Delivery Phase Sequence (Standard Example): spec-designer / ux-designer /
  architect 直後に doc-reviewer 行なし
- L155–194 Maintenance Flow Triage / Phase Sequence: analyst 後の conditional
  doc-reviewer 行なし
- L55–98 Discovery Flow Triage / Phase Sequence: scope-planner 後の post-insert なし
- L206–217 Mandatory Agents (Always Run) 表: doc-reviewer 行なし
  (security-auditor のみ記載)

`docs/wiki/ja/Triage-System.md` は en と並行構造、同位置で同様の漏れ。

`docs/wiki/en/Architecture-Operational-Rules.md`:

- L40 (および ja L41): "Maximum 3 rollbacks total" の単独宣言が残存
  → orchestrator-rules.md L479 で Rollback Limit (Common) として 4 種統合済の事実が
    反映されていない
- L114 (および ja L115): "All rollbacks are limited to **3 times maximum**" が
  Rollback Rules セクション冒頭で再宣言されている (上記 L40 と二重宣言)
- L116–151 (および ja L117–151): rollback flow は 4 種のみ列挙
  (Test Failure / Review CRITICAL / Security Audit CRITICAL / Discovery Infeasible)
  → 5 番目の "Doc Review FAIL Rollback" が欠落

## 3. Constraints

### 3.1 Bilingual Sync Policy (必須)

`docs/wiki/en/Contributing.md` L180 以降 "Bilingual Sync Policy" により、wiki ページの
en + ja は **同 PR で同時更新する**。本 issue でも 4 ファイルすべてを 1 PR にまとめる
こと (en だけ先行する PR 分割は不可)。

### 3.2 agent count parity check は通る想定

本 follow-up は agent 数を増減させない (既に PR #92 で doc-reviewer agent ファイル本体は
追加済み)。Aphelion-overview.md 上の agent count・wiki splash の数値・Agents-Reference 系
の登録などは PR #93 で同期完了している。本 issue では数値変更なし。

### 3.3 既存 rollback 上限 (max=3) の挙動を変えない

Architecture-Operational-Rules.md の L40 / L114 を Rollback Limit (Common) への参照に
書き換えるのは **値の出処を 1 箇所に集約するリファクタ** であり、上限値そのものは変えない。
これは doc-reviewer-architecture.md §4.2.1 で確定済の不変条件と同じ扱い。

### 3.4 analyst → architect スキップ → developer に直接 handoff

新規設計はゼロ。doc-reviewer-architecture.md および orchestrator-rules.md (PR #92 でマージ済)
の既存仕様を wiki に反映するだけなので、architect フェーズはスキップする。

### 3.5 Output Language / skeleton 規約

- 本 design-note の narrative は **ja** (タスク指示書による explicit 指定)
- skeleton heading (`## 1. Problem statement` など) は en 固定
  (language-rules.md "Template skeleton strings" 規約)
- wiki ページ自体は en + ja の両方を更新する (Bilingual Sync Policy)

### 3.6 wiki を読む読者層への配慮

wiki/Triage-System.md と wiki/Architecture-Operational-Rules.md は新規ユーザー /
agent 開発者の主要参照先。orchestrator-rules.md は内部ルールであり、wiki 読者は普段
そちらを見ない。**「post-insert される事実」と「rollback 上限の共通化」が wiki だけで
読み取れる粒度に保つ** こと (orchestrator-rules.md への参照リンクは添えるが、
そこを読まないと挙動が分からない記述にはしない)。

## 4. Success criteria

- [ ] `docs/wiki/en/Triage-System.md` の Delivery / Discovery / Maintenance Phase
      Sequence 図に doc-reviewer の auto-insert 行が反映されている
- [ ] 同 `Triage-System.md` の Mandatory Agents (Always Run) 表に doc-reviewer 行が追加
      されている
- [ ] `docs/wiki/en/Architecture-Operational-Rules.md` の rollback 上限記述が
      Rollback Limit (Common) (orchestrator-rules.md §Rollback Rules) への参照に
      書き換えられており、二重宣言が解消されている
- [ ] 同ファイルの Rollback Rules セクションに 5 番目として "Doc Review FAIL Rollback"
      が追加されている
- [ ] ja 側 2 ファイルが en と同一構造で同時更新されている (Bilingual Sync Policy 準拠)
- [ ] 既存挙動 (rollback max=3, security-auditor mandatory, agent count) に変更がない
      ことを diff で確認できる
- [ ] 各ファイルの `> Last updated:` および update history (該当ページにあれば) が
      更新されている

## 5. Approach

### 5.1 In scope

- 上記 4 wiki ファイルの追記・書き換え (本 design-note §6 で確定)
- 各ファイルの `> Last updated:` と update history (該当ページにあれば) の更新
- 1 PR にまとめて提出 (Bilingual Sync Policy)

### 5.2 Out of scope

- `.claude/rules/aphelion-overview.md` の更新 → PR #93 で完了済
- `.claude/rules/localization-dictionary.md` の更新 → PR #93 で完了済
- `Agents-Orchestrators.md` (en/ja) → PR #93 で完了済
- 以下の wiki ページへの doc-reviewer 言及追加 → 本 issue では対象外。必要なら別 follow-up:
  - `Architecture-Domain-Model.md` (en/ja)
  - `Architecture-Protocols.md` (en/ja)
  - `Contributing.md` (en/ja)
  - `Rules-Reference.md` (en/ja)
- agent 定義ファイルや orchestrator-rules.md 自体の編集 (canonical 側は変更不要)
- doc-reviewer の挙動仕様変更 (本 issue は仕様反映のみ)

### 5.3 Implementation strategy

developer は本 design-note §6 の追記要点をそのまま wiki に展開すれば足りる。
推奨 commit 構成:

1. `docs: wire doc-reviewer into Triage-System.md (en + ja)` — Triage-System.md の en + ja
2. `docs: add Doc Review FAIL rollback to Architecture-Operational-Rules.md (en + ja)` —
   Architecture-Operational-Rules.md の en + ja
3. (任意) chore コミットで update history 同期

ja 側は en の対訳。完全な対訳テキストは developer が作成する (本 design-note では
追記要点のみ確定)。

## 6. Document changes

### 6.1 `docs/wiki/en/Triage-System.md`

#### 6.1.1 Delivery Phase Sequence (Standard Example) (L114–128)

Phase 1 (spec-designer) / Phase 2 (ux-designer) / Phase 3 (architect) の各行末に
` → doc-reviewer (auto)` を追記する。例:

```
Phase 1:  Spec design         → spec-designer      → doc-reviewer (auto) → approval
Phase 2:  UI design           → ux-designer        → doc-reviewer (auto) → approval  [HAS_UI: true only]
Phase 3:  Architecture design → architect          → doc-reviewer (auto) → approval
```

phase 番号は据え置き。auto-insert は phase 番号を消費しない (orchestrator-rules.md
§Doc Reviewer Auto-insertion の方針に倣う)。L130–132 の "Side Entry: analyst" の段落は
変更不要 (analyst の auto-insert は Maintenance フローで扱う)。

#### 6.1.2 Discovery Phase Sequence (L66–98)

Light / Standard / Full の **最終 Phase (scope-planner)** 行末に ` → doc-reviewer (auto)`
を追記する。例 (Light):

```
Phase 3: Scope planning          → scope-planner  → doc-reviewer (auto) → approval → done
```

Standard では Phase 5、Full では Phase 6 が同様に対象。

Minimal は scope-planner が走らない (L68–73) ため自動的に doc-reviewer も走らない。
Minimal ブロック直後に以下の脚注を追加:

```
> **Note on Minimal**: Minimal plan ends after `interviewer`. Since `doc-reviewer`
> is triggered post-`scope-planner`, it is not invoked in Minimal. This is by
> structural absence, not by an explicit "skip" rule.
```

#### 6.1.3 Maintenance Phase Sequence (L168–195)

Patch / Minor / Major の **analyst 行** (Patch: Phase 2 / Minor: Phase 3 / Major: Phase 3)
の末尾に conditional auto を追記する:

```
Phase 2: Issue creation         → analyst           → doc-reviewer (conditional auto) → approval
```

Maintenance Flow Triage table (L158–163) 直後または Maintenance Phase Sequence の末尾
(L195 の `---` 直前) に以下の注記を追加:

```
> **Conditional auto for doc-reviewer**: doc-reviewer is auto-inserted after
> `analyst` only when `analyst.DOCS_UPDATED` reports SPEC.md (or ARCHITECTURE.md)
> as updated. If both are `no_change`, doc-reviewer is skipped (Patch only).
> Minor and Major always invoke doc-reviewer after analyst.
```

#### 6.1.4 Mandatory Agents (Always Run) 表 (L206–217)

L210–212 の表に doc-reviewer 行を追加する:

```
| Agent | Domain | Why Mandatory |
|-------|--------|--------------|
| `security-auditor` | Delivery | Security audit cannot be omitted. OWASP Top 10 + dependency scans run even on Minimal |
| `doc-reviewer` | Quality (cross-cutting) | Markdown artifact consistency must be verified on all plans (Minimal+). Read-only, no destructive ops; auto-inserted after spec / design / scope / analyst agents |
```

L214–217 の根拠ブロック直後に doc-reviewer の根拠を 1 行追記:

```
The `doc-reviewer` mandate is defined in
[.claude/orchestrator-rules.md](../../.claude/orchestrator-rules.md) §Doc Reviewer
Auto-insertion. It runs as a post-insert step after the trigger agents listed there.
```

#### 6.1.5 `> Last updated:` 更新

L4 の Last updated を `2026-04-30 (updated 2026-04-30: doc-reviewer references per #91 follow-up)`
に変更。L4 の上に update history が無いため、末尾の "Canonical Sources" セクションに
新規 reference として `.claude/agents/doc-reviewer.md` を追加 (任意)。

### 6.2 `docs/wiki/ja/Triage-System.md`

§6.1 と並行構造で en の対訳を反映する。

- L4 の Last updated を `2026-04-30 (updated 2026-04-30: doc-reviewer 参照を反映 (#91 follow-up))`
  に更新
- L5 の `EN canonical` を `2026-04-30 of wiki/en/Triage-System.md` に更新
- ja 側の Phase Sequence ブロックは en と同位置 (L115–129 / L67–99 / L167–195) に
  同様の追記
- Mandatory Agents 表 (L211–213) に doc-reviewer 行を追加 (ja 訳: 「Quality (横断的)」/
  「マークダウン成果物の整合性は全プラン (Minimal+) で検証する。読み取り専用で破壊的
  操作なし。spec / design / scope / analyst agent 直後に auto-insert される」)
- Conditional auto / Note on Minimal の脚注も ja 訳

### 6.3 `docs/wiki/en/Architecture-Operational-Rules.md`

#### 6.3.1 Auto-Approve Mode の Safety limits (L38–40)

L40 の `- Maximum 3 rollbacks total` を以下に書き換える:

```
- Rollback limit: shared across test / review CRITICAL / security audit CRITICAL /
  doc review FAIL rollbacks (max 3 total). See
  [.claude/orchestrator-rules.md](../../.claude/orchestrator-rules.md) §Rollback Rules
  → Rollback Limit (Common) for the canonical definition.
```

挙動値 (max 3) は変えない。出処を集約するだけ。

#### 6.3.2 Rollback Rules セクション冒頭 (L112–114)

L113–114:

> Rollbacks are triggered automatically by test failures and review CRITICAL findings.
> All rollbacks are limited to **3 times maximum**.

を以下に書き換える:

```
Rollbacks are triggered automatically by test failures, review CRITICAL findings,
security audit CRITICAL findings, and doc review FAIL results. The shared rollback
limit (max 3 across all four types) is defined as **Rollback Limit (Common)** in
[.claude/orchestrator-rules.md](../../.claude/orchestrator-rules.md) §Rollback Rules.
```

#### 6.3.3 Rollback Rules — 5 番目の rollback 追加 (L116–151)

L141 の `### Security Audit CRITICAL Rollback (Delivery domain)` ブロック直後、L143 の
`### Discovery Rollback: Infeasible Requirements` の **直前** に以下のセクションを挿入:

```markdown
### Doc Review FAIL Rollback (cross-domain; post-insert)

```
doc-reviewer (DOC_REVIEW_RESULT: fail)
  → triggering agent (spec-designer / ux-designer / architect /
                      scope-planner / analyst) for fix
    → doc-reviewer (re-check)
```

Unlike the other four rollback flows above (which are pre-insert against tester /
reviewer / security-auditor), this rollback fires **after** an upstream
markdown-producing agent finishes. The triggering agent is identified by
`doc-reviewer`'s `TRIGGERED_BY` field. See
[.claude/orchestrator-rules.md](../../.claude/orchestrator-rules.md)
§Doc Review FAIL Rollback Flow for the rollback prompt template, and §Approval Gate
after Doc Review FAIL for the rollback-limit-exceeded handling.
```

5 つの rollback 種別の順序整合のため、L143–151 の Discovery rollback はそのまま末尾に
残す (Discovery 系は他 4 種とは挙動が異なるため位置は維持)。

#### 6.3.4 `> Last updated:` 更新

L4 の Last updated を `2026-04-30 (updated 2026-04-30: doc-reviewer rollback references per #91 follow-up)`
に変更。

### 6.4 `docs/wiki/ja/Architecture-Operational-Rules.md`

§6.3 と並行構造で en の対訳を反映する。

- L4 の Last updated を `2026-04-30 (updated 2026-04-30: doc-reviewer ロールバック参照を反映 (#91 follow-up))`
  に更新
- L5 の `EN canonical` を `2026-04-30 of wiki/en/Architecture-Operational-Rules.md` に更新
- L41 (自動承認モードの Safety limits) を §6.3.1 の対訳に書き換え
- L113–115 (差し戻しルール冒頭) を §6.3.2 の対訳に書き換え
- L141 (セキュリティ監査CRITICAL差し戻しブロック) と L143 (Discovery差し戻し) の間に
  §6.3.3 の対訳を挿入。section title は `### ドキュメントレビューFAIL差し戻し（横断ドメイン；ポスト挿入型）`
  程度を想定 (developer が language-rules.md / 既存 ja 表現に従って最終決定)

## 7. Open questions

- (Q1) Triage-System.md の "Mandatory Agents (Always Run)" 表で、doc-reviewer の Domain
  欄を `Quality (cross-cutting)` とするか、`Cross-cutting` のみとするか。本 design-note
  §6.1.4 では `Quality (cross-cutting)` を推奨しているが、Agents-Orchestrators.md (en)
  では `Quality Agents` セクション配下に置かれている。**developer 判断**: en/ja とも
  `Quality (cross-cutting)` で統一を推奨 (Agents-Orchestrators.md の分類体系と整合)。
- (Q2) Architecture-Operational-Rules.md の `### Doc Review FAIL Rollback` を 5 番目に
  挿入する際、Discovery Rollback (現 5 番目) を 6 番目に押し下げる順序がよいか、
  それとも本 design-note §6.3.3 のように Discovery を末尾に残す順序を維持するか。
  本 design-note では **Discovery を末尾維持** を推奨 (Discovery 系は他 4 種と異質
  なので位置安定性を優先)。

両 open question とも実装段階で developer が選択し、PR description で明示すれば足りる
範囲。analyst から architect への blocked 化は不要。

## 8. Handoff brief for developer

- **Branch**: `docs/wiki-doc-reviewer-references-#91-followup` (slug は調整可)
- **Files to edit (4 ファイル必須)**:
  - `docs/wiki/en/Triage-System.md`
  - `docs/wiki/ja/Triage-System.md`
  - `docs/wiki/en/Architecture-Operational-Rules.md`
  - `docs/wiki/ja/Architecture-Operational-Rules.md`
- **PR は 1 つにまとめる** (Bilingual Sync Policy により en + ja 同時更新が必須)
- **PR body に必須**:
  - `Closes #<新 issue 番号>`
  - `Linked Plan: docs/design-notes/wiki-doc-reviewer-references-#91-followup.md`
  - `Linked Issue: #91 follow-up` (#91 自体は閉じない)
- **canonical 側は触らない**: `.claude/orchestrator-rules.md` / `.claude/agents/doc-reviewer.md` /
  `Agents-Orchestrators.md` は変更しない (既に main にある)
- **検証手順**:
  - `git diff` で agent 数・rollback 上限値 (max=3) に変更が無いことを確認
  - en と ja の構造一致を `diff <(grep -E '^##? ' docs/wiki/en/Triage-System.md) <(grep -E '^##? ' docs/wiki/ja/Triage-System.md)` 等で目視
  - `> Last updated:` と update history (該当ページにあれば) が同日付になっていること
- **architect スキップの根拠**:
  - 既存仕様 (doc-reviewer-architecture.md / orchestrator-rules.md) が canonical で
    既に main 入り
  - 本 issue は wiki 反映のみ。新規設計はゼロ
  - reverse-engineering も不要 (canonical → wiki への一方向反映)
- **Open question の取り扱い**: §7 の 2 件は developer 判断で決定し、PR description に
  選択結果を明示。analyst への差し戻しは不要
