# Document Versioning

## Recording Update History

When updating any design document (SPEC.md, ARCHITECTURE.md, UI_SPEC.md, TEST_PLAN.md), record the update date at the beginning of the file.

```markdown
> 最終更新: {YYYY-MM-DD}
> 更新履歴:
>   - {YYYY-MM-DD}: {変更概要}
```

## Traceability

- `architect` records which version of SPEC.md was used as the basis for design at the top of `ARCHITECTURE.md`
- `developer` records which version of ARCHITECTURE.md was used as the basis for implementation in `TASK.md`
- Each flow orchestrator records the artifact version from the previous domain in the handoff file

## TASK.md Format

State file used by `developer` to persist implementation progress across sessions.
Generated at implementation start and updated upon each task completion.

```markdown
# TASK.md

> 参照元: ARCHITECTURE.md ({バージョン or 最終更新日})

## フェーズ: {フェーズ名}
最終更新: {日時}
ステータス: 進行中

## タスク一覧

### Phase {N}
- [ ] TASK-001: {タスク名} | 対象ファイル: src/...
- [ ] TASK-002: {タスク名} | 対象ファイル: src/...

## 直近のコミット
（タスク完了のたびに git log --oneline -3 を記録する）

## 中断時のメモ
（セッション中断時に状況をここに記録する）
```
