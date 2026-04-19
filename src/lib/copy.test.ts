import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyDir, diffDirs, isProtectedFile, listFiles } from './copy.js';

// テスト用の一時ディレクトリ
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aphelion-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('isProtectedFile', () => {
  it('settings.local.json は保護対象と判定される', () => {
    const base = '/project';
    const destPath = '/project/.claude/settings.local.json';
    expect(isProtectedFile(destPath, base)).toBe(true);
  });

  it('settings.json は保護対象外と判定される', () => {
    const base = '/project';
    const destPath = '/project/.claude/settings.json';
    expect(isProtectedFile(destPath, base)).toBe(false);
  });

  it('通常のファイルは保護対象外と判定される', () => {
    const base = '/project';
    const destPath = '/project/.claude/agents/test.md';
    expect(isProtectedFile(destPath, base)).toBe(false);
  });
});

describe('copyDir', () => {
  it('ソースディレクトリの内容をコピーする', async () => {
    // ソースディレクトリを作成
    const srcDir = path.join(tmpDir, 'src');
    const destDir = path.join(tmpDir, 'dest');
    await fs.mkdir(srcDir);
    await fs.writeFile(path.join(srcDir, 'test.md'), 'hello world');
    await fs.mkdir(path.join(srcDir, 'subdir'));
    await fs.writeFile(path.join(srcDir, 'subdir', 'nested.md'), 'nested content');

    // コピー実行
    await copyDir(srcDir, destDir);

    // コピー結果を確認
    const topFile = await fs.readFile(path.join(destDir, 'test.md'), 'utf8');
    expect(topFile).toBe('hello world');

    const nestedFile = await fs.readFile(path.join(destDir, 'subdir', 'nested.md'), 'utf8');
    expect(nestedFile).toBe('nested content');
  });

  it('settings.local.json は保護されてコピーされない', async () => {
    // ソースと既存デスティネーションを作成
    const srcDir = path.join(tmpDir, 'src');
    const destDir = path.join(tmpDir, 'dest');
    const claudeSrcDir = path.join(srcDir, '.claude');
    const claudeDestDir = path.join(destDir, '.claude');

    await fs.mkdir(claudeSrcDir, { recursive: true });
    await fs.mkdir(claudeDestDir, { recursive: true });

    // ソースに settings.local.json を作成
    await fs.writeFile(path.join(claudeSrcDir, 'settings.local.json'), '{"from": "src"}');
    // デスティネーションに既存の settings.local.json を作成
    await fs.writeFile(path.join(claudeDestDir, 'settings.local.json'), '{"from": "dest"}');
    // 通常ファイルも追加
    await fs.writeFile(path.join(claudeSrcDir, 'CLAUDE.md'), 'claude content');

    // destBase を渡してコピー実行
    await copyDir(claudeSrcDir, claudeDestDir, { destBase: destDir });

    // settings.local.json はデスティネーションの内容が保持される
    const localSettings = await fs.readFile(
      path.join(claudeDestDir, 'settings.local.json'),
      'utf8',
    );
    expect(localSettings).toBe('{"from": "dest"}');

    // 通常ファイルはコピーされる
    const claudeMd = await fs.readFile(path.join(claudeDestDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toBe('claude content');
  });
});

describe('listFiles', () => {
  it('ディレクトリ内のファイルを再帰的にリストアップする', async () => {
    const dir = path.join(tmpDir, 'files');
    await fs.mkdir(path.join(dir, 'subdir'), { recursive: true });
    await fs.writeFile(path.join(dir, 'a.md'), 'a');
    await fs.writeFile(path.join(dir, 'subdir', 'b.md'), 'b');

    const files = await listFiles(dir);
    expect(files).toContain('a.md');
    expect(files).toContain('subdir/b.md');
    expect(files).toHaveLength(2);
  });

  it('存在しないディレクトリは空配列を返す', async () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist');
    const files = await listFiles(nonExistent);
    expect(files).toEqual([]);
  });
});

describe('diffDirs', () => {
  it('追加・変更・削除の差分を検出する', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const destDir = path.join(tmpDir, 'dest');
    await fs.mkdir(srcDir);
    await fs.mkdir(destDir);

    // src にのみ存在するファイル (added)
    await fs.writeFile(path.join(srcDir, 'new-file.md'), 'new');
    // 両方に存在するが内容が異なるファイル (modified)
    await fs.writeFile(path.join(srcDir, 'changed.md'), 'new content');
    await fs.writeFile(path.join(destDir, 'changed.md'), 'old content');
    // 両方に存在して内容が同じファイル (unchanged — modified に含まれない)
    await fs.writeFile(path.join(srcDir, 'same.md'), 'same');
    await fs.writeFile(path.join(destDir, 'same.md'), 'same');
    // dest にのみ存在するファイル (removed)
    await fs.writeFile(path.join(destDir, 'deleted.md'), 'deleted');

    const diff = await diffDirs(srcDir, destDir);

    expect(diff.added).toContain('new-file.md');
    expect(diff.modified).toContain('changed.md');
    expect(diff.modified).not.toContain('same.md');
    expect(diff.removed).toContain('deleted.md');
  });
});
