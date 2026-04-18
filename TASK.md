# TASK.md

> 参照元: docs/issues/sandbox-design.md (Addendum 2026-04-18 §A.7 Phase 6〜9)

## フェーズ: Phase 6〜9（案5 infra-builder 拡張 + container isolation）
最終更新: 2026-04-18
ステータス: 完了

## タスク一覧

### Phase 6〜9（Addendum: Case 5 adoption）

- [x] TASK-006: infra-builder 拡張（devcontainer 生成テンプレ追加） | 対象ファイル: .claude/agents/infra-builder.md
- [x] TASK-007: sandbox-policy に container mode 追記 + §5 triage 表更新 | 対象ファイル: .claude/rules/sandbox-policy.md
- [x] TASK-008: sandbox-runner に execution path selection 追記 | 対象ファイル: .claude/agents/sandbox-runner.md
- [x] TASK-009: wiki (en+ja) と README 更新 | 対象ファイル: wiki/en/Platform-Guide.md, wiki/ja/Platform-Guide.md, wiki/en/Agents-Reference.md, wiki/ja/Agents-Reference.md, wiki/en/Rules-Reference.md, wiki/ja/Rules-Reference.md, README.md, README.ja.md

## 直近のコミット

- ab31dec docs: document container mode and devcontainer generation in wiki (TASK-009)
- 05c7fef feat: add container execution path and fallback to sandbox-runner (TASK-008)
- 238fabc feat: add container isolation mode to sandbox-policy (TASK-007)
- 67a1dcd feat: extend infra-builder to generate devcontainer/dev-compose (TASK-006)

## 中断時のメモ
（セッション中断時に状況をここに記録する）
