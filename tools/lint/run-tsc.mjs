#!/usr/bin/env node
/**
 * Runs the TypeScript compiler without output (rule TS-09):
 * once for the service layer and tests (root tsconfig.json), and once per app that has its own tsconfig.json.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import config from './standards.config.mjs';
import { parseArgs } from './lib/common.mjs';

const args = parseArgs();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const projects = [];

if (
  fs.existsSync(path.join(args.root, 'tsconfig.json')) &&
  ['srv', 'test', 'mock-bank'].some((d) => fs.existsSync(path.join(args.root, d)))
) {
  projects.push('tsconfig.json');
}
for (const app of Object.keys(config.apps)) {
  const file = path.posix.join('app', app, 'tsconfig.json');
  if (fs.existsSync(path.join(args.root, file))) projects.push(file);
}

let failed = false;
for (const project of projects) {
  console.log(`tsc --noEmit -p ${project}`);
  const res = spawnSync(npx, ['tsc', '--noEmit', '-p', project], { cwd: args.root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) failed = true;
}
if (!projects.length) console.log('run-tsc: no TypeScript project found, nothing to check');
process.exit(failed ? 1 : 0);
