import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLAUDE_SOURCE, CODEX_SOURCE, COPILOT_SOURCE, PACKAGE_ROOT } from './sources.js';

describe('PACKAGE_ROOT', () => {
  it('パッケージルートが解決できること', () => {
    // PACKAGE_ROOT が絶対パスであることを確認
    expect(path.isAbsolute(PACKAGE_ROOT)).toBe(true);
  });

  it('CLAUDE_SOURCE が .claude ディレクトリを指していること', () => {
    expect(CLAUDE_SOURCE).toBe(path.join(PACKAGE_ROOT, '.claude'));
  });

  it('COPILOT_SOURCE が platforms/copilot ディレクトリを指していること', () => {
    expect(COPILOT_SOURCE).toBe(path.join(PACKAGE_ROOT, 'platforms', 'copilot'));
  });

  it('CODEX_SOURCE が platforms/codex ディレクトリを指していること', () => {
    expect(CODEX_SOURCE).toBe(path.join(PACKAGE_ROOT, 'platforms', 'codex'));
  });
});
