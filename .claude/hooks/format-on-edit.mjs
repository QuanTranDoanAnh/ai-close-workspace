#!/usr/bin/env node
/**
 * PostToolUse hook for Edit and Write.
 * Formats the edited file with Prettier so that formatting never costs a lint-gate round (rule TS-10).
 * Never blocks: any failure is ignored.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, relativePath } from './lib.mjs';

const input = readInput();
const root = projectDir(input);
const file = relativePath(root, (input.tool_input || {}).file_path);
if (!file || !/\.(ts|mts|cts|js|mjs|cjs|json|ya?ml)$/.test(file)) process.exit(0);
if (/^(node_modules|gen|dist|\.claude\/\.state)\//.test(file) || file === 'package-lock.json') process.exit(0);

const prettier = path.join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
if (!fs.existsSync(prettier) || !fs.existsSync(path.join(root, file))) process.exit(0);

spawnSync(process.execPath, [prettier, '--write', '--ignore-unknown', '--log-level', 'silent', file], {
  cwd: root,
  stdio: 'ignore',
  timeout: 20000,
});
process.exit(0);
