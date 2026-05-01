#!/usr/bin/env bash
# Smoke test for `aphelion-agents update`.
# Runs in a temp directory: init -> mutate target file -> update -> assert overwrite.
# Intended for manual / pre-release runs. Exit 0 = pass, non-zero = fail.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$TMP"
node "$REPO_ROOT/bin/aphelion-agents.mjs" init >/dev/null

# Assert: settings.local.json deny-list template installed by init (#31)
if ! [ -f "$TMP/.claude/settings.local.json" ]; then
  echo "FAIL: init did not install .claude/settings.local.json"
  exit 1
fi
if ! diff -q "$REPO_ROOT/src/.claude/settings.local.json" "$TMP/.claude/settings.local.json" >/dev/null; then
  echo "FAIL: init's settings.local.json diverges from canonical src/.claude/settings.local.json"
  exit 1
fi
if ! grep -q "Bash(rm -rf /\*)" "$TMP/.claude/settings.local.json"; then
  echo "FAIL: deny-list missing destructive_fs entries"
  exit 1
fi

# Mutate target side so we can detect overwrite
echo "MUTATED" > "$TMP/.claude/rules/sandbox-policy.md"

# Run update
node "$REPO_ROOT/bin/aphelion-agents.mjs" update >/dev/null

# Assert: target file no longer contains the mutation marker
if grep -qx "MUTATED" "$TMP/.claude/rules/sandbox-policy.md"; then
  echo "FAIL: rules/sandbox-policy.md was not overwritten by update"
  exit 1
fi

# Assert: target content matches repo HEAD byte-for-byte
# (canonical source for rules/ lives at src/.claude/rules/ since 0.3.0; see #44)
if ! diff -q "$REPO_ROOT/src/.claude/rules/sandbox-policy.md" "$TMP/.claude/rules/sandbox-policy.md" >/dev/null; then
  echo "FAIL: rules/sandbox-policy.md diverges from src/.claude/rules/ HEAD"
  exit 1
fi

# Assert: settings.local.json is preserved when target side has one
echo '{"local":"keep"}' > "$TMP/.claude/settings.local.json"
node "$REPO_ROOT/bin/aphelion-agents.mjs" update >/dev/null
if ! grep -q '"local":"keep"' "$TMP/.claude/settings.local.json"; then
  echo "FAIL: settings.local.json was not preserved on update"
  exit 1
fi

echo "PASS: rules/ refreshed and settings.local.json preserved"

# ────────────────────────────────────────────────────────────────────
# Hooks MVP regression tests (#107)
# ────────────────────────────────────────────────────────────────────

# Assert: hooks/ scripts installed by init
for hook_file in aphelion-secrets-precommit.sh aphelion-sensitive-file-guard.sh aphelion-deps-postinstall.sh; do
  if ! [ -f "$TMP/.claude/hooks/$hook_file" ]; then
    echo "FAIL: init did not install .claude/hooks/$hook_file"
    exit 1
  fi
done
if ! [ -f "$TMP/.claude/hooks/lib/secret-patterns.sh" ]; then
  echo "FAIL: init did not install .claude/hooks/lib/secret-patterns.sh"
  exit 1
fi
echo "PASS: hooks/ scripts installed by init (3 hook scripts + lib)"

# Assert: hooks/ scripts have execute permission (R8 mitigation)
for hook_file in aphelion-secrets-precommit.sh aphelion-sensitive-file-guard.sh aphelion-deps-postinstall.sh; do
  if ! [ -x "$TMP/.claude/hooks/$hook_file" ]; then
    echo "FAIL: .claude/hooks/$hook_file is not executable"
    exit 1
  fi
done
echo "PASS: hooks/ scripts have execute permission (+x)"

# Assert: settings.json installed by init
if ! [ -f "$TMP/.claude/settings.json" ]; then
  echo "FAIL: init did not install .claude/settings.json"
  exit 1
fi
echo "PASS: settings.json installed by init"

# Assert: settings.json is preserved on update (R1 mitigation)
echo '{"custom":"hook_preserved"}' > "$TMP/.claude/settings.json"
node "$REPO_ROOT/bin/aphelion-agents.mjs" update >/dev/null 2>&1
if ! grep -q '"custom":"hook_preserved"' "$TMP/.claude/settings.json"; then
  echo "FAIL: settings.json was not preserved on update"
  exit 1
fi
echo "PASS: settings.json preserved on update (existing custom content kept)"

# Assert: hooks/ is refreshed (overlay) on update even when settings.json is preserved
echo "MUTATED_HOOK" > "$TMP/.claude/hooks/aphelion-secrets-precommit.sh"
node "$REPO_ROOT/bin/aphelion-agents.mjs" update >/dev/null 2>&1
if grep -qx "MUTATED_HOOK" "$TMP/.claude/hooks/aphelion-secrets-precommit.sh"; then
  echo "FAIL: hooks/aphelion-secrets-precommit.sh was not refreshed by update"
  exit 1
fi
echo "PASS: hooks/ overlay refreshed on update (canonical content restored)"

echo "PASS: all hooks MVP regression tests passed"
